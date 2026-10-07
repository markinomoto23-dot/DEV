from urllib.parse import quote

from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.http import HttpResponse

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser

from audittrail.utils import log_activity
from roles.permissions import HasModuleAccess
from roles.technician_scope import (
    TechnicianSupportingReadOnly,
    get_assigned_customer_ids,
    is_technician_user,
)

from .models import CustomerLocationDocument, Location
from .serializers import (
    CustomerLocationDocumentSerializer,
    LocationSerializer,
)


class LocationViewSet(viewsets.ModelViewSet):
    queryset = (
        Location.objects
        .select_related("customer")
        .all()
    )
    serializer_class = LocationSerializer
    permission_classes = [
        HasModuleAccess,
        TechnicianSupportingReadOnly,
    ]
    required_module = "locations"

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "location_name",
        "customer__company_name",
        "address_line1",
        "address_line2",
        "city",
        "state_province",
        "postal_code",
        "country",
        "contact_name",
        "contact_email",
        "phone",
    ]

    ordering_fields = [
        "location_name",
        "created_at",
        "updated_at",
    ]

    ordering = ["location_name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        customer_id = self.request.query_params.get("customer")

        if customer_id:
            try:
                customer_id = int(customer_id)
            except (TypeError, ValueError):
                raise ValidationError(
                    {"customer": "Customer must be a valid numeric ID."}
                )

            queryset = queryset.filter(
                customer_id=customer_id
            )

        if is_technician_user(self.request.user):
            queryset = queryset.filter(
                customer_id__in=get_assigned_customer_ids(
                    self.request.user
                )
            ).distinct()

        return queryset

    @staticmethod
    def serialize_value(value):
        if value is None:
            return None

        if isinstance(
            value,
            (str, int, float, bool),
        ):
            return value

        return str(value)

    def perform_create(self, serializer):
        location = serializer.save()

        log_activity(
            request=self.request,
            action="create",
            module="Locations",
            object_id=location.id,
            object_repr=location.location_name,
            description=(
                f"Location {location.location_name} was created."
            ),
            changes={
                field: self.serialize_value(value)
                for field, value
                in serializer.validated_data.items()
            },
        )

    def perform_update(self, serializer):
        location = serializer.instance
        changes = {}

        for field, new_value in serializer.validated_data.items():
            old_value = getattr(location, field, None)

            old_serialized = self.serialize_value(old_value)
            new_serialized = self.serialize_value(new_value)

            if old_serialized != new_serialized:
                changes[field] = {
                    "old": old_serialized,
                    "new": new_serialized,
                }

        location = serializer.save()

        if changes:
            log_activity(
                request=self.request,
                action="update",
                module="Locations",
                object_id=location.id,
                object_repr=location.location_name,
                description=(
                    f"Location {location.location_name} was updated."
                ),
                changes=changes,
            )

    def perform_destroy(self, instance):
        location_id = instance.id
        location_name = instance.location_name

        try:
            with transaction.atomic():
                instance.delete()

                log_activity(
                    request=self.request,
                    action="delete",
                    module="Locations",
                    object_id=location_id,
                    object_repr=location_name,
                    description=(
                        f"Location {location_name} was deleted."
                    ),
                )

        except ProtectedError as error:
            related_types = sorted({
                obj._meta.verbose_name.title()
                for obj in error.protected_objects
            })

            related_text = (
                ", ".join(related_types)
                or "related"
            )

            raise ValidationError({
                "detail": (
                    "Cannot delete this location because "
                    "it is linked to existing "
                    f"{related_text} records. "
                    "Remove or reassign those records first."
                )
            })


class CustomerLocationDocumentViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        CustomerLocationDocument.objects
        .select_related(
            "customer",
            "location",
            "uploaded_by",
        )
        .all()
    )

    serializer_class = CustomerLocationDocumentSerializer
    permission_classes = [
        HasModuleAccess,
        TechnicianSupportingReadOnly,
    ]
    required_module = "customers"
    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        customer_id = self.request.query_params.get(
            "customer"
        )

        location_id = self.request.query_params.get(
            "location"
        )

        parent_only = (
            str(
                self.request.query_params.get(
                    "parent",
                    "",
                )
            ).lower()
            == "true"
        )

        if is_technician_user(
            self.request.user
        ):
            queryset = queryset.filter(
                customer_id__in=get_assigned_customer_ids(
                    self.request.user
                )
            )

        if customer_id:
            try:
                customer_id = int(customer_id)
            except (TypeError, ValueError):
                raise ValidationError(
                    {
                        "customer":
                            "Customer must be a valid numeric ID."
                    }
                )

            queryset = queryset.filter(
                customer_id=customer_id
            )

        if location_id:
            try:
                location_id = int(location_id)
            except (TypeError, ValueError):
                raise ValidationError(
                    {
                        "location":
                            "Location must be a valid numeric ID."
                    }
                )

            queryset = queryset.filter(
                location_id=location_id
            )

        elif parent_only:
            queryset = queryset.filter(
                location__isnull=True
            )

        return queryset

    def perform_create(self, serializer):
        document = serializer.save()
        location = document.location

        description = (
            f"Document {document.original_name} was uploaded for "
            f"{document.customer.company_name}"
        )

        if location:
            description += (
                f" / {location.location_name}"
            )

        description += "."

        log_activity(
            request=self.request,
            action="create",
            module="Customer Documents",
            object_id=document.id,
            object_repr=document.original_name,
            description=description,
            changes={
                "file_name":
                    document.original_name,
                "file_size":
                    document.file_size,
            },
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="download",
    )
    def download(self, request, pk=None):
        document = self.get_object()

        response = HttpResponse(
            bytes(document.file_data),
            content_type=(
                document.content_type
                or "application/octet-stream"
            ),
        )

        encoded_name = quote(
            document.original_name
        )

        response["Content-Disposition"] = (
            "inline; "
            f"filename*=UTF-8''{encoded_name}"
        )

        response["Content-Length"] = (
            str(document.file_size)
        )

        return response

    def perform_destroy(self, instance):
        document_id = instance.id
        document_name = instance.original_name

        instance.delete()

        log_activity(
            request=self.request,
            action="delete",
            module="Customer Documents",
            object_id=document_id,
            object_repr=document_name,
            description=(
                f"Document {document_name} was deleted."
            ),
        )

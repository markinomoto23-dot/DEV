from django.db import transaction
from django.db.models.deletion import ProtectedError
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.filters import (
    SearchFilter,
    OrderingFilter,
)


from audittrail.utils import log_activity

from roles.permissions import (
    HasModuleAccess,
)

from roles.technician_scope import (
    TechnicianSupportingReadOnly,
    get_assigned_customer_ids,
    is_technician_user,
)

from .models import Equipment
from .serializers import EquipmentSerializer


class EquipmentViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        Equipment.objects
        .select_related(
            "location",
            "location__customer",
        )
        .all()
    )

    serializer_class = (
        EquipmentSerializer
    )

    permission_classes = [
        HasModuleAccess,
        TechnicianSupportingReadOnly,
    ]

    required_module = (
        "equipment"
    )

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "equipment_name",
        "equipment_type",
        "manufacturer",
        "model_number",
        "serial_number",
        "asset_tag",
        "location__location_name",
        "location__customer__company_name",
    ]

    ordering_fields = [
        "equipment_name",
        "equipment_type",
        "asset_tag",
        "serial_number",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "equipment_name",
    ]


    # =====================================================
    # AUDIT VALUE SERIALIZER
    # =====================================================

    def serialize_value(
        self,
        value,
    ):
        """Convert model/serializer values into audit-log-safe primitives."""
        if value is None:
            return None

        if isinstance(
            value,
            (
                str,
                int,
                float,
                bool,
            ),
        ):
            return value

        return str(value)


    # =====================================================
    # TECHNICIAN VISIBILITY
    # =====================================================

    def get_queryset(
        self,
    ):
        queryset = (
            super()
            .get_queryset()
        )

        customer_id = (
            self.request.query_params.get(
                "customer"
            )
        )

        location_id = (
            self.request.query_params.get(
                "location"
            )
        )

        equipment_type = (
            self.request.query_params.get(
                "equipment_type"
            )
        )

        status_value = (
            self.request.query_params.get(
                "status"
            )
        )

        ownership_type = (
            self.request.query_params.get(
                "ownership_type"
            )
        )

        if customer_id:
            queryset = queryset.filter(
                location__customer_id=customer_id
            )

        if location_id:
            queryset = queryset.filter(
                location_id=location_id
            )

        if equipment_type:
            queryset = queryset.filter(
                equipment_type__iexact=
                    equipment_type
            )

        if status_value:
            queryset = queryset.filter(
                status=status_value
            )

        if ownership_type:
            queryset = queryset.filter(
                ownership_type=
                    ownership_type
            )


        if is_technician_user(
            self.request.user
        ):
            return (
                queryset
                .filter(
                    location__customer_id__in=
                        get_assigned_customer_ids(
                            self.request.user
                        )
                )
                .distinct()
            )


        return queryset


    # =====================================================
    # NEXT ASSET TAG
    # =====================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="next-asset-tag",
    )
    def next_asset_tag(
        self,
        request,
    ):
        return Response({
            "asset_tag":
                Equipment.next_asset_tag()
        })


    # =====================================================
    # CREATE
    # =====================================================

    def perform_create(
        self,
        serializer,
    ):
        equipment = (
            serializer.save()
        )


        log_activity(
            request=self.request,

            action="create",

            module="Equipment",

            object_id=equipment.id,

            object_repr=(
                equipment.equipment_name
            ),

            description=(
                f"Equipment "
                f"{equipment.equipment_name} "
                f"was created."
            ),

            changes={
                field:
                    self.serialize_value(
                        value
                    )

                for field, value
                in serializer
                .validated_data
                .items()
            },
        )


    # =====================================================
    # UPDATE
    # =====================================================

    def perform_update(
        self,
        serializer,
    ):
        equipment = (
            serializer.instance
        )

        changes = {}


        for field, new_value in (
            serializer
            .validated_data
            .items()
        ):
            old_value = getattr(
                equipment,
                field,
                None,
            )


            old_serialized = (
                self.serialize_value(
                    old_value
                )
            )


            new_serialized = (
                self.serialize_value(
                    new_value
                )
            )


            if (
                old_serialized
                != new_serialized
            ):
                changes[field] = {
                    "old":
                        old_serialized,

                    "new":
                        new_serialized,
                }


        equipment = (
            serializer.save()
        )


        if changes:

            log_activity(
                request=self.request,

                action="update",

                module="Equipment",

                object_id=equipment.id,

                object_repr=(
                    equipment.equipment_name
                ),

                description=(
                    f"Equipment "
                    f"{equipment.equipment_name} "
                    f"was updated."
                ),

                changes=changes,
            )


    # =====================================================
    # DELETE
    # =====================================================

    def perform_destroy(
        self,
        instance,
    ):
        equipment_id = (
            instance.id
        )

        equipment_name = (
            instance.equipment_name
        )


        try:

            with transaction.atomic():

                instance.delete()


                log_activity(
                    request=self.request,

                    action="delete",

                    module="Equipment",

                    object_id=equipment_id,

                    object_repr=(
                        equipment_name
                    ),

                    description=(
                        f"Equipment "
                        f"{equipment_name} "
                        f"was deleted."
                    ),
                )


        except ProtectedError as error:

            protected_objects = list(
                error.protected_objects
            )


            related_types = sorted({
                obj._meta
                .verbose_name
                .title()

                for obj
                in protected_objects
            })


            related_text = (
                ", ".join(
                    related_types
                )
                or
                "related"
            )


            related_count = len(
                protected_objects
            )


            record_word = (
                "record"
                if related_count == 1
                else "records"
            )


            raise ValidationError({
                "detail": (
                    "Cannot delete this equipment because "
                    f"it is linked to {related_count} existing "
                    f"{related_text} {record_word}. "
                    "Remove or reassign the related "
                    f"{record_word} first."
                )
            })
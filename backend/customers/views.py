from django.db import transaction

from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
)

from audittrail.utils import log_activity
from roles.permissions import (
    HasModuleAccess,
    is_admin_user,
    is_manager_user,
    normalize_role_name,
    get_user_role,
)
from roles.technician_scope import (
    TechnicianSupportingReadOnly,
    get_assigned_customer_ids,
    is_technician_user,
)

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(
    viewsets.ModelViewSet
):
    queryset = Customer.objects.all()

    serializer_class = (
        CustomerSerializer
    )

    permission_classes = [
        HasModuleAccess,
        TechnicianSupportingReadOnly,
    ]

    required_module = "customers"

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "company_name",
        "contact_name",
        "email",
        "phone",
    ]

    ordering_fields = [
        "company_name",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "company_name",
    ]


    # =====================================================
    # TECHNICIAN VISIBILITY
    # =====================================================

    def get_queryset(self):
        queryset = super().get_queryset()

        if is_technician_user(
            self.request.user
        ):
            return (
                queryset
                .filter(
                    id__in=get_assigned_customer_ids(
                        self.request.user
                    )
                )
                .distinct()
            )

        return queryset


    # =====================================================
    # HELPER
    # =====================================================

    def serialize_value(
        self,
        value,
    ):
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
    # CREATE
    # =====================================================

    def perform_create(
        self,
        serializer,
    ):
        customer = (
            serializer.save()
        )


        log_activity(
            request=self.request,

            action="create",

            module="Customers",

            object_id=customer.id,

            object_repr=(
                customer.company_name
            ),

            description=(
                f"Customer "
                f"{customer.company_name} "
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

                if field not in {
                    "first_location_name",
                    "first_location_address",
                    "first_location_address_line1",
                    "first_location_address_line2",
                    "first_location_city",
                    "first_location_state_province",
                    "first_location_postal_code",
                    "first_location_country",
                }
            },
        )


        created_location = getattr(
            serializer,
            "created_location",
            None,
        )


        if created_location:
            log_activity(
                request=self.request,

                action="create",

                module="Locations",

                object_id=created_location.id,

                object_repr=(
                    created_location.location_name
                ),

                description=(
                    f"First location "
                    f"{created_location.location_name} "
                    f"was automatically created for "
                    f"{customer.company_name}."
                ),

                changes={
                    "customer":
                        customer.company_name,

                    "location_name":
                        created_location.location_name,

                    "address_line1":
                        created_location.address_line1,

                    "address_line2":
                        created_location.address_line2,

                    "city":
                        created_location.city,

                    "state_province":
                        created_location.state_province,

                    "postal_code":
                        created_location.postal_code,

                    "country":
                        created_location.country,

                    "status":
                        created_location.status,
                },
            )


    # =====================================================
    # UPDATE
    # =====================================================

    def perform_update(
        self,
        serializer,
    ):
        customer = (
            serializer.instance
        )

        changes = {}


        for field, new_value in (
            serializer
            .validated_data
            .items()
        ):
            old_value = getattr(
                customer,
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


        customer = (
            serializer.save()
        )


        if changes:
            log_activity(
                request=self.request,

                action="update",

                module="Customers",

                object_id=customer.id,

                object_repr=(
                    customer.company_name
                ),

                description=(
                    f"Customer "
                    f"{customer.company_name} "
                    f"was updated."
                ),

                changes=changes,
            )


    # =====================================================
    # DELETE
    # =====================================================

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        if not is_admin_user(
            request.user
        ):
            raise PermissionDenied(
                "Only an administrator can delete customers."
            )

        customer = self.get_object()

        # Preserve service history. An unused customer may be deleted,
        # including its empty locations. Customers already tied to
        # tickets or equipment should be made Inactive instead.
        has_tickets = (
            customer.tickets.exists()
        )

        has_equipment = any(
            location.equipment.exists()
            for location
            in customer.locations.all()
        )

        if (
            has_tickets
            or has_equipment
        ):
            return Response(
                {
                    "detail": (
                        "This customer has service history or equipment "
                        "and cannot be permanently deleted. Change the "
                        "customer Status to Inactive instead."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        customer_id = customer.id
        customer_name = customer.company_name

        with transaction.atomic():
            # Location.customer uses PROTECT, so remove only the
            # customer's empty/unused locations before deleting
            # the customer itself.
            customer.locations.all().delete()

            log_activity(
                request=request,
                action="delete",
                module="Customers",
                object_id=customer_id,
                object_repr=customer_name,
                description=(
                    f"Customer "
                    f"{customer_name} "
                    f"was deleted."
                ),
            )

            customer.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

# =========================================================
# QUICK CREATE CUSTOMER FROM TICKET
# =========================================================


class CustomerQuickCreateView(APIView):
    """
    Allow office users who can create tickets to create a basic
    customer without leaving the Ticket form. Technician accounts
    remain read-only.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_name = normalize_role_name(
            get_user_role(request.user)
        )

        allowed = (
            is_admin_user(request.user)
            or is_manager_user(request.user)
            or role_name == "user"
        )

        if not allowed:
            raise PermissionDenied(
                "You do not have permission to create customers from a ticket."
            )

        serializer = CustomerSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()

        display_name = (
            customer.company_name
            or customer.contact_name
            or customer.email
            or customer.phone
            or f"Customer #{customer.id}"
        )

        log_activity(
            request=request,
            action="create",
            module="Customers",
            object_id=customer.id,
            object_repr=display_name,
            description=(
                f"Customer {display_name} was created from the New Ticket form."
            ),
            changes={
                key: value
                for key, value
                in serializer.validated_data.items()
                if not str(key).startswith("first_location_")
            },
        )

        return Response(
            CustomerSerializer(customer).data,
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# ADMIN-ONLY CUSTOMER CSV IMPORT
# =========================================================

import csv
import io
import re

from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from roles.permissions import AdminOnly


class CustomerImportCSVView(APIView):
    permission_classes = [AdminOnly]
    parser_classes = [MultiPartParser, FormParser]

    @staticmethod
    def normalize_header(name):
        text = re.sub(
            r"[^a-z0-9]+",
            "_",
            str(name or "").strip().lower(),
        )
        return re.sub(r"_+", "_", text).strip("_")

    def post(self, request):
        upload = request.FILES.get("file")

        if not upload:
            raise ValidationError({
                "file": "Choose a CSV file to import."
            })

        if not upload.name.lower().endswith(".csv"):
            raise ValidationError({
                "file": "Customer/contact import must be a CSV file."
            })

        try:
            text = upload.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ValidationError({
                "file": "CSV must use UTF-8 encoding."
            })

        reader = csv.DictReader(io.StringIO(text))

        if not reader.fieldnames:
            raise ValidationError({
                "file": "CSV is missing a header row."
            })

        normalized_headers = {
            self.normalize_header(name): name
            for name in reader.fieldnames
            if name is not None
        }

        def value(row, *names):
            for name in names:
                original = normalized_headers.get(
                    self.normalize_header(name)
                )

                if (
                    original
                    and row.get(original) is not None
                ):
                    candidate = str(
                        row.get(original)
                    ).strip()

                    if candidate:
                        return candidate

            return ""

        recognized = any(
            self.normalize_header(alias)
            in normalized_headers
            for alias in [
                "company_name",
                "company",
                "business_name",
                "customer_name",
                "customer",
                "client",
                "organization",
                "name",
                "full_name",
                "contact_name",
                "first_name",
                "last_name",
                "email",
                "email_address",
                "phone",
                "phone_number",
                "mobile",
            ]
        )

        if not recognized:
            raise ValidationError({
                "file": (
                    "No recognizable customer/contact columns were found. "
                    "Use columns such as Company, Name, Contact Name, Email, or Phone."
                )
            })

        created = 0
        updated = 0
        skipped = 0
        errors = []

        valid_statuses = {
            "active",
            "inactive",
            "credit_hold",
        }

        for row_number, row in enumerate(
            reader,
            start=2,
        ):
            try:
                raw_company_name = value(
                    row,
                    "company_name",
                    "company name",
                    "company",
                    "business_name",
                    "business name",
                    "business",
                    "customer_name",
                    "customer name",
                    "customer",
                    "client",
                    "organization",
                    "organization_name",
                    "account_name",
                )

                contact_name = value(
                    row,
                    "contact_name",
                    "contact name",
                    "contact",
                    "primary_contact",
                    "primary contact",
                    "full_name",
                    "full name",
                    "name",
                )

                if not contact_name:
                    first_name = value(
                        row,
                        "first_name",
                        "first name",
                        "firstname",
                        "first",
                    )
                    last_name = value(
                        row,
                        "last_name",
                        "last name",
                        "lastname",
                        "last",
                        "surname",
                    )
                    contact_name = " ".join(
                        part
                        for part in [first_name, last_name]
                        if part
                    ).strip()

                email = value(
                    row,
                    "email",
                    "email_address",
                    "email address",
                    "e_mail",
                    "contact_email",
                    "primary_email",
                )

                phone = value(
                    row,
                    "phone",
                    "phone_number",
                    "phone number",
                    "contact_phone",
                    "mobile",
                    "mobile_number",
                    "mobile number",
                    "telephone",
                    "tel",
                )

                # Contact-only CSVs often contain just a Name column.
                # Keep that person visible in the Customers list/search by
                # using the contact name as the display customer name when
                # no company/business value was supplied.
                company_name = (
                    raw_company_name
                    or contact_name
                )

                if not any([
                    company_name,
                    contact_name,
                    email,
                    phone,
                ]):
                    skipped += 1
                    errors.append({
                        "row": row_number,
                        "detail": (
                            "No customer/contact name, email, or phone was found."
                        ),
                    })
                    continue

                status_value = value(
                    row,
                    "status",
                    "customer_status",
                    "customer status",
                ).lower()

                notes = value(
                    row,
                    "notes",
                    "note",
                    "remarks",
                    "comments",
                    "comment",
                )

                customer = None

                # Match company records first only when the CSV actually
                # supplied a company/business name. Contact-only files prefer
                # email/phone before falling back to a person's name.
                if raw_company_name:
                    customer = (
                        Customer.objects
                        .filter(
                            company_name__iexact=raw_company_name
                        )
                        .order_by("id")
                        .first()
                    )

                if customer is None and email:
                    customer = (
                        Customer.objects
                        .filter(email__iexact=email)
                        .order_by("id")
                        .first()
                    )

                if customer is None and phone:
                    customer = (
                        Customer.objects
                        .filter(phone=phone)
                        .order_by("id")
                        .first()
                    )

                if customer is None and contact_name:
                    customer = (
                        Customer.objects
                        .filter(
                            contact_name__iexact=contact_name
                        )
                        .order_by("id")
                        .first()
                    )

                if customer is None:
                    Customer.objects.create(
                        company_name=company_name,
                        contact_name=contact_name,
                        email=email,
                        phone=phone,
                        status=(
                            status_value
                            if status_value in valid_statuses
                            else "active"
                        ),
                        notes=notes,
                    )
                    created += 1
                    continue

                changed = False

                updates = {
                    "company_name": company_name,
                    "contact_name": contact_name,
                    "email": email,
                    "phone": phone,
                    "notes": notes,
                }

                for field, new_value in updates.items():
                    # Do not erase existing information just because the CSV
                    # cell is blank.
                    if (
                        new_value
                        and getattr(customer, field) != new_value
                    ):
                        setattr(
                            customer,
                            field,
                            new_value,
                        )
                        changed = True

                if (
                    status_value in valid_statuses
                    and customer.status != status_value
                ):
                    customer.status = status_value
                    changed = True

                if changed:
                    customer.save()

                updated += 1

            except Exception as exc:
                skipped += 1
                errors.append({
                    "row": row_number,
                    "detail": str(exc),
                })

        log_activity(
            request=request,
            action="other",
            module="Customers",
            description=(
                f"Imported customer/contact CSV: {created} created, "
                f"{updated} updated, {skipped} skipped."
            ),
            changes={
                "created": created,
                "updated": updated,
                "skipped": skipped,
            },
        )

        return Response({
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "processed": created + updated,
            "errors": errors[:50],
        })

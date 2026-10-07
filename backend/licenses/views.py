from rest_framework import viewsets
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

from .models import License
from .serializers import LicenseSerializer


class LicenseViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        License.objects
        .select_related(
            "equipment",
            "equipment__location",
            "equipment__location__customer",
        )
        .all()
    )

    serializer_class = (
        LicenseSerializer
    )

    permission_classes = [
        HasModuleAccess,
        TechnicianSupportingReadOnly,
    ]

    required_module = (
        "licenses"
    )

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "license_number",
        "license_type",
        "provider",
        "product_key",
        "status",
        "equipment__equipment_name",
        "equipment__serial_number",
        "equipment__location__location_name",
        "equipment__location__customer__company_name",
    ]

    ordering_fields = [
        "license_number",
        "license_type",
        "provider",
        "issue_date",
        "expiration_date",
        "quantity",
        "status",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "expiration_date",
    ]


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

        equipment_id = (
            self.request.query_params.get(
                "equipment"
            )
        )

        if customer_id:
            queryset = queryset.filter(
                equipment__location__customer_id=customer_id
            )

        if location_id:
            queryset = queryset.filter(
                equipment__location_id=location_id
            )

        if equipment_id:
            queryset = queryset.filter(
                equipment_id=equipment_id
            )


        if is_technician_user(
            self.request.user
        ):
            return (
                queryset
                .filter(
                    equipment__location__customer_id__in=
                        get_assigned_customer_ids(
                            self.request.user
                        )
                )
                .distinct()
            )


        return queryset


    # =====================================================
    # HELPERS
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


    def get_license_name(
        self,
        license_record,
    ):
        if (
            license_record
            .license_number
        ):
            return (
                license_record
                .license_number
            )


        if (
            license_record
            .license_type
        ):
            return (
                license_record
                .license_type
            )


        if (
            license_record
            .equipment
        ):
            return (
                license_record
                .equipment
                .equipment_name
            )


        return (
            f"License "
            f"#{license_record.id}"
        )


    # =====================================================
    # CREATE
    # =====================================================

    def perform_create(
        self,
        serializer,
    ):
        license_record = (
            serializer.save()
        )


        license_name = (
            self.get_license_name(
                license_record
            )
        )


        log_activity(
            request=self.request,

            action="create",

            module="Licenses",

            object_id=(
                license_record.id
            ),

            object_repr=(
                license_name
            ),

            description=(
                f"License "
                f"{license_name} "
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
        license_record = (
            serializer.instance
        )

        changes = {}


        for field, new_value in (
            serializer
            .validated_data
            .items()
        ):

            old_value = getattr(
                license_record,
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


        license_record = (
            serializer.save()
        )


        license_name = (
            self.get_license_name(
                license_record
            )
        )


        if changes:

            log_activity(
                request=self.request,

                action="update",

                module="Licenses",

                object_id=(
                    license_record.id
                ),

                object_repr=(
                    license_name
                ),

                description=(
                    f"License "
                    f"{license_name} "
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
        license_id = (
            instance.id
        )


        license_name = (
            self.get_license_name(
                instance
            )
        )


        instance.delete()


        log_activity(
            request=self.request,

            action="delete",

            module="Licenses",

            object_id=(
                license_id
            ),

            object_repr=(
                license_name
            ),

            description=(
                f"License "
                f"{license_name} "
                f"was deleted."
            ),
        )
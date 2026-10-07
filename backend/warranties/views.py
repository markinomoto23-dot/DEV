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

from .models import Warranty
from .serializers import WarrantySerializer


class WarrantyViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        Warranty.objects
        .select_related(
            "equipment",
            "equipment__location",
            "equipment__location__customer",
        )
        .all()
    )

    serializer_class = (
        WarrantySerializer
    )

    permission_classes = [
        HasModuleAccess,
        TechnicianSupportingReadOnly,
    ]

    required_module = (
        "warranties"
    )

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "warranty_number",
        "provider",
        "coverage_type",
        "status",
        "equipment__equipment_name",
        "equipment__serial_number",
        "equipment__location__location_name",
        "equipment__location__customer__company_name",
    ]

    ordering_fields = [
        "warranty_number",
        "provider",
        "start_date",
        "expiration_date",
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


    def get_warranty_name(
        self,
        warranty,
    ):
        if (
            warranty.warranty_number
        ):
            return (
                warranty.warranty_number
            )


        if warranty.equipment:
            return (
                warranty
                .equipment
                .equipment_name
            )


        return (
            f"Warranty #{warranty.id}"
        )


    # =====================================================
    # CREATE
    # =====================================================

    def perform_create(
        self,
        serializer,
    ):
        warranty = (
            serializer.save()
        )


        warranty_name = (
            self.get_warranty_name(
                warranty
            )
        )


        log_activity(
            request=self.request,

            action="create",

            module="Warranties",

            object_id=warranty.id,

            object_repr=(
                warranty_name
            ),

            description=(
                f"Warranty "
                f"{warranty_name} "
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
        warranty = (
            serializer.instance
        )

        changes = {}


        for field, new_value in (
            serializer
            .validated_data
            .items()
        ):

            old_value = getattr(
                warranty,
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


        warranty = (
            serializer.save()
        )


        warranty_name = (
            self.get_warranty_name(
                warranty
            )
        )


        if changes:

            log_activity(
                request=self.request,

                action="update",

                module="Warranties",

                object_id=warranty.id,

                object_repr=(
                    warranty_name
                ),

                description=(
                    f"Warranty "
                    f"{warranty_name} "
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
        warranty_id = (
            instance.id
        )

        warranty_name = (
            self.get_warranty_name(
                instance
            )
        )


        instance.delete()


        log_activity(
            request=self.request,

            action="delete",

            module="Warranties",

            object_id=(
                warranty_id
            ),

            object_repr=(
                warranty_name
            ),

            description=(
                f"Warranty "
                f"{warranty_name} "
                f"was deleted."
            ),
        )
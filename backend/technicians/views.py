from rest_framework import viewsets
from rest_framework.filters import (
    SearchFilter,
    OrderingFilter,
)

from audittrail.utils import log_activity
from roles.permissions import HasModuleAccess

from .models import Technician
from .serializers import TechnicianSerializer


class TechnicianViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        Technician.objects
        .select_related("user")
        .all()
    )

    serializer_class = (
        TechnicianSerializer
    )

    permission_classes = [
        HasModuleAccess,
    ]

    required_module = "technicians"

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "specialization",
        "user__username",
    ]

    ordering_fields = [
        "employee_id",
        "first_name",
        "last_name",
        "hourly_rate",
        "hire_date",
        "created_at",
    ]

    ordering = [
        "first_name",
        "last_name",
    ]


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


    def get_technician_name(
        self,
        technician,
    ):
        full_name = (
            f"{technician.first_name} "
            f"{technician.last_name}"
        ).strip()

        if full_name:
            return full_name

        if technician.employee_id:
            return technician.employee_id

        return (
            f"Technician #{technician.id}"
        )


    def is_sensitive_field(
        self,
        field,
    ):
        return field in {
            "password",
            "confirm_password",
        }


    # =====================================================
    # CREATE
    # =====================================================

    def perform_create(
        self,
        serializer,
    ):
        technician = (
            serializer.save()
        )

        technician_name = (
            self.get_technician_name(
                technician
            )
        )


        safe_changes = {
            field:
                self.serialize_value(
                    value
                )

            for field, value
            in serializer
            .validated_data
            .items()

            if not self.is_sensitive_field(
                field
            )
        }


        log_activity(
            request=self.request,

            action="create",

            module="Technicians",

            object_id=technician.id,

            object_repr=technician_name,

            description=(
                f"Technician "
                f"{technician_name} "
                f"was created."
            ),

            changes=safe_changes,
        )


    # =====================================================
    # UPDATE
    # =====================================================

    def perform_update(
        self,
        serializer,
    ):
        technician = (
            serializer.instance
        )

        changes = {}


        for field, new_value in (
            serializer
            .validated_data
            .items()
        ):

            # NEVER LOG PASSWORDS

            if self.is_sensitive_field(
                field
            ):
                continue


            # Username belongs to linked User,
            # not directly to Technician.

            if field == "username":

                old_value = (
                    technician.user.username
                    if technician.user
                    else None
                )

            else:
                old_value = getattr(
                    technician,
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


        technician = (
            serializer.save()
        )


        technician_name = (
            self.get_technician_name(
                technician
            )
        )


        if changes:
            log_activity(
                request=self.request,

                action="update",

                module="Technicians",

                object_id=technician.id,

                object_repr=technician_name,

                description=(
                    f"Technician "
                    f"{technician_name} "
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
        technician_id = (
            instance.id
        )

        technician_name = (
            self.get_technician_name(
                instance
            )
        )


        # Delete first.
        # Only create audit record when deletion succeeds.

        instance.delete()


        log_activity(
            request=self.request,

            action="delete",

            module="Technicians",

            object_id=technician_id,

            object_repr=technician_name,

            description=(
                f"Technician "
                f"{technician_name} "
                f"was deleted."
            ),
        )
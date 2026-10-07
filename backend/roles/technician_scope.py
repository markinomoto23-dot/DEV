from django.db.models import Q

from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)

from technicians.models import Technician
from tickets.models import Ticket

from .permissions import get_user_role


# =========================================================
# ROLE HELPERS
# =========================================================

def normalize_role_name(
    role,
):
    if not role:
        return ""

    return (
        str(role.name)
        .strip()
        .lower()
    )


def is_admin_user(
    user,
):
    if (
        not user
        or not user.is_authenticated
    ):
        return False

    if user.is_superuser:
        return True

    role = get_user_role(
        user
    )

    return (
        normalize_role_name(
            role
        )
        == "admin"
    )


# =========================================================
# LINKED TECHNICIAN
# =========================================================

def get_linked_technician(
    user,
):
    if (
        not user
        or not user.is_authenticated
    ):
        return None

    return (
        Technician.objects
        .filter(
            user=user
        )
        .first()
    )


def is_technician_user(
    user,
):
    if (
        not user
        or not user.is_authenticated
    ):
        return False

    if is_admin_user(
        user
    ):
        return False

    role = get_user_role(
        user
    )

    return (
        normalize_role_name(
            role
        )
        == "technician"
    )


# =========================================================
# ASSIGNED TICKETS
# =========================================================

def get_assigned_tickets(
    user,
):
    technician = (
        get_linked_technician(
            user
        )
    )

    if not technician:
        return (
            Ticket.objects.none()
        )

    # Current tickets use the ManyToMany `technicians` field.
    # Keep the legacy single `technician` field in the query so
    # older tickets remain visible to the assigned technician.
    return (
        Ticket.objects
        .filter(
            Q(technicians=technician)
            | Q(technician=technician)
        )
        .distinct()
    )


# =========================================================
# ASSIGNED CUSTOMER IDS
# =========================================================

def get_assigned_customer_ids(
    user,
):
    return (
        get_assigned_tickets(
            user
        )
        .values_list(
            "customer_id",
            flat=True,
        )
        .distinct()
    )


# =========================================================
# ASSIGNED LOCATION IDS
# =========================================================

def get_assigned_location_ids(
    user,
):
    return (
        get_assigned_tickets(
            user
        )
        .exclude(
            location_id__isnull=True
        )
        .values_list(
            "location_id",
            flat=True,
        )
        .distinct()
    )


# =========================================================
# ASSIGNED EQUIPMENT IDS
# =========================================================

def get_assigned_equipment_ids(
    user,
):
    return (
        get_assigned_tickets(
            user
        )
        .exclude(
            equipment_id__isnull=True
        )
        .values_list(
            "equipment_id",
            flat=True,
        )
        .distinct()
    )


# =========================================================
# TECHNICIAN SUPPORTING RECORDS
#
# Technician:
# GET / HEAD / OPTIONS only
#
# Admin / other authorized roles:
# Existing module permissions continue to apply.
# =========================================================

class TechnicianSupportingReadOnly(
    BasePermission
):
    message = (
        "Technicians have read-only access "
        "to records related to their assigned tickets."
    )


    def has_permission(
        self,
        request,
        view,
    ):
        if is_technician_user(
            request.user
        ):
            return (
                request.method
                in SAFE_METHODS
            )

        return True
from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_user_role(user):
    try:
        return user.profile.role
    except Exception:
        return None


def normalize_role_name(role_or_name):
    if not role_or_name:
        return ""
    name = getattr(role_or_name, "name", role_or_name)
    return str(name).strip().lower()


def get_role_name(user):
    if not user or not user.is_authenticated:
        return ""
    if user.is_superuser:
        return "super admin"
    return normalize_role_name(get_user_role(user))


def is_admin_user(user):
    return get_role_name(user) in {"admin", "super admin", "administrator"}


def is_manager_user(user):
    return get_role_name(user) in {"manager", "service manager"}


def is_technician_role_user(user):
    return get_role_name(user) == "technician"


def can_export_data(user):
    """Client requirement: only Admin/Super Admin may export customer/system data."""
    return is_admin_user(user)


class HasModuleAccess(BasePermission):
    message = "You do not have permission to access this module."

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        module = getattr(view, "required_module", None)
        if not module:
            return False

        role = get_user_role(user)
        if not role:
            return module in ["dashboard", "notifications"]

        # Technician customer access is intentionally read-only and
        # limited by CustomerViewSet to customers assigned through
        # the technician's tickets. This does not grant edit access.
        if (
            module == "customers"
            and is_technician_role_user(user)
        ):
            return request.method in SAFE_METHODS

        permission_field = f"can_access_{module}"
        return bool(getattr(role, permission_field, False))


class CanManageUsers(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = get_user_role(request.user)
        return bool(role and role.can_manage_users)


class CanManageRoles(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = get_user_role(request.user)
        return bool(role and role.can_manage_roles)


class AdminOnly(BasePermission):
    message = "Only an administrator can perform this action."

    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and is_admin_user(request.user))

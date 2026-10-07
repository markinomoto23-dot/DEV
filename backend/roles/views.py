import json

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models.deletion import ProtectedError

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
)

from rest_framework.permissions import (
    IsAuthenticated,
)

from rest_framework.response import Response

from rest_framework.views import APIView

from audittrail.utils import log_activity

from .models import (
    Role,
    UserProfile,
)

from .permissions import (
    CanManageRoles,
    CanManageUsers,
    is_admin_user,
    is_manager_user,
    is_technician_role_user,
)


from .serializers import (
    RoleSerializer,
    UserSerializer,
)


# =========================================================
# AUDIT HELPERS
# =========================================================

SENSITIVE_FIELDS = {
    "password",
    "password1",
    "password2",
    "current_password",
    "new_password",
    "confirm_password",
}


def audit_value(value):
    """
    Convert values into JSON-friendly / readable values
    for Audit Trail.
    """

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

    if isinstance(
        value,
        (
            dict,
            list,
            tuple,
        ),
    ):
        try:
            return json.dumps(
                value,
                default=str,
                sort_keys=True,
            )

        except Exception:
            return str(value)

    return str(value)


def clean_snapshot(data):
    """
    Remove sensitive fields and convert values
    into readable audit values.
    """

    cleaned = {}

    for field, value in dict(
        data
    ).items():

        if field in SENSITIVE_FIELDS:
            continue

        cleaned[field] = (
            audit_value(
                value
            )
        )

    return cleaned


def build_changes(
    before,
    after,
):
    """
    Compare serializer output before and after update.
    """

    changes = {}

    fields = (
        set(before.keys())
        |
        set(after.keys())
    )

    for field in fields:

        if field in SENSITIVE_FIELDS:
            continue

        old_value = (
            audit_value(
                before.get(
                    field
                )
            )
        )

        new_value = (
            audit_value(
                after.get(
                    field
                )
            )
        )

        if old_value != new_value:
            changes[field] = {
                "old":
                    old_value,

                "new":
                    new_value,
            }

    return changes


# =========================================================
# ROLE VIEWSET
# =========================================================

class RoleViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        Role.objects
        .all()
    )

    serializer_class = (
        RoleSerializer
    )

    permission_classes = [
        CanManageRoles,
    ]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    ordering = [
        "name",
    ]


    # =====================================================
    # CREATE ROLE
    # =====================================================

    def perform_create(
        self,
        serializer,
    ):
        role = (
            serializer.save()
        )

        role_data = (
            RoleSerializer(
                role,
                context={
                    "request":
                        self.request,
                },
            ).data
        )

        log_activity(
            request=self.request,

            action="create",

            module="Roles",

            object_id=role.id,

            object_repr=role.name,

            description=(
                f"Role "
                f"{role.name} "
                f"was created."
            ),

            changes=(
                clean_snapshot(
                    role_data
                )
            ),
        )


    # =====================================================
    # UPDATE ROLE
    # =====================================================

    def perform_update(
        self,
        serializer,
    ):
        role = (
            serializer.instance
        )

        before_data = (
            RoleSerializer(
                role,
                context={
                    "request":
                        self.request,
                },
            ).data
        )

        before_data = (
            clean_snapshot(
                before_data
            )
        )


        role = (
            serializer.save()
        )


        after_data = (
            RoleSerializer(
                role,
                context={
                    "request":
                        self.request,
                },
            ).data
        )

        after_data = (
            clean_snapshot(
                after_data
            )
        )


        changes = (
            build_changes(
                before_data,
                after_data,
            )
        )


        if changes:

            log_activity(
                request=self.request,

                action="update",

                module="Roles",

                object_id=role.id,

                object_repr=role.name,

                description=(
                    f"Role "
                    f"{role.name} "
                    f"was updated."
                ),

                changes=changes,
            )


    # =====================================================
    # DELETE ROLE
    # =====================================================

    def perform_destroy(
        self,
        instance,
    ):
        role_id = (
            instance.id
        )

        role_name = (
            instance.name
        )


        log_activity(
            request=self.request,

            action="delete",

            module="Roles",

            object_id=role_id,

            object_repr=role_name,

            description=(
                f"Role "
                f"{role_name} "
                f"was deleted."
            ),
        )


        instance.delete()


# =========================================================
# USER VIEWSET
# =========================================================

class UserViewSet(
    viewsets.ModelViewSet
):
    queryset = (
        User.objects
        .select_related(
            "profile",
            "profile__role",
        )
        .all()
        .order_by(
            "username"
        )
    )

    serializer_class = (
        UserSerializer
    )

    permission_classes = [
        CanManageUsers,
    ]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
        "profile__role__name",
    ]

    ordering_fields = [
        "username",
        "first_name",
        "last_name",
        "date_joined",
    ]


    def get_queryset(self):
        queryset = super().get_queryset()
        if is_manager_user(self.request.user):
            # Managers may manage technician accounts only.
            queryset = queryset.filter(profile__role__name__iexact="Technician")
        return queryset

    def _enforce_manager_user_scope(self, serializer, instance=None):
        if not is_manager_user(self.request.user):
            return

        profile_data = serializer.validated_data.get("profile", {})
        requested_role = profile_data.get("role")
        if requested_role is None and instance is not None:
            requested_role = getattr(getattr(instance, "profile", None), "role", None)

        if not requested_role or str(requested_role.name).strip().lower() != "technician":
            raise PermissionDenied(
                "Managers can create and manage Technician accounts only. "
                "Only an administrator can create or assign Manager/Admin roles."
            )

    # =====================================================
    # CREATE USER
    # =====================================================

    def perform_create(
        self,
        serializer,
    ):
        self._enforce_manager_user_scope(serializer)

        user = (
            serializer.save()
        )

        user_data = (
            UserSerializer(
                user,
                context={
                    "request":
                        self.request,
                },
            ).data
        )


        log_activity(
            request=self.request,

            action="create",

            module="Users",

            object_id=user.id,

            object_repr=user.username,

            description=(
                f"User "
                f"{user.username} "
                f"was created."
            ),

            changes=(
                clean_snapshot(
                    user_data
                )
            ),
        )


    # =====================================================
    # UPDATE USER
    # =====================================================

    def perform_update(
        self,
        serializer,
    ):
        self._enforce_manager_user_scope(serializer, serializer.instance)

        user = (
            serializer.instance
        )


        before_data = (
            UserSerializer(
                user,
                context={
                    "request":
                        self.request,
                },
            ).data
        )

        before_data = (
            clean_snapshot(
                before_data
            )
        )


        user = (
            serializer.save()
        )


        # Refresh relationships such as
        # UserProfile / Role.

        user.refresh_from_db()


        after_data = (
            UserSerializer(
                user,
                context={
                    "request":
                        self.request,
                },
            ).data
        )

        after_data = (
            clean_snapshot(
                after_data
            )
        )


        changes = (
            build_changes(
                before_data,
                after_data,
            )
        )


        if changes:

            log_activity(
                request=self.request,

                action="update",

                module="Users",

                object_id=user.id,

                object_repr=user.username,

                description=(
                    f"User "
                    f"{user.username} "
                    f"was updated."
                ),

                changes=changes,
            )


    # =====================================================
    # DELETE USER
    # =====================================================

    def perform_destroy(
        self,
        instance,
    ):
        if is_manager_user(self.request.user):
            role_name = str(getattr(getattr(instance, "profile", None), "role", "") or "").lower()
            if "technician" not in role_name:
                raise PermissionDenied("Managers can delete Technician accounts only.")

        user_id = (
            instance.id
        )

        username = (
            instance.username
        )


        # =================================================
        # PREVENT SELF DELETE
        # =================================================

        if (
            instance.id
            ==
            self.request.user.id
        ):
            raise ValidationError({
                "detail": (
                    "You cannot delete your own account "
                    "while you are logged in."
                )
            })


        # =================================================
        # PROTECT SUPER ADMIN
        # =================================================

        if instance.is_superuser:

            raise ValidationError({
                "detail": (
                    "Super Admin accounts cannot be deleted."
                )
            })


        # =================================================
        # GET LINKED TECHNICIAN
        # =================================================

        technician = (
            getattr(
                instance,
                "technician_profile",
                None,
            )
        )


        technician_id = None
        technician_name = None


        if technician:

            technician_id = (
                technician.id
            )

            technician_name = (
                technician.full_name
                or
                technician.employee_id
            )


        # =================================================
        # DELETE ACCOUNT
        # =================================================

        try:

            with transaction.atomic():

                # =========================================
                # TECHNICIAN PROFILE
                # =========================================

                if technician:

                    technician.delete()


                # =========================================
                # USER ACCOUNT
                # =========================================

                instance.delete()


                # =========================================
                # TECHNICIAN AUDIT
                #
                # Only runs if deletion succeeds.
                # =========================================

                if technician:

                    log_activity(
                        request=self.request,

                        action="delete",

                        module="Technicians",

                        object_id=(
                            technician_id
                        ),

                        object_repr=(
                            technician_name
                        ),

                        description=(
                            f"Technician "
                            f"{technician_name} "
                            f"was deleted together with "
                            f"user account {username}."
                        ),
                    )


                # =========================================
                # USER AUDIT
                #
                # Only runs if deletion succeeds.
                # =========================================

                log_activity(
                    request=self.request,

                    action="delete",

                    module="Users",

                    object_id=user_id,

                    object_repr=username,

                    description=(
                        f"User "
                        f"{username} "
                        f"was deleted."
                    ),
                )


        # =================================================
        # RELATED SERVICE RECORD PROTECTION
        # =================================================

        except ProtectedError as error:

            related_types = sorted({
                obj._meta
                .verbose_name
                .title()

                for obj
                in error.protected_objects
            })


            related_text = (
                ", ".join(
                    related_types
                )
                or
                "related service"
            )


            raise ValidationError({
                "detail": (
                    "Cannot delete this technician account "
                    "because the technician is linked to "
                    f"existing {related_text} records. "
                    "Reassign or remove those records first."
                )
            })


# =========================================================
# MY PERMISSIONS
# =========================================================
class MyPermissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def _module_permissions(self, role, superuser=False):
        modules = [
            "dashboard", "customers", "locations", "equipment",
            "warranties", "licenses", "tickets", "technicians",
            "billing", "reports", "users", "roles", "audit_trail",
            "notifications", "settings",
        ]
        if superuser:
            return {name: True for name in modules}
        if not role:
            return {
                name: name in {"dashboard", "notifications"}
                for name in modules
            }
        return {
            name: bool(getattr(role, f"can_access_{name}", False))
            for name in modules
        }

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.select_related("role").get_or_create(user=user)
        role = profile.role
        role_name = "Super Admin" if user.is_superuser else (role.name if role else None)

        admin = is_admin_user(user)
        manager = is_manager_user(user)
        technician = is_technician_role_user(user)
        normalized_role = str(role_name or "").strip().lower()
        regular_user = normalized_role == "user"

        module_permissions = self._module_permissions(
            role,
            user.is_superuser,
        )

        # Technicians may open the Customers module, but CustomerViewSet
        # restricts the records to assigned customers and blocks writes.
        if technician:
            module_permissions["customers"] = True

        ticket_access = module_permissions.get(
            "tickets",
            False,
        )

        # Extra UI capabilities for the new MVP features. Existing Technician
        # access is intentionally preserved rather than replaced with a new
        # read-only permission layer.
        actions = {
            "can_export": admin,
            "can_print_tickets": bool(ticket_access),
            "can_create_tickets": bool(admin or manager or regular_user),
            "can_edit_tickets": bool(admin or manager or regular_user),
            "can_delete_tickets": admin,
            "can_manage_customers": bool(admin or manager or regular_user),
            "can_delete_customers": admin,
            "can_manage_equipment": bool(admin or manager or regular_user),
            "can_manage_technicians": bool(admin or manager),
            "can_assign_technicians": bool(admin or manager),
            "can_view_billable_hours": admin,
            "can_access_calendar": bool(ticket_access),
        }

        return Response({
            "user_id": user.id,
            "username": user.username,
            "role": role_name,
            "permissions": module_permissions,
            "can_manage_users": True if user.is_superuser else bool(role and role.can_manage_users),
            "can_manage_roles": True if user.is_superuser else bool(role and role.can_manage_roles),
            "actions": actions,
        })

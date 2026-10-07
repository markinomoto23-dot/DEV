from django.contrib import admin

from .models import (
    Role,
    UserProfile,
)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "is_system",
        "can_manage_users",
        "can_manage_roles",
        "updated_at",
    )

    search_fields = (
        "name",
        "description",
    )


@admin.register(UserProfile)
class UserProfileAdmin(
    admin.ModelAdmin
):
    list_display = (
        "user",
        "role",
        "updated_at",
    )

    search_fields = (
        "user__username",
        "user__first_name",
        "user__last_name",
        "role__name",
    )

    list_filter = (
        "role",
    )
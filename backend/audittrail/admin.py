from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(
    admin.ModelAdmin
):
    list_display = (
        "created_at",
        "user",
        "action",
        "module",
        "object_repr",
        "ip_address",
    )

    list_filter = (
        "action",
        "module",
        "created_at",
    )

    search_fields = (
        "user__username",
        "object_repr",
        "description",
        "object_id",
    )

    readonly_fields = (
        "user",
        "action",
        "module",
        "object_id",
        "object_repr",
        "description",
        "changes",
        "ip_address",
        "created_at",
    )

    def has_add_permission(
        self,
        request
    ):
        return False

    def has_change_permission(
        self,
        request,
        obj=None
    ):
        return False

    def has_delete_permission(
        self,
        request,
        obj=None
    ):
        return False
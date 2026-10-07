from rest_framework import viewsets
from rest_framework.filters import (
    OrderingFilter,
    SearchFilter,
)

from roles.permissions import (
    HasModuleAccess,
)

from .models import AuditLog
from .serializers import (
    AuditLogSerializer,
)


class AuditLogViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        AuditLogSerializer
    )

    permission_classes = [
        HasModuleAccess,
    ]

    required_module = (
        "audit_trail"
    )

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "user__username",
        "user__first_name",
        "user__last_name",
        "action",
        "module",
        "object_id",
        "object_repr",
        "description",
        "ip_address",
    ]

    ordering_fields = [
        "created_at",
        "action",
        "module",
    ]

    ordering = [
        "-created_at"
    ]

    def get_queryset(self):
        queryset = (
            AuditLog.objects
            .select_related("user")
            .all()
        )

        action = (
            self.request
            .query_params
            .get("action")
        )

        module = (
            self.request
            .query_params
            .get("module")
        )

        username = (
            self.request
            .query_params
            .get("username")
        )

        if action:
            queryset = queryset.filter(
                action=action
            )

        if module:
            queryset = queryset.filter(
                module=module
            )

        if username:
            queryset = queryset.filter(
                user__username=username
            )

        return queryset
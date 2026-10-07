from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(
    serializers.ModelSerializer
):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
        allow_null=True,
    )

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog

        fields = [
            "id",

            "user",
            "username",
            "full_name",

            "action",
            "module",

            "object_id",
            "object_repr",

            "description",
            "changes",

            "ip_address",

            "created_at",
        ]

        read_only_fields = fields

    def get_full_name(
        self,
        obj
    ):
        if not obj.user:
            return "System"

        full_name = (
            obj.user.get_full_name()
            .strip()
        )

        return (
            full_name or
            obj.user.username
        )
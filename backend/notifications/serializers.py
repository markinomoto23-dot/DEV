from django.utils import timezone
from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification

        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "module",
            "object_id",
            "link",
            "is_read",
            "created_at",
            "read_at",
        ]

        read_only_fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "module",
            "object_id",
            "link",
            "created_at",
            "read_at",
        ]

    def update(self, instance, validated_data):

        old_read_status = instance.is_read

        instance = super().update(
            instance,
            validated_data,
        )

        if (
            instance.is_read
            and not old_read_status
        ):
            instance.read_at = timezone.now()

        elif not instance.is_read:
            instance.read_at = None

        instance.save(
            update_fields=[
                "is_read",
                "read_at",
            ]
        )

        return instance
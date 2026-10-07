from django.contrib.auth.models import User
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("login", "Login"),
        ("logout", "Logout"),
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("status_change", "Status Change"),
        ("assignment", "Assignment"),
        ("payment", "Payment"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        blank=True,
        null=True,
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
    )

    module = models.CharField(
        max_length=100,
    )

    object_id = models.CharField(
        max_length=100,
        blank=True,
    )

    object_repr = models.CharField(
        max_length=255,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    changes = models.JSONField(
        default=dict,
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = [
            "-created_at"
        ]

        indexes = [
            models.Index(
                fields=[
                    "module",
                    "created_at",
                ]
            ),

            models.Index(
                fields=[
                    "action",
                    "created_at",
                ]
            ),
        ]

    def __str__(self):
        username = (
            self.user.username
            if self.user
            else "System"
        )

        return (
            f"{username} - "
            f"{self.action} - "
            f"{self.module}"
        )
from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ("ticket_assignment", "Ticket Assignment"),
        ("ticket_due", "Ticket Due Soon"),
        ("ticket_overdue", "Ticket Overdue"),
        ("warranty_expiry", "Warranty Expiration"),
        ("license_expiry", "License Expiration"),
        ("system", "System"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="system_notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default="system",
    )

    title = models.CharField(max_length=200)

    message = models.TextField()

    module = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )

    object_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    link = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=[
                    "recipient",
                    "is_read",
                    "created_at",
                ]
            ),
        ]

    def __str__(self):
        return f"{self.recipient} - {self.title}"
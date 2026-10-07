from django.contrib.auth.models import User
from django.db import models


class Role(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_system = models.BooleanField(
        default=False,
    )

    # ==========================
    # MODULE ACCESS
    # ==========================

    can_access_dashboard = models.BooleanField(
        default=True
    )

    can_access_customers = models.BooleanField(
        default=False
    )

    can_access_locations = models.BooleanField(
        default=False
    )

    can_access_equipment = models.BooleanField(
        default=False
    )

    can_access_warranties = models.BooleanField(
        default=False
    )

    can_access_licenses = models.BooleanField(
        default=False
    )

    can_access_tickets = models.BooleanField(
        default=False
    )

    can_access_technicians = models.BooleanField(
        default=False
    )

    can_access_billing = models.BooleanField(
        default=False
    )

    can_access_reports = models.BooleanField(
        default=False
    )

    can_access_users = models.BooleanField(
        default=False
    )

    can_access_roles = models.BooleanField(
        default=False
    )

    can_access_audit_trail = models.BooleanField(
        default=False
    )

    can_access_notifications = models.BooleanField(
        default=True
    )

    can_access_settings = models.BooleanField(
        default=False
    )

    # ==========================
    # MANAGEMENT ACCESS
    # ==========================

    can_manage_users = models.BooleanField(
        default=False
    )

    can_manage_roles = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name or f"Role {self.pk or ""}".strip()


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        related_name="users",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        role_name = (
            self.role.name
            if self.role
            else "No Role"
        )

        return (
            f"{self.user.username} - "
            f"{role_name}"
        )
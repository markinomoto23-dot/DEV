from django.db import models


class SystemSetting(models.Model):
    # =========================================
    # GENERAL SETTINGS
    # =========================================

    system_name = models.CharField(
        max_length=150,
        blank=True,
        default="Expert Technology Service Management",
    )

    company_name = models.CharField(
        max_length=150,
        blank=True,
        default="Expert Technology",
    )

    support_email = models.EmailField(
        blank=True,
        default="Tickets@experttechnology.net",
    )

    contact_number = models.CharField(
        max_length=50,
        blank=True,
        default="985-242-4343",
    )


    # =========================================
    # NOTIFICATION SETTINGS
    # =========================================

    ticket_due_soon_days = models.PositiveIntegerField(
        default=3,
        help_text="Number of days before a ticket due date to send a notification.",
    )

    warranty_expiry_warning_days = models.PositiveIntegerField(
        default=30,
        help_text="Number of days before warranty expiration to send a notification.",
    )

    license_expiry_warning_days = models.PositiveIntegerField(
        default=30,
        help_text="Number of days before license expiration to send a notification.",
    )


    # =========================================
    # SYSTEM PREFERENCES
    # =========================================

    TIMEZONE_CHOICES = [
        ("Asia/Manila", "Asia/Manila"),
        ("UTC", "UTC"),
        ("America/New_York", "America/New_York"),
        ("America/Chicago", "America/Chicago"),
        ("America/Denver", "America/Denver"),
        ("America/Los_Angeles", "America/Los_Angeles"),
    ]

    timezone = models.CharField(
        max_length=100,
        choices=TIMEZONE_CHOICES,
        default="America/Chicago",
    )


    DATE_FORMAT_CHOICES = [
        ("MM/DD/YYYY", "MM/DD/YYYY"),
        ("DD/MM/YYYY", "DD/MM/YYYY"),
        ("YYYY-MM-DD", "YYYY-MM-DD"),
    ]

    date_format = models.CharField(
        max_length=20,
        choices=DATE_FORMAT_CHOICES,
        default="MM/DD/YYYY",
    )


    # =========================================
    # SECURITY SETTINGS
    # =========================================

    session_timeout_minutes = models.PositiveIntegerField(
        default=60,
        help_text="Automatic logout time in minutes.",
    )

    require_strong_password = models.BooleanField(
        default=True,
    )


    # =========================================
    # META
    # =========================================

    updated_at = models.DateTimeField(
        auto_now=True,
    )


    def save(self, *args, **kwargs):
        # Keep this as a single system-wide settings record.
        self.pk = 1
        super().save(*args, **kwargs)


    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


    def __str__(self):
        return self.system_name or "System Settings"
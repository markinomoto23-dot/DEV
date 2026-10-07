import re

from django.db import models
from locations.models import Location


class Equipment(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("out_of_service", "Out of Service"),
    ]

    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        related_name="equipment",
        blank=True,
        null=True,
    )

    equipment_name = models.CharField(max_length=150, blank=True, default="")

    equipment_type = models.CharField(
        max_length=100,
        blank=True,
    )

    manufacturer = models.CharField(
        max_length=100,
        blank=True,
    )

    model_number = models.CharField(
        max_length=100,
        blank=True,
    )

    serial_number = models.CharField(
        max_length=100,
        blank=True,
    )

    asset_tag = models.CharField(
        max_length=100,
        blank=True,
    )

    OWNERSHIP_CHOICES = [
        ("owned", "Customer Owned"),
        ("leased", "Leased Asset"),
        ("rented", "Rented"),
    ]

    ownership_type = models.CharField(
        max_length=20,
        choices=OWNERSHIP_CHOICES,
        default="owned",
    )

    lease_provider = models.CharField(
        max_length=150,
        blank=True,
    )

    lease_end_date = models.DateField(
        blank=True,
        null=True,
    )

    installation_date = models.DateField(
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="active",
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["equipment_name"]


    AUTO_ASSET_TAG_PREFIX = "ET-"
    AUTO_ASSET_TAG_WIDTH = 4

    @classmethod
    def next_asset_tag(cls):
        """Return the next ET-#### asset tag without changing existing records."""
        pattern = re.compile(
            rf"^{re.escape(cls.AUTO_ASSET_TAG_PREFIX)}(\d+)$",
            re.IGNORECASE,
        )

        highest_number = 0

        for value in (
            cls.objects
            .exclude(asset_tag="")
            .values_list(
                "asset_tag",
                flat=True,
            )
        ):
            match = pattern.fullmatch(
                str(value or "").strip()
            )

            if match:
                highest_number = max(
                    highest_number,
                    int(match.group(1)),
                )

        next_number = highest_number + 1

        while True:
            candidate = (
                f"{cls.AUTO_ASSET_TAG_PREFIX}"
                f"{next_number:0{cls.AUTO_ASSET_TAG_WIDTH}d}"
            )

            if not cls.objects.filter(
                asset_tag__iexact=candidate
            ).exists():
                return candidate

            next_number += 1

    def __str__(self):
        location_name = self.location.location_name if self.location else "No Location"
        return f"{self.equipment_name or 'Unnamed Equipment'} - {location_name}"
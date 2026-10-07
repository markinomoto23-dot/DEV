from django.db import models
from equipment.models import Equipment


class License(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("suspended", "Suspended"),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        related_name="licenses",
        blank=True,
        null=True,
    )

    license_number = models.CharField(
        max_length=150,
        blank=True,
    )

    license_type = models.CharField(
        max_length=150,
        blank=True,
    )

    provider = models.CharField(
        max_length=150,
        blank=True,
    )

    issue_date = models.DateField(
        blank=True,
        null=True,
    )

    expiration_date = models.DateField(
        blank=True,
        null=True,
    )

    quantity = models.PositiveIntegerField(
        default=1,
    )

    product_key = models.CharField(
        max_length=255,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        equipment_name = (
            self.equipment.equipment_name
            if self.equipment
            else "No Equipment"
        )
        return (
            f"{self.license_number or self.license_type or 'License'} - "
            f"{equipment_name}"
        )
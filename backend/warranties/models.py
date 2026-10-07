from django.db import models
from equipment.models import Equipment


class Warranty(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("void", "Void"),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        related_name="warranties",
        blank=True,
        null=True,
    )

    provider = models.CharField(
        max_length=150,
        blank=True,
    )

    warranty_number = models.CharField(
        max_length=100,
        blank=True,
    )

    start_date = models.DateField(
        blank=True,
        null=True,
    )

    expiration_date = models.DateField(
        blank=True,
        null=True,
    )

    coverage_type = models.CharField(
        max_length=150,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        equipment_name = (
            self.equipment.equipment_name
            if self.equipment
            else "No Equipment"
        )
        return (
            f"{equipment_name} - "
            f"{self.warranty_number or 'Warranty'}"
        )
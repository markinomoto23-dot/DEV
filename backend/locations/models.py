from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from customers.models import Customer


class Location(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("credit_hold", "Credit Hold"),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        related_name="locations",
        blank=True,
        null=True,
    )

    location_name = models.CharField(max_length=150, blank=True, default="")
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state_province = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=30, blank=True)
    country = models.CharField(max_length=100, blank=True)
    contact_name = models.CharField(max_length=150, blank=True)
    contact_email = models.EmailField(max_length=254, blank=True)
    phone = models.CharField(max_length=30, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["location_name"]

    def __str__(self):
        customer_name = self.customer.company_name if self.customer else "No Customer"
        return f"{customer_name} - {self.location_name or 'Unnamed Location'}"


class CustomerLocationDocument(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="documents",
        blank=True,
        null=True,
    )

    # Store the document directly in PostgreSQL for the demo.
    # This avoids Vercel's read-only filesystem.
    file_data = models.BinaryField()
    original_name = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField(default=0)
    content_type = models.CharField(
        max_length=150,
        blank=True,
        default="application/octet-stream",
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="customer_documents",
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def clean(self):
        super().clean()

        if (
            self.location_id
            and self.customer_id
            and self.location.customer_id != self.customer_id
        ):
            raise ValidationError(
                {
                    "location": (
                        "The selected location does not belong "
                        "to this customer."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        scope = (
            self.location.location_name
            if self.location_id
            else self.customer.company_name
        )
        return f"{scope} - {self.original_name}"

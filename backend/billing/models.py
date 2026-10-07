from decimal import Decimal

from django.db import models
from django.utils import timezone

from tickets.models import Ticket
from technicians.models import Technician


class Billing(models.Model):
    STATUS_CHOICES = [
        ("unpaid", "Unpaid"),
        ("partial", "Partial"),
        ("paid", "Paid"),
        ("void", "Void"),
    ]

    invoice_number = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
    )

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.SET_NULL,
        related_name="billings",
        blank=True,
        null=True,
    )

    technician = models.ForeignKey(
        Technician,
        on_delete=models.SET_NULL,
        related_name="billings",
        blank=True,
        null=True,
    )

    labor_hours = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
    )

    labor_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    parts_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    other_charges = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        editable=False,
    )

    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        editable=False,
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        editable=False,
    )

    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="unpaid",
    )

    issued_date = models.DateField(
        default=timezone.localdate,
    )

    due_date = models.DateField(
        blank=True,
        null=True,
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

    @property
    def balance(self):
        balance = self.total_amount - self.paid_amount

        return max(
            balance,
            Decimal("0.00"),
        )

    @property
    def labor_total(self):
        return (
            self.labor_hours *
            self.labor_rate
        )

    def save(self, *args, **kwargs):
        # Automatically use technician assigned
        # to the ticket if none is selected.
        if (
            not self.technician and
            self.ticket and
            self.ticket.technician
        ):
            self.technician = (
                self.ticket.technician
            )

        # Automatically use technician hourly rate.
        if (
            self.technician and
            self.labor_rate == 0
        ):
            self.labor_rate = (
                self.technician.hourly_rate
            )

        labor_total = (
            self.labor_hours *
            self.labor_rate
        )

        calculated_subtotal = (
            labor_total
            + self.parts_cost
            + self.other_charges
            - self.discount
        )

        self.subtotal = max(
            calculated_subtotal,
            Decimal("0.00"),
        )

        self.tax_amount = (
            self.subtotal *
            self.tax_rate /
            Decimal("100")
        )

        self.total_amount = (
            self.subtotal +
            self.tax_amount
        )

        if self.status != "void":
            if self.paid_amount <= 0:
                self.status = "unpaid"

            elif (
                self.paid_amount >=
                self.total_amount
            ):
                self.status = "paid"

            else:
                self.status = "partial"

        is_new = self.pk is None

        super().save(*args, **kwargs)

        if (
            is_new and
            not self.invoice_number
        ):
            invoice_number = (
                f"INV-{self.pk:06d}"
            )

            type(self).objects.filter(
                pk=self.pk
            ).update(
                invoice_number=invoice_number
            )

            self.invoice_number = (
                invoice_number
            )

    def __str__(self):
        ticket_number = (
            self.ticket.ticket_number
            if self.ticket
            else "No Ticket"
        )
        return (
            f"{self.invoice_number or 'New Invoice'}"
            f" - {ticket_number}"
        )
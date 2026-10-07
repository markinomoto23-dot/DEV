from django.conf import settings
from django.db import models

from customers.models import Customer
from locations.models import Location
from equipment.models import Equipment
from technicians.models import Technician


class Ticket(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("closed", "Closed"),
    ]

    CATEGORY_CHOICES = [
        ("service", "Service Request"),
        ("repair", "Repair"),
        ("maintenance", "Maintenance"),
        ("installation", "Installation"),
        ("inspection", "Inspection"),
        ("other", "Other"),
    ]

    RECURRENCE_CHOICES = [
        ("none", "Does not repeat"),
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
    ]

    ticket_number = models.CharField(max_length=30, unique=True, blank=True)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        related_name="tickets",
        blank=True,
        null=True,
    )

    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="tickets",
        blank=True,
        null=True,
    )

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.PROTECT,
        related_name="tickets",
        blank=True,
        null=True,
    )

    subject = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True)

    # Snapshot/contact fields allow the work ticket to preserve the contact
    # used for that visit even if the customer profile changes later.
    contact_name = models.CharField(max_length=150, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default="service",
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="medium",
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="open",
    )

    # Legacy single-technician fields are retained for backward compatibility
    # with existing data and older billing records. New UI/API uses technicians.
    assigned_technician = models.CharField(max_length=150, blank=True)
    technician = models.ForeignKey(
        Technician,
        on_delete=models.SET_NULL,
        related_name="legacy_tickets",
        blank=True,
        null=True,
    )

    technicians = models.ManyToManyField(
        Technician,
        related_name="tickets",
        blank=True,
    )

    due_date = models.DateField(blank=True, null=True)

    # Scheduling / calendar fields.
    service_date = models.DateField(blank=True, null=True)
    start_time = models.TimeField(blank=True, null=True)
    end_time = models.TimeField(blank=True, null=True)
    recurrence_type = models.CharField(
        max_length=20,
        choices=RECURRENCE_CHOICES,
        default="none",
    )
    recurrence_end_date = models.DateField(blank=True, null=True)

    resolved_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)

    # Paper work-ticket sections requested by the client.
    work_performed = models.TextField(blank=True)
    time_on_site = models.TextField(blank=True)
    equipment_materials_used = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_tickets",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_scheduled(self):
        return bool(self.service_date and self.technicians.exists())

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new and not self.ticket_number:
            ticket_number = f"TKT-{self.pk:06d}"
            type(self).objects.filter(pk=self.pk).update(ticket_number=ticket_number)
            self.ticket_number = ticket_number

    def __str__(self):
        return f"{self.ticket_number or 'New Ticket'} - {self.subject or 'No Subject'}"


class TicketAttachment(models.Model):
    ATTACHMENT_TYPE_CHOICES = [
        ("general", "General Attachment"),
        (
            "completed_work_ticket",
            "Completed Work Ticket",
        ),
    ]

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="attachments",
    )

    attachment_type = models.CharField(
        max_length=40,
        choices=ATTACHMENT_TYPE_CHOICES,
        default="general",
        db_index=True,
    )

    # Store the uploaded attachment directly in PostgreSQL.
    # This avoids Vercel's read-only /var/task filesystem.
    file_data = models.BinaryField(blank=True, default=bytes)
    original_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveBigIntegerField(default=0)
    content_type = models.CharField(max_length=150, blank=True)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="ticket_attachments",
        null=True,
        blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.original_name or f"Attachment {self.pk}"

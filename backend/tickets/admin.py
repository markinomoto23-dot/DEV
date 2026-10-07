from django.contrib import admin

from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "ticket_number",
        "subject",
        "customer",
        "location",
        "equipment",
        "priority",
        "status",
        "technician",   
        "due_date",
        "created_at",
    )

    search_fields = (
        "ticket_number",
        "subject",
        "customer__company_name",
        "location__location_name",
        "equipment__equipment_name",
        "equipment__serial_number",
        "assigned_technician",
    )

    list_filter = (
        "status",
        "priority",
        "category",
        "created_at",
    )

    readonly_fields = (
        "ticket_number",
        "created_at",
        "updated_at",
    )
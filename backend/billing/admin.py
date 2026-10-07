from django.contrib import admin

from .models import Billing


@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "ticket",
        "technician",
        "total_amount",
        "paid_amount",
        "status",
        "issued_date",
        "due_date",
    )

    search_fields = (
        "invoice_number",
        "ticket__ticket_number",
        "ticket__customer__company_name",
        "technician__employee_id",
        "technician__first_name",
        "technician__last_name",
    )

    list_filter = (
        "status",
        "issued_date",
        "due_date",
    )

    readonly_fields = (
        "invoice_number",
        "subtotal",
        "tax_amount",
        "total_amount",
        "created_at",
        "updated_at",
    )
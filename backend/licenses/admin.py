from django.contrib import admin
from .models import License


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = (
        "license_number",
        "license_type",
        "equipment",
        "provider",
        "issue_date",
        "expiration_date",
        "quantity",
        "status",
    )

    search_fields = (
        "license_number",
        "license_type",
        "provider",
        "equipment__equipment_name",
        "equipment__serial_number",
        "equipment__location__customer__company_name",
    )

    list_filter = (
        "status",
        "license_type",
        "provider",
    )
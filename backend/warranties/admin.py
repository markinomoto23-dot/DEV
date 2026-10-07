from django.contrib import admin
from .models import Warranty


@admin.register(Warranty)
class WarrantyAdmin(admin.ModelAdmin):
    list_display = (
        "warranty_number",
        "equipment",
        "provider",
        "start_date",
        "expiration_date",
        "status",
    )

    search_fields = (
        "warranty_number",
        "provider",
        "equipment__equipment_name",
        "equipment__serial_number",
    )

    list_filter = (
        "status",
        "provider",
    )
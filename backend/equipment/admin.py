from django.contrib import admin
from .models import Equipment


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = (
        "equipment_name",
        "equipment_type",
        "location",
        "manufacturer",
        "model_number",
        "serial_number",
        "status",
        "created_at",
    )

    search_fields = (
        "equipment_name",
        "equipment_type",
        "manufacturer",
        "model_number",
        "serial_number",
        "asset_tag",
        "location__location_name",
        "location__customer__company_name",
    )

    list_filter = (
        "status",
        "equipment_type",
        "manufacturer",
    )
from django.contrib import admin
from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = (
        "location_name",
        "customer",
        "city",
        "state_province",
        "phone",
        "status",
        "created_at",
    )

    search_fields = (
        "location_name",
        "customer__company_name",
        "city",
        "state_province",
        "contact_name",
        "phone",
    )

    list_filter = (
        "status",
        "city",
        "state_province",
    )
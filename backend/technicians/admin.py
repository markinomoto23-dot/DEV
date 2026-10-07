from django.contrib import admin

from .models import Technician


@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "specialization",
        "hourly_rate",
        "status",
    )

    search_fields = (
        "employee_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "specialization",
    )

    list_filter = (
        "status",
        "specialization",
        "hire_date",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )
from rest_framework import serializers
from .models import License


class LicenseSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(
        source="equipment.equipment_name",
        read_only=True,
        allow_null=True,
    )

    customer_name = serializers.CharField(
        source="equipment.location.customer.company_name",
        read_only=True,
        allow_null=True,
    )

    location_name = serializers.CharField(
        source="equipment.location.location_name",
        read_only=True,
        allow_null=True,
    )

    serial_number = serializers.CharField(
        source="equipment.serial_number",
        read_only=True,
    )

    class Meta:
        model = License

        fields = [
            "id",
            "equipment",
            "equipment_name",
            "customer_name",
            "location_name",
            "serial_number",
            "license_number",
            "license_type",
            "provider",
            "issue_date",
            "expiration_date",
            "quantity",
            "product_key",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "equipment": {
                "required": False,
                "allow_null": True,
            },
        }

        read_only_fields = [
            "id",
            "equipment_name",
            "customer_name",
            "location_name",
            "serial_number",
            "created_at",
            "updated_at",
        ]
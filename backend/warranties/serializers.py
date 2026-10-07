from rest_framework import serializers
from .models import Warranty


class WarrantySerializer(serializers.ModelSerializer):
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

    class Meta:
        model = Warranty

        fields = [
            "id",
            "equipment",
            "equipment_name",
            "customer_name",
            "location_name",
            "provider",
            "warranty_number",
            "start_date",
            "expiration_date",
            "coverage_type",
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
            "created_at",
            "updated_at",
        ]
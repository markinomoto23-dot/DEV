from django.db import transaction
from rest_framework import serializers
from .models import Equipment


class EquipmentSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(
        source="location.location_name",
        read_only=True,
        allow_null=True,
    )

    customer = serializers.IntegerField(
        source="location.customer.id",
        read_only=True,
        allow_null=True,
    )

    customer_name = serializers.CharField(
        source="location.customer.company_name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Equipment

        fields = [
            "id",
            "location",
            "location_name",
            "customer",
            "customer_name",
            "equipment_name",
            "equipment_type",
            "manufacturer",
            "model_number",
            "serial_number",
            "asset_tag",
            "ownership_type",
            "lease_provider",
            "lease_end_date",
            "installation_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "location": {
                "required": False,
                "allow_null": True,
            },
            "equipment_name": {
                "required": False,
                "allow_blank": True,
            },
        }

        read_only_fields = [
            "id",
            "location_name",
            "customer",
            "customer_name",
            "created_at",
            "updated_at",
        ]

    def validate_asset_tag(
        self,
        value,
    ):
        asset_tag = str(
            value or ""
        ).strip()

        if not asset_tag:
            return ""

        existing = (
            Equipment.objects
            .filter(
                asset_tag__iexact=asset_tag
            )
        )

        if self.instance:
            existing = existing.exclude(
                pk=self.instance.pk
            )

        if existing.exists():
            raise serializers.ValidationError(
                "This asset tag is already in use."
            )

        return asset_tag

    def create(self, validated_data):
        # Equipment records may be created before identifying details are known.
        # Keep Asset Tag blank when the user leaves it blank so it can be
        # completed later with the rest of the equipment information.
        validated_data["asset_tag"] = str(
            validated_data.get("asset_tag", "") or ""
        ).strip()
        return super().create(validated_data)

    def validate(self, attrs):
        ownership_type = attrs.get(
            "ownership_type",
            getattr(self.instance, "ownership_type", "owned"),
        )

        if ownership_type == "rented":
            # Rented assets are owned by the company and billed monthly,
            # so they do not have a lease provider or lease end date.
            attrs["lease_provider"] = ""
            attrs["lease_end_date"] = None

        return attrs

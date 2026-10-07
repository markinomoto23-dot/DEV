from django.db import transaction
from rest_framework import serializers

from locations.models import Location

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    first_location_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=150,
    )

    # Backwards-compatible alias used by older clients.
    first_location_address = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=255,
    )

    first_location_address_line1 = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=255,
    )

    first_location_address_line2 = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=255,
    )

    first_location_city = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=100,
    )

    first_location_state_province = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=100,
    )

    first_location_postal_code = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=30,
    )

    first_location_country = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="United States",
        max_length=100,
    )

    class Meta:
        model = Customer

        fields = [
            "id",
            "company_name",
            "contact_name",
            "email",
            "phone",
            "status",
            "notes",
            "first_location_name",
            "first_location_address",
            "first_location_address_line1",
            "first_location_address_line2",
            "first_location_city",
            "first_location_state_province",
            "first_location_postal_code",
            "first_location_country",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "company_name": {
                "required": False,
                "allow_blank": True,
            },
        }

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if self.instance is None:
            attrs["first_location_name"] = str(
                attrs.get("first_location_name", "")
            ).strip()

            attrs["first_location_address_line1"] = str(
                attrs.get("first_location_address_line1", "")
                or attrs.get("first_location_address", "")
            ).strip()

            for field in [
                "first_location_address_line2",
                "first_location_city",
                "first_location_state_province",
                "first_location_postal_code",
            ]:
                attrs[field] = str(attrs.get(field, "")).strip()

            attrs["first_location_country"] = (
                str(attrs.get("first_location_country", "")).strip()
                or "United States"
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        location_name = validated_data.pop("first_location_name", "")
        validated_data.pop("first_location_address", None)
        location_address_line1 = validated_data.pop("first_location_address_line1", "")
        location_address_line2 = validated_data.pop("first_location_address_line2", "")
        location_city = validated_data.pop("first_location_city", "")
        location_state_province = validated_data.pop("first_location_state_province", "")
        location_postal_code = validated_data.pop("first_location_postal_code", "")
        location_country = validated_data.pop("first_location_country", "United States") or "United States"

        customer = Customer.objects.create(**validated_data)

        has_location_details = any([
            location_name,
            location_address_line1,
            location_address_line2,
            location_city,
            location_state_province,
            location_postal_code,
        ])

        self.created_location = None
        if has_location_details:
            self.created_location = Location.objects.create(
                customer=customer,
                location_name=location_name,
                address_line1=location_address_line1,
                address_line2=location_address_line2,
                city=location_city,
                state_province=location_state_province,
                postal_code=location_postal_code,
                country=location_country,
                status="active",
            )

        return customer

    def update(self, instance, validated_data):
        # These fields only belong to the create-customer flow.
        validated_data.pop(
            "first_location_name",
            None,
        )
        validated_data.pop(
            "first_location_address",
            None,
        )

        for field in [
            "first_location_address_line1",
            "first_location_address_line2",
            "first_location_city",
            "first_location_state_province",
            "first_location_postal_code",
            "first_location_country",
        ]:
            validated_data.pop(
                field,
                None,
            )

        return super().update(
            instance,
            validated_data,
        )

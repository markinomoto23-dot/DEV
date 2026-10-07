from rest_framework import serializers

from .models import CustomerLocationDocument, Location


# Keep uploads small because files are stored directly in PostgreSQL.
MAX_DOCUMENT_SIZE = 4 * 1024 * 1024  # 4 MB


class LocationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.company_name",
        read_only=True,
        allow_null=True,
    )

    country = serializers.CharField(
        required=False,
        allow_blank=True,
        default="United States",
        max_length=100,
    )

    class Meta:
        model = Location
        fields = [
            "id",
            "customer",
            "customer_name",
            "location_name",
            "address_line1",
            "address_line2",
            "city",
            "state_province",
            "postal_code",
            "country",
            "contact_name",
            "contact_email",
            "phone",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "customer": {
                "required": False,
                "allow_null": True,
            },
            "location_name": {
                "required": False,
                "allow_blank": True,
            },
        }

        read_only_fields = [
            "id",
            "customer_name",
            "created_at",
            "updated_at",
        ]


    def create(self, validated_data):
        validated_data["country"] = (
            str(
                validated_data.get(
                    "country",
                    ""
                )
            ).strip()
            or "United States"
        )

        return super().create(
            validated_data
        )


class CustomerLocationDocumentSerializer(serializers.ModelSerializer):
    # This is an upload-only serializer field.
    # It is converted to bytes before saving the model.
    file = serializers.FileField(
        write_only=True,
        required=True,
    )

    customer_name = serializers.CharField(
        source="customer.company_name",
        read_only=True,
    )

    location_name = serializers.CharField(
        source="location.location_name",
        read_only=True,
        allow_null=True,
    )

    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomerLocationDocument
        fields = [
            "id",
            "customer",
            "customer_name",
            "location",
            "location_name",
            "file",
            "file_url",
            "original_name",
            "file_size",
            "content_type",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "customer_name",
            "location_name",
            "file_url",
            "original_name",
            "file_size",
            "content_type",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
        ]

    def validate(self, attrs):
        customer = attrs.get(
            "customer",
            getattr(self.instance, "customer", None),
        )

        location = attrs.get(
            "location",
            getattr(self.instance, "location", None),
        )

        uploaded_file = attrs.get("file")

        if (
            customer
            and location
            and location.customer_id != customer.id
        ):
            raise serializers.ValidationError(
                {
                    "location": (
                        "The selected location does not belong "
                        "to this customer."
                    )
                }
            )

        if (
            uploaded_file
            and uploaded_file.size > MAX_DOCUMENT_SIZE
        ):
            raise serializers.ValidationError(
                {
                    "file": (
                        "File is too large. "
                        "Maximum file size is 4 MB."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        uploaded_file = validated_data.pop("file")

        validated_data["file_data"] = uploaded_file.read()
        validated_data["original_name"] = uploaded_file.name
        validated_data["file_size"] = uploaded_file.size
        validated_data["content_type"] = (
            getattr(uploaded_file, "content_type", None)
            or "application/octet-stream"
        )

        request = self.context.get("request")

        if (
            request
            and request.user
            and request.user.is_authenticated
        ):
            validated_data["uploaded_by"] = request.user

        return super().create(validated_data)

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return ""

        return (
            obj.uploaded_by.get_full_name()
            or obj.uploaded_by.username
        )

    def get_file_url(self, obj):
        request = self.context.get("request")
        path = f"/api/locations/documents/{obj.id}/download/"

        if request:
            return request.build_absolute_uri(path)

        return path

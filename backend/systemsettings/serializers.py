from rest_framework import serializers

from .models import SystemSetting


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting

        fields = [
            "id",

            # General
            "system_name",
            "company_name",
            "support_email",
            "contact_number",

            # Notifications
            "ticket_due_soon_days",
            "warranty_expiry_warning_days",
            "license_expiry_warning_days",

            # Preferences
            "timezone",
            "date_format",

            # Security
            "session_timeout_minutes",
            "require_strong_password",

            # Meta
            "updated_at",
        ]

        extra_kwargs = {
            "system_name": {
                "required": False,
                "allow_blank": True,
            },
            "company_name": {
                "required": False,
                "allow_blank": True,
            },
        }

        read_only_fields = [
            "id",
            "updated_at",
        ]


    # =========================================
    # VALIDATION
    # =========================================

    def validate_ticket_due_soon_days(self, value):
        if value > 30:
            raise serializers.ValidationError(
                "Ticket due-soon warning cannot exceed 30 days."
            )

        return value


    def validate_warranty_expiry_warning_days(self, value):
        if value > 365:
            raise serializers.ValidationError(
                "Warranty expiry warning cannot exceed 365 days."
            )

        return value


    def validate_license_expiry_warning_days(self, value):
        if value > 365:
            raise serializers.ValidationError(
                "License expiry warning cannot exceed 365 days."
            )

        return value


    def validate_session_timeout_minutes(self, value):
        if value < 5:
            raise serializers.ValidationError(
                "Session timeout must be at least 5 minutes."
            )

        if value > 1440:
            raise serializers.ValidationError(
                "Session timeout cannot exceed 1440 minutes."
            )

        return value



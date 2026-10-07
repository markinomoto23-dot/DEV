import uuid
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import (
    validate_password,
)
from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)
from django.db import transaction

from rest_framework import serializers

from systemsettings.models import SystemSetting

from .models import Role, UserProfile


# =========================================================
# PASSWORD VALIDATION HELPER
# =========================================================

def validate_user_password(
    password,
    user=None,
):
    """
    Apply Django's configured password validators
    only when strong passwords are required by the
    system settings.
    """

    settings_obj = SystemSetting.load()

    if not settings_obj.require_strong_password:
        return

    try:
        validate_password(
            password,
            user=user,
        )

    except DjangoValidationError as error:
        raise serializers.ValidationError(
            list(error.messages)
        )


# =========================================================
# ROLE SERIALIZER
# =========================================================

class RoleSerializer(
    serializers.ModelSerializer
):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role

        fields = [
            "id",
            "name",
            "description",
            "is_system",

            "can_access_dashboard",
            "can_access_customers",
            "can_access_locations",
            "can_access_equipment",
            "can_access_warranties",
            "can_access_licenses",
            "can_access_tickets",
            "can_access_technicians",
            "can_access_billing",
            "can_access_reports",
            "can_access_users",
            "can_access_roles",
            "can_access_audit_trail",
            "can_access_notifications",
            "can_access_settings",

            "can_manage_users",
            "can_manage_roles",

            "user_count",

            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "name": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },
        }

        read_only_fields = [
            "id",
            "user_count",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        if value is None:
            return None
        return str(value).strip() or None

    def get_user_count(
        self,
        obj,
    ):
        return obj.users.count()


# =========================================================
# SIMPLE ROLE SERIALIZER
# =========================================================

class SimpleRoleSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Role

        fields = [
            "id",
            "name",
        ]


# =========================================================
# USER SERIALIZER
# =========================================================

class UserSerializer(
    serializers.ModelSerializer
):
    role = SimpleRoleSerializer(
        source="profile.role",
        read_only=True,
    )

    role_id = serializers.PrimaryKeyRelatedField(
        source="profile.role",
        queryset=Role.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    username = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        trim_whitespace=False,
        style={
            "input_type":
                "password",
        },
    )

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "is_staff",
            "is_superuser",

            "role",
            "role_id",

            "password",

            "date_joined",
            "last_login",
        ]

        read_only_fields = [
            "id",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
        ]


    # =====================================================
    # GENERAL VALIDATION
    # =====================================================

    def validate(
        self,
        attrs,
    ):
        password = attrs.get("password") or ""
        username = str(attrs.get("username") or "").strip()

        if self.instance is not None and not username and "username" in attrs:
            attrs.pop("username", None)

        if password:
            prospective_user = User(
                username=(username or (self.instance.username if self.instance else "")),
                email=attrs.get("email", self.instance.email if self.instance else ""),
                first_name=attrs.get("first_name", self.instance.first_name if self.instance else ""),
                last_name=attrs.get("last_name", self.instance.last_name if self.instance else ""),
            )
            if self.instance:
                prospective_user.pk = self.instance.pk
                if self.instance.check_password(password):
                    raise serializers.ValidationError({
                        "password": ["New password must be different from the current password."]
                    })
            try:
                validate_user_password(password, user=prospective_user)
            except serializers.ValidationError as error:
                raise serializers.ValidationError({"password": error.detail})

        return attrs


    # =====================================================
    # CREATE USER
    # =====================================================

    @transaction.atomic
    def create(
        self,
        validated_data,
    ):
        profile_data = validated_data.pop("profile", {})
        password = validated_data.pop("password", "") or ""
        username = str(validated_data.pop("username", "") or "").strip()

        if not username:
            while True:
                candidate = f"user_{uuid.uuid4().hex[:8]}"
                if not User.objects.filter(username=candidate).exists():
                    username = candidate
                    break

        user = User.objects.create_user(
            username=username,
            password=password or None,
            **validated_data,
        )

        profile, _ = UserProfile.objects.get_or_create(user=user)
        if "role" in profile_data:
            profile.role = profile_data.get("role")
            profile.save(update_fields=["role"] )

        return user


    # =====================================================
    # UPDATE USER
    # =====================================================

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        profile_data = validated_data.pop(
            "profile",
            {},
        )

        password = validated_data.pop(
            "password",
            None,
        )

        # =====================================
        # STANDARD USER FIELDS
        # =====================================

        for field, value in (
            validated_data.items()
        ):
            setattr(
                instance,
                field,
                value,
            )

        # =====================================
        # PASSWORD
        # =====================================

        if password:
            instance.set_password(
                password
            )

        instance.save()

        # =====================================
        # ROLE PROFILE
        # =====================================

        profile, _ = (
            UserProfile.objects
            .get_or_create(
                user=instance
            )
        )

        if "role" in profile_data:
            profile.role = (
                profile_data.get(
                    "role"
                )
            )

            profile.save(
                update_fields=[
                    "role",
                ]
            )

        return instance
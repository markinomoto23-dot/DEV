from django.contrib.auth.models import User
from django.db import transaction

from rest_framework import serializers

from roles.models import (
    Role,
    UserProfile,
)
from roles.serializers import (
    validate_user_password,
)

from .models import Technician


class TechnicianSerializer(
    serializers.ModelSerializer
):
    full_name = serializers.CharField(
        read_only=True,
    )

    user_id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    account_username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    username = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )


    class Meta:
        model = Technician

        fields = [
            "id",

            "user_id",
            "account_username",

            "username",
            "password",
            "confirm_password",

            "employee_id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "specialization",
            "hourly_rate",
            "hire_date",
            "status",
            "notes",

            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "employee_id": {
                "required": False,
                "allow_null": True,
                "allow_blank": True,
            },
            "first_name": {
                "required": False,
                "allow_blank": True,
            },
            "last_name": {
                "required": False,
                "allow_blank": True,
            },
        }

        read_only_fields = [
            "id",
            "user_id",
            "account_username",
            "full_name",
            "created_at",
            "updated_at",
        ]


    # =====================================================
    # VALIDATION
    # =====================================================

    def validate(
        self,
        attrs,
    ):
        username = str(attrs.get("username") or "").strip()
        password = attrs.get("password") or ""
        confirm_password = attrs.get("confirm_password") or ""

        employee_id = attrs.get("employee_id")
        if isinstance(employee_id, str):
            attrs["employee_id"] = employee_id.strip() or None

        if password or confirm_password:
            if password != confirm_password:
                raise serializers.ValidationError({
                    "confirm_password": ["Passwords do not match."]
                })

        if self.instance is None and username:
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({
                    "username": ["A user with this username already exists."]
                })

            if password:
                prospective_user = User(
                    username=username,
                    first_name=attrs.get("first_name", ""),
                    last_name=attrs.get("last_name", ""),
                    email=attrs.get("email", ""),
                )
                try:
                    validate_user_password(password, user=prospective_user)
                except serializers.ValidationError as error:
                    raise serializers.ValidationError({"password": error.detail})

        elif self.instance is not None and password and self.instance.user:
            if self.instance.user.check_password(password):
                raise serializers.ValidationError({
                    "password": ["New password must be different from the current password."]
                })

        attrs["username"] = username
        return attrs


    # =====================================================
    # CREATE
    # =====================================================

    @transaction.atomic
    def create(
        self,
        validated_data,
    ):
        username = str(validated_data.pop("username", "") or "").strip()
        password = validated_data.pop("password", "") or ""
        validated_data.pop("confirm_password", None)

        user = None
        if username:
            user = User.objects.create_user(
                username=username,
                password=password or None,
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
                email=validated_data.get("email", ""),
                is_active=(validated_data.get("status", "active") != "inactive"),
            )

            technician_role = Role.objects.filter(name__iexact="Technician").first()
            if technician_role:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.role = technician_role
                profile.save(update_fields=["role"] )

        technician = Technician.objects.create(
            user=user,
            **validated_data,
        )
        return technician


    # =====================================================
    # UPDATE
    # =====================================================

    @transaction.atomic
    def update(
        self,
        instance,
        validated_data,
    ):
        username = validated_data.pop(
            "username",
            None,
        )

        password = validated_data.pop(
            "password",
            None,
        )

        validated_data.pop(
            "confirm_password",
            None,
        )


        for field, value in (
            validated_data.items()
        ):
            setattr(
                instance,
                field,
                value,
            )


        instance.save()


        # =================================================
        # KEEP USER ACCOUNT SYNCHRONIZED
        # =================================================

        if instance.user:

            user = instance.user


            if (
                username
                and username != user.username
            ):
                if (
                    User.objects
                    .exclude(pk=user.pk)
                    .filter(
                        username=username
                    )
                    .exists()
                ):
                    raise serializers.ValidationError({
                        "username": [
                            (
                                "A user with this username "
                                "already exists."
                            )
                        ]
                    })

                user.username = (
                    username
                )


            user.first_name = (
                instance.first_name
            )

            user.last_name = (
                instance.last_name
            )

            user.email = (
                instance.email
            )


            # Inactive technician =
            # disabled login account.
            #
            # Active / On Leave =
            # account can still log in.

            user.is_active = (
                instance.status
                != "inactive"
            )


            if password:
                user.set_password(
                    password
                )


            user.save()


            technician_role = (
                Role.objects
                .filter(
                    name__iexact="Technician"
                )
                .first()
            )


            if technician_role:

                profile, _ = (
                    UserProfile.objects
                    .get_or_create(
                        user=user
                    )
                )

                profile.role = (
                    technician_role
                )

                profile.save(
                    update_fields=[
                        "role",
                    ]
                )


        return instance
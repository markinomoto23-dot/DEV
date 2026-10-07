from django.contrib.auth.models import User

from django.contrib.auth.password_validation import (
    validate_password,
)

from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)

from rest_framework import serializers

from systemsettings.models import SystemSetting


# =========================================================
# PASSWORD VALIDATION HELPER
# =========================================================

def validate_django_password(
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
            list(
                error.messages
            )
        )


# =========================================================
# REGISTER
# =========================================================

class RegisterSerializer(
    serializers.ModelSerializer
):
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type":
                "password",
        },
    )


    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
        ]


    # =====================================================
    # VALIDATE
    # =====================================================

    def validate(
        self,
        attrs,
    ):
        password = (
            attrs.get(
                "password"
            )
        )


        # Create an unsaved user object so Django's
        # UserAttributeSimilarityValidator can compare
        # password against username/name/email.
        prospective_user = User(
            username=
                attrs.get(
                    "username",
                    "",
                ),

            email=
                attrs.get(
                    "email",
                    "",
                ),

            first_name=
                attrs.get(
                    "first_name",
                    "",
                ),

            last_name=
                attrs.get(
                    "last_name",
                    "",
                ),
        )


        try:
            validate_django_password(
                password,
                user=
                    prospective_user,
            )

        except serializers.ValidationError as error:
            raise serializers.ValidationError({
                "password":
                    error.detail
            })


        return attrs


    # =====================================================
    # CREATE
    # =====================================================

    def create(
        self,
        validated_data,
    ):
        return User.objects.create_user(
            username=
                validated_data[
                    "username"
                ],

            email=
                validated_data.get(
                    "email",
                    "",
                ),

            password=
                validated_data[
                    "password"
                ],

            first_name=
                validated_data.get(
                    "first_name",
                    "",
                ),

            last_name=
                validated_data.get(
                    "last_name",
                    "",
                ),
        )


# =========================================================
# CURRENT USER / PROFILE
# =========================================================

class UserProfileSerializer(
    serializers.ModelSerializer
):
    role = (
        serializers
        .SerializerMethodField()
    )


    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

        read_only_fields = [
            "id",
            "username",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
        ]


    # =====================================================
    # ROLE
    # =====================================================

    def get_role(
        self,
        obj,
    ):
        if obj.is_superuser:
            return "Super Admin"

        try:
            profile = obj.profile

            if profile and profile.role:
                return profile.role.name

        except Exception:
            pass

        return "User"


# =========================================================
# CHANGE PASSWORD
# =========================================================

class ChangePasswordSerializer(
    serializers.Serializer
):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type":
                "password",
        },
    )

    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type":
                "password",
        },
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type":
                "password",
        },
    )


    # =====================================================
    # VALIDATE
    # =====================================================

    def validate(
        self,
        attrs,
    ):
        request = (
            self.context.get(
                "request"
            )
        )


        if (
            request is None
            or not request.user
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError({
                "current_password":
                    "Authentication is required."
            })


        user = request.user


        current_password = (
            attrs.get(
                "current_password"
            )
        )

        new_password = (
            attrs.get(
                "new_password"
            )
        )

        confirm_password = (
            attrs.get(
                "confirm_password"
            )
        )


        # =====================================
        # CURRENT PASSWORD
        # =====================================

        if not user.check_password(
            current_password
        ):
            raise serializers.ValidationError({
                "current_password":
                    "Current password is incorrect."
            })


        # =====================================
        # PASSWORDS MUST MATCH
        # =====================================

        if (
            new_password
            != confirm_password
        ):
            raise serializers.ValidationError({
                "confirm_password":
                    "New passwords do not match."
            })


        # =====================================
        # MUST BE DIFFERENT
        # =====================================

        if user.check_password(
            new_password
        ):
            raise serializers.ValidationError({
                "new_password":
                    "New password must be different from the current password."
            })


        # =====================================
        # DJANGO PASSWORD POLICY
        # =====================================

        try:
            validate_django_password(
                new_password,
                user=user,
            )

        except serializers.ValidationError as error:
            raise serializers.ValidationError({
                "new_password":
                    error.detail
            })


        return attrs


# =========================================================
# RESET PASSWORD
# =========================================================

class ResetPasswordSerializer(
    serializers.Serializer
):
    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type":
                "password",
        },
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type":
                "password",
        },
    )


    # =====================================================
    # VALIDATE
    # =====================================================

    def validate(
        self,
        attrs,
    ):
        user = (
            self.context.get(
                "user"
            )
        )


        new_password = (
            attrs.get(
                "new_password"
            )
        )

        confirm_password = (
            attrs.get(
                "confirm_password"
            )
        )


        # =====================================
        # PASSWORDS MUST MATCH
        # =====================================

        if (
            new_password
            != confirm_password
        ):
            raise serializers.ValidationError({
                "confirm_password":
                    "Passwords do not match."
            })


        # =====================================
        # USER MUST BE PROVIDED
        # =====================================

        if user is None:
            raise serializers.ValidationError({
                "new_password":
                    "Unable to validate password for this account."
            })


        # =====================================
        # DON'T REUSE CURRENT PASSWORD
        # =====================================

        if user.check_password(
            new_password
        ):
            raise serializers.ValidationError({
                "new_password":
                    "New password must be different from the current password."
            })


        # =====================================
        # DJANGO PASSWORD POLICY
        # =====================================

        try:
            validate_django_password(
                new_password,
                user=user,
            )

        except serializers.ValidationError as error:
            raise serializers.ValidationError({
                "new_password":
                    error.detail
            })


        return attrs
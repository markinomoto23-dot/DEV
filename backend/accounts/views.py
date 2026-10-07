import logging

from django.conf import settings
from django.contrib.auth import (
    authenticate,
    get_user_model,
)
from django.contrib.auth.tokens import (
    default_token_generator,
)
from django.core.mail import send_mail
from django.utils.encoding import (
    force_bytes,
    force_str,
)
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from audittrail.utils import log_activity

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    ResetPasswordSerializer,
)


logger = logging.getLogger(__name__)

User = get_user_model()


# =========================================================
# REGISTER
# =========================================================

class RegisterView(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(
        self,
        request,
    ):
        serializer = RegisterSerializer(
            data=request.data,
        )

        if serializer.is_valid():
            user = serializer.save()

            token, _ = (
                Token.objects
                .get_or_create(
                    user=user,
                )
            )

            return Response(
                {
                    "message":
                        "Account created successfully.",

                    "token":
                        token.key,

                    "user": {
                        "id":
                            user.id,

                        "username":
                            user.username,

                        "email":
                            user.email,

                        "first_name":
                            user.first_name,

                        "last_name":
                            user.last_name,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# =========================================================
# LOGIN
# =========================================================

class LoginView(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(
        self,
        request,
    ):
        username = request.data.get(
            "username"
        )

        password = request.data.get(
            "password"
        )

        if (
            not username
            or not password
        ):
            return Response(
                {
                    "message":
                        "Username and password are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {
                    "message":
                        "Invalid username or password."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {
                    "message":
                        "This account is inactive."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = (
            Token.objects
            .get_or_create(
                user=user,
            )
        )

        # =====================================
        # AUDIT LOG - LOGIN
        # =====================================

        log_activity(
            request=request,
            action="login",
            module="Accounts",
            object_id=user.id,
            object_repr=user.username,
            description=(
                f"{user.username} logged in."
            ),
            user_override=user,
        )

        return Response(
            {
                "message":
                    "Login successful.",

                "token":
                    token.key,

                "user": {
                    "id":
                        user.id,

                    "username":
                        user.username,

                    "email":
                        user.email,

                    "first_name":
                        user.first_name,

                    "last_name":
                        user.last_name,

                    "is_staff":
                        user.is_staff,

                    "is_superuser":
                        user.is_superuser,
                },
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# LOGOUT
# =========================================================

class LogoutView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(
        self,
        request,
    ):
        user = request.user

        # =====================================
        # AUDIT LOG - LOGOUT
        # =====================================

        log_activity(
            request=request,
            action="logout",
            module="Accounts",
            object_id=user.id,
            object_repr=user.username,
            description=(
                f"{user.username} logged out."
            ),
        )

        Token.objects.filter(
            user=user,
        ).delete()

        return Response(
            {
                "message":
                    "Logged out successfully."
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# CURRENT USER / MY ACCOUNT
#
# GET:
#   /api/accounts/me/
#
# PATCH:
#   /api/accounts/me/
# =========================================================

class CurrentUserView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(
        self,
        request,
    ):
        serializer = UserProfileSerializer(
            request.user,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
    ):
        user = request.user

        # =====================================
        # CAPTURE OLD VALUES
        # =====================================

        old_values = {
            "first_name":
                user.first_name,

            "last_name":
                user.last_name,

            "email":
                user.email,
        }

        serializer = UserProfileSerializer(
            user,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()

        # =====================================
        # CAPTURE CHANGES
        # =====================================

        new_values = {
            "first_name":
                user.first_name,

            "last_name":
                user.last_name,

            "email":
                user.email,
        }

        changes = {}

        for field in old_values:
            if (
                old_values[field]
                != new_values[field]
            ):
                changes[field] = {
                    "from":
                        old_values[field],

                    "to":
                        new_values[field],
                }

        # =====================================
        # AUDIT LOG
        # =====================================

        if changes:
            log_activity(
                request=request,
                action="update",
                module="Accounts",
                object_id=user.id,
                object_repr=user.username,
                description=(
                    f"{user.username} updated "
                    f"their account profile."
                ),
                changes=changes,
            )

        return Response(
            {
                "message":
                    "Profile updated successfully.",

                "user":
                    UserProfileSerializer(
                        user
                    ).data,
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# CHANGE PASSWORD
#
# POST:
#   /api/accounts/change-password/
# =========================================================

class ChangePasswordView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(
        self,
        request,
    ):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={
                "request":
                    request,
            },
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        new_password = (
            serializer.validated_data[
                "new_password"
            ]
        )

        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password",
            ]
        )

        # =====================================
        # INVALIDATE OLD API TOKENS
        #
        # Password was changed, so require
        # the user to sign in again.
        # =====================================

        Token.objects.filter(
            user=user,
        ).delete()

        # =====================================
        # AUDIT LOG
        # =====================================

        log_activity(
            request=request,
            action="password_change",
            module="Accounts",
            object_id=user.id,
            object_repr=user.username,
            description=(
                f"{user.username} changed "
                f"their password."
            ),
        )

        return Response(
            {
                "message":
                    "Password changed successfully. "
                    "Please sign in again using your new password."
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# FORGOT PASSWORD
#
# POST:
#   /api/accounts/forgot-password/
#
# BODY:
# {
#     "email": "user@example.com"
# }
# =========================================================

class ForgotPasswordView(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(
        self,
        request,
    ):
        email = str(
            request.data.get(
                "email",
                "",
            )
        ).strip()

        if not email:
            return Response(
                {
                    "email": [
                        "Email address is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # =====================================
        # GENERIC RESPONSE
        #
        # Never reveal whether an email exists.
        # Prevents account enumeration.
        # =====================================

        generic_response = {
            "message": (
                "If an account exists for this email, "
                "password reset instructions have been sent."
            )
        }

        user = (
            User.objects
            .filter(
                email__iexact=email,
                is_active=True,
            )
            .first()
        )

        if user is None:
            return Response(
                generic_response,
                status=status.HTTP_200_OK,
            )

        # =====================================
        # CREATE RESET TOKEN
        # =====================================

        uid = (
            urlsafe_base64_encode(
                force_bytes(
                    user.pk
                )
            )
        )

        reset_token = (
            default_token_generator
            .make_token(
                user
            )
        )

        # =====================================
        # FRONTEND RESET URL
        # =====================================

        frontend_url = getattr(
            settings,
            "FRONTEND_URL",
            "http://localhost:5173",
        )

        frontend_url = (
            frontend_url.rstrip("/")
        )

        reset_url = (
            f"{frontend_url}"
            f"/reset-password"
            f"?uid={uid}"
            f"&token={reset_token}"
        )

        # =====================================
        # EMAIL
        # =====================================

        subject = (
            "Reset your Expert Technology password"
        )

        message = (
            f"Hello "
            f"{user.first_name or user.username},\n\n"

            f"We received a request to reset "
            f"the password for your "
            f"Expert Technology account.\n\n"

            f"Use the link below to create "
            f"a new password:\n\n"

            f"{reset_url}\n\n"

            f"If you did not request a password "
            f"reset, you can ignore this email.\n\n"

            f"For security, this reset link will "
            f"become invalid after your password "
            f"is changed or when the reset token "
            f"expires.\n\n"

            f"Expert Technology\n"
            f"Service Management"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(
                    settings,
                    "DEFAULT_FROM_EMAIL",
                    None,
                ),
                recipient_list=[
                    user.email,
                ],
                fail_silently=False,
            )

            log_activity(
                request=request,
                action="password_reset_request",
                module="Accounts",
                object_id=user.id,
                object_repr=user.username,
                description=(
                    f"Password reset requested "
                    f"for {user.username}."
                ),
                user_override=user,
            )

        except Exception:
            # Do not reveal mail errors or
            # account existence to client.

            logger.exception(
                "Unable to send password "
                "reset email."
            )

        return Response(
            generic_response,
            status=status.HTTP_200_OK,
        )


# =========================================================
# RESET PASSWORD
#
# POST:
#   /api/accounts/reset-password/
#
# BODY:
# {
#     "uid": "...",
#     "token": "...",
#     "new_password": "...",
#     "confirm_password": "..."
# }
# =========================================================

class ResetPasswordView(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(
        self,
        request,
    ):
        uid = str(
            request.data.get(
                "uid",
                "",
            )
        ).strip()

        reset_token = str(
            request.data.get(
                "token",
                "",
            )
        ).strip()

        # =====================================
        # REQUIRED RESET LINK FIELDS
        # =====================================

        errors = {}

        if not uid:
            errors[
                "uid"
            ] = [
                "Reset user identifier is required."
            ]

        if not reset_token:
            errors[
                "token"
            ] = [
                "Reset token is required."
            ]

        if errors:
            return Response(
                errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        # =====================================
        # GET USER FROM UID
        # =====================================

        try:
            user_id = force_str(
                urlsafe_base64_decode(
                    uid
                )
            )

            user = User.objects.get(
                pk=user_id
            )

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist,
        ):
            return Response(
                {
                    "message":
                        "This password reset link "
                        "is invalid or has expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {
                    "message":
                        "This password reset link "
                        "is invalid or has expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # =====================================
        # TOKEN VALIDATION
        # =====================================

        if not (
            default_token_generator
            .check_token(
                user,
                reset_token,
            )
        ):
            return Response(
                {
                    "message":
                        "This password reset link "
                        "is invalid or has expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # =====================================
        # CENTRAL PASSWORD VALIDATION
        #
        # Uses the same Django password policy
        # as registration/change password.
        # =====================================

        serializer = ResetPasswordSerializer(
            data={
                "new_password":
                    request.data.get(
                        "new_password",
                        "",
                    ),

                "confirm_password":
                    request.data.get(
                        "confirm_password",
                        "",
                    ),
            },
            context={
                "user":
                    user,
            },
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_password = (
            serializer.validated_data[
                "new_password"
            ]
        )

        # =====================================
        # SAVE NEW PASSWORD
        # =====================================

        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password",
            ]
        )

        # =====================================
        # INVALIDATE EXISTING API TOKENS
        # =====================================

        Token.objects.filter(
            user=user,
        ).delete()

        # =====================================
        # AUDIT LOG
        # =====================================

        log_activity(
            request=request,
            action="password_reset",
            module="Accounts",
            object_id=user.id,
            object_repr=user.username,
            description=(
                f"Password was reset for "
                f"{user.username}."
            ),
            user_override=user,
        )

        return Response(
            {
                "message":
                    "Password reset successfully. "
                    "You can now sign in using "
                    "your new password."
            },
            status=status.HTTP_200_OK,
        )
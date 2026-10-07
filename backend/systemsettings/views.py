from rest_framework import status

from rest_framework.permissions import (
    IsAuthenticated,
)

from rest_framework.response import Response
from rest_framework.views import APIView

from audittrail.utils import log_activity
from roles.permissions import HasModuleAccess

from .models import SystemSetting
from .serializers import SystemSettingSerializer


# =========================================================
# FULL SYSTEM SETTINGS
#
# Admin / users with Settings permission only
# =========================================================

class SystemSettingsView(APIView):
    permission_classes = [
        HasModuleAccess,
    ]

    required_module = "settings"


    # =====================================================
    # GET SYSTEM SETTINGS
    # =====================================================

    def get(
        self,
        request,
    ):
        settings_obj = (
            SystemSetting.load()
        )

        serializer = (
            SystemSettingSerializer(
                settings_obj
            )
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


    # =====================================================
    # UPDATE SYSTEM SETTINGS
    # =====================================================

    def patch(
        self,
        request,
    ):
        settings_obj = (
            SystemSetting.load()
        )

        serializer = (
            SystemSettingSerializer(
                settings_obj,
                data=request.data,
                partial=True,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )


        # =========================================
        # DETECT ACTUAL CHANGES
        # =========================================

        changes = {}

        for field, new_value in (
            serializer
            .validated_data
            .items()
        ):
            old_value = getattr(
                settings_obj,
                field,
                None,
            )

            if old_value != new_value:
                changes[field] = {
                    "old":
                        old_value,

                    "new":
                        new_value,
                }


        # =========================================
        # SAVE
        # =========================================

        serializer.save()


        # =========================================
        # AUDIT LOG
        # =========================================

        if changes:
            log_activity(
                request=request,

                action="update",

                module="Settings",

                object_id=settings_obj.id,

                object_repr=(
                    settings_obj.system_name
                ),

                description=(
                    "System settings updated."
                ),

                changes=changes,
            )


        return Response(
            {
                "message":
                    (
                        "System settings updated "
                        "successfully."
                    ),

                "settings":
                    serializer.data,
            },

            status=status.HTTP_200_OK,
        )


# =========================================================
# RUNTIME SETTINGS
#
# Safe read-only settings required by all authenticated
# users while the application is running.
#
# GET:
#   /api/settings/runtime/
# =========================================================

class RuntimeSettingsView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]


    def get(
        self,
        request,
    ):
        settings_obj = (
            SystemSetting.load()
        )

        return Response(
            {
                "session_timeout_minutes":
                    settings_obj
                    .session_timeout_minutes,

                "timezone":
                    settings_obj
                    .timezone,

                "date_format":
                    settings_obj
                    .date_format,
            },

            status=status.HTTP_200_OK,
        )
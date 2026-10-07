from django.utils import timezone

from rest_framework import (
    mixins,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    # =====================================================
    # GET USER NOTIFICATIONS
    # =====================================================

    def get_queryset(self):
        queryset = Notification.objects.filter(
            recipient=self.request.user
        )

        is_read = (
            self.request.query_params.get(
                "is_read"
            )
        )

        notification_type = (
            self.request.query_params.get(
                "type"
            )
        )

        if is_read == "true":
            queryset = queryset.filter(
                is_read=True
            )

        elif is_read == "false":
            queryset = queryset.filter(
                is_read=False
            )

        if notification_type:
            queryset = queryset.filter(
                notification_type=
                    notification_type
            )

        return queryset

    # =====================================================
    # UNREAD COUNT
    # =====================================================

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(
        self,
        request,
    ):
        count = (
            self.get_queryset()
            .filter(
                is_read=False
            )
            .count()
        )

        return Response(
            {
                "unread_count":
                    count,
            }
        )

    # =====================================================
    # DEADLINE CHECK STATUS
    #
    # Scheduled notification generation is handled by:
    #
    # python manage.py generate_notifications
    #
    # This command is executed by the server scheduler.
    #
    # IMPORTANT:
    # Do NOT generate notifications from this API endpoint.
    # Doing so can race with the scheduler and create
    # duplicate notifications.
    # =====================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="check-deadlines",
    )
    def check_deadlines(
        self,
        request,
    ):
        return Response(
            {
                "message": (
                    "Deadline notifications are "
                    "handled automatically by the "
                    "server scheduler."
                ),

                "scheduler_managed":
                    True,

                "total_created":
                    0,
            },
            status=status.HTTP_200_OK,
        )

    # =====================================================
    # MARK ONE AS READ
    # =====================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(
        self,
        request,
        pk=None,
    ):
        notification = (
            self.get_object()
        )

        notification.is_read = True

        notification.read_at = (
            timezone.now()
        )

        notification.save(
            update_fields=[
                "is_read",
                "read_at",
            ]
        )

        return Response(
            NotificationSerializer(
                notification
            ).data
        )

    # =====================================================
    # MARK ALL AS READ
    # =====================================================

    @action(
        detail=False,
        methods=["post"],
        url_path="mark-all-read",
    )
    def mark_all_read(
        self,
        request,
    ):
        unread = (
            self.get_queryset()
            .filter(
                is_read=False
            )
        )

        count = unread.count()

        unread.update(
            is_read=True,
            read_at=timezone.now(),
        )

        return Response(
            {
                "message": (
                    "All notifications "
                    "marked as read."
                ),

                "updated":
                    count,
            },
            status=status.HTTP_200_OK,
        )
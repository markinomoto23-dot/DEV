from datetime import date, datetime, timedelta
import os

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_time

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from audittrail.utils import log_activity
from customers.models import Customer
from notifications.utils import create_notification
from roles.permissions import (
    HasModuleAccess,
    is_admin_user,
    is_manager_user,
)
from technicians.models import Technician

from .models import Ticket, TicketAttachment
from .serializers import TicketAttachmentSerializer, TicketSerializer
from .services import (
    get_manager_emails,
    get_schedule_conflicts,
    send_assignment_notifications,
    send_closed_ticket_notification,
    send_new_ticket_notification,
    ticket_occurrences,
)


def get_linked_technician(user):
    if not user or not user.is_authenticated:
        return None
    return Technician.objects.filter(user=user).first()


def is_privileged_user(user):
    # Preserve the existing ticket-access model while allowing the new Manager
    # role to operate as dispatch/service management.
    return is_admin_user(user) or is_manager_user(user)


def notify_manager_users(ticket):
    manager_users = (
        User.objects
        .filter(is_active=True, profile__role__name__iexact="Manager")
        .distinct()
    )
    for user in manager_users:
        create_notification(
            recipient=user,
            notification_type="ticket_created",
            title="New Ticket Created",
            message=f"{ticket.ticket_number}: {ticket.subject}",
            module="Tickets",
            object_id=ticket.id,
            link="/tickets",
        )


def notify_technicians(ticket, technicians):
    for technician in technicians:
        if technician.user_id:
            create_notification(
                recipient=technician.user,
                notification_type="ticket_assignment",
                title="New Ticket Assigned",
                message=f"You have been assigned to {ticket.ticket_number}: {ticket.subject}",
                module="Tickets",
                object_id=ticket.id,
                link="/tickets",
            )


class TicketViewSet(viewsets.ModelViewSet):
    queryset = (
        Ticket.objects
        .select_related("customer", "location", "equipment", "technician", "created_by")
        .prefetch_related("technicians", "technicians__user", "attachments")
        .all()
    )
    serializer_class = TicketSerializer
    permission_classes = [HasModuleAccess]
    required_module = "tickets"
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        "ticket_number", "subject", "description",
        "customer__company_name", "location__location_name",
        "equipment__equipment_name", "equipment__serial_number",
        "technicians__employee_id", "technicians__first_name", "technicians__last_name",
        "contact_name", "contact_email", "contact_phone",
        "created_by__username", "notes", "work_performed",
    ]
    ordering_fields = [
        "ticket_number", "priority", "status", "due_date", "service_date",
        "created_at", "updated_at",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Visibility rules:
        # - Admin/Manager: all tickets
        # - Technician: assigned tickets only, read-only
        # - regular user: tickets they created
        if not is_privileged_user(user):
            technician = get_linked_technician(user)
            if technician:
                queryset = queryset.filter(technicians=technician).distinct()
            else:
                queryset = queryset.filter(created_by=user)

        params = self.request.query_params
        if params.get("customer"):
            queryset = queryset.filter(customer_id=params["customer"])
        if params.get("location"):
            queryset = queryset.filter(location_id=params["location"])
        if params.get("equipment"):
            queryset = queryset.filter(equipment_id=params["equipment"])
        if params.get("technician"):
            queryset = queryset.filter(technicians__id=params["technician"]).distinct()
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("service_date"):
            queryset = queryset.filter(service_date=params["service_date"])
        return queryset

    def is_technician_account(self):
        if is_privileged_user(self.request.user):
            return False
        return get_linked_technician(self.request.user) is not None

    def is_regular_user_account(self):
        if is_privileged_user(self.request.user):
            return False
        return not self.is_technician_account()

    def validate_allowed_changes(self, serializer, old_ticket, allowed_fields):
        for field, new_value in serializer.validated_data.items():
            if field in allowed_fields:
                continue

            old_value = getattr(old_ticket, field, None)

            if field == "technicians":
                old_compare = set(old_ticket.technicians.values_list("id", flat=True))
                new_compare = {getattr(item, "pk", item) for item in (new_value or [])}
            else:
                old_compare = getattr(old_value, "pk", old_value)
                new_compare = getattr(new_value, "pk", new_value)

            if old_compare == new_compare:
                continue

            raise PermissionDenied(
                f"You do not have permission to change {field.replace('_', ' ')}."
            )

    def _format_booking_time(self, start_time, end_time):
        if start_time is None or end_time is None:
            return "all day"
        return f"{start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}"

    def _validate_assignment_availability(
        self,
        locked_technicians,
        status_check_ids,
        conflict_check_ids,
        service_date,
        start_time,
        end_time,
        recurrence_type,
        recurrence_end_date,
        exclude_ticket_id=None,
    ):
        technician_map = {technician.id: technician for technician in locked_technicians}

        unavailable_status = [
            technician
            for technician_id, technician in technician_map.items()
            if technician_id in status_check_ids and technician.status != "active"
        ]

        if unavailable_status:
            labels = {
                "inactive": "Inactive",
                "on_leave": "On Leave",
            }
            messages = [
                (
                    f"{technician.full_name or technician.employee_id} is "
                    f"{labels.get(technician.status, technician.status)} and cannot "
                    "be assigned to a new or changed schedule."
                )
                for technician in unavailable_status
            ]
            raise ValidationError({"technicians": messages})

        if not service_date or not conflict_check_ids:
            return

        conflicts = get_schedule_conflicts(
            technician_ids=conflict_check_ids,
            service_date=service_date,
            start_time=start_time,
            end_time=end_time,
            recurrence_type=recurrence_type,
            recurrence_end_date=recurrence_end_date,
            exclude_ticket_id=exclude_ticket_id,
        )

        if not conflicts:
            return

        messages = []
        for technician_id in sorted(conflicts):
            technician = technician_map.get(technician_id)
            conflict = conflicts[technician_id][0]
            technician_name = (
                technician.full_name or technician.employee_id
                if technician
                else f"Technician #{technician_id}"
            )
            booking_time = self._format_booking_time(
                conflict.get("start_time"),
                conflict.get("end_time"),
            )
            messages.append(
                (
                    f"{technician_name} is already booked on "
                    f"{conflict['service_date'].isoformat()} ({booking_time}) "
                    f"for {conflict['ticket_number']}. Choose another technician, "
                    "date, or time."
                )
            )

        raise ValidationError({"technicians": messages})

    def create(self, request, *args, **kwargs):
        # Existing behavior: linked Technician accounts cannot create tickets.
        if self.is_technician_account():
            raise PermissionDenied(
                "Your technician account does not have permission to create tickets."
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if self.is_technician_account():
            raise PermissionDenied(
                "Technician accounts are read-only and cannot edit tickets."
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if self.is_technician_account():
            raise PermissionDenied(
                "Technician accounts are read-only and cannot edit tickets."
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Existing behavior: ticket deletion remains Admin-only.
        if not is_admin_user(request.user):
            raise PermissionDenied("You do not have permission to delete this ticket.")
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        desired_technicians = list(serializer.validated_data.get("technicians", []))
        desired_technician_ids = {technician.id for technician in desired_technicians}

        with transaction.atomic():
            locked_technicians = []

            if is_privileged_user(user) and desired_technician_ids:
                locked_technicians = list(
                    Technician.objects
                    .select_for_update()
                    .filter(pk__in=desired_technician_ids)
                    .order_by("pk")
                )

                self._validate_assignment_availability(
                    locked_technicians=locked_technicians,
                    status_check_ids=desired_technician_ids,
                    conflict_check_ids=(
                        desired_technician_ids
                        if serializer.validated_data.get("service_date")
                        else set()
                    ),
                    service_date=serializer.validated_data.get("service_date"),
                    start_time=serializer.validated_data.get("start_time"),
                    end_time=serializer.validated_data.get("end_time"),
                    recurrence_type=serializer.validated_data.get("recurrence_type", "none"),
                    recurrence_end_date=serializer.validated_data.get("recurrence_end_date"),
                )

            if is_privileged_user(user):
                ticket = serializer.save(created_by=user)
            else:
                # Preserve normal-user behavior: dispatch/admin owns assignment,
                # scheduling, status and internal work-ticket fields.
                ticket = serializer.save(
                    created_by=user,
                    status="open",
                    technicians=[],
                    due_date=None,
                    service_date=None,
                    start_time=None,
                    end_time=None,
                    recurrence_type="none",
                    recurrence_end_date=None,
                    notes="",
                    work_performed="",
                    time_on_site="",
                    equipment_materials_used="",
                )

            assigned = list(ticket.technicians.all())

            log_activity(
                request=self.request,
                action="create",
                module="Tickets",
                object_id=ticket.id,
                object_repr=ticket.ticket_number,
                description=f"Created ticket {ticket.ticket_number}: {ticket.subject}",
                changes={
                    "status": ticket.status,
                    "priority": ticket.priority,
                    "customer": str(ticket.customer) if ticket.customer else "",
                    "technicians": [tech.full_name or tech.employee_id for tech in assigned],
                    "service_date": str(ticket.service_date) if ticket.service_date else None,
                },
            )

        # Send notifications only after the protected booking transaction succeeds.
        notify_manager_users(ticket)
        send_new_ticket_notification(ticket)
        if assigned:
            notify_technicians(ticket, assigned)
            send_assignment_notifications(ticket, assigned)

    def perform_update(self, serializer):
        if self.is_technician_account():
            raise PermissionDenied(
                "Technician accounts are read-only and cannot edit tickets."
            )

        with transaction.atomic():
            old_ticket = (
                Ticket.objects
                .select_for_update()
                .prefetch_related("technicians")
                .get(pk=serializer.instance.pk)
            )
            serializer.instance = old_ticket

            # Preserve regular-user ticket editing: request details only.
            if self.is_regular_user_account():
                if old_ticket.status == "closed":
                    raise PermissionDenied(
                        "This ticket can no longer be edited because it has been closed."
                    )
                self.validate_allowed_changes(
                    serializer,
                    old_ticket,
                    {
                        "customer", "location", "equipment",
                        "subject", "description", "category", "priority",
                        "contact_name", "contact_email", "contact_phone",
                    },
                )

            old_status = old_ticket.status
            old_technician_ids = set(
                old_ticket.technicians.values_list("id", flat=True)
            )

            desired_technicians = serializer.validated_data.get("technicians", None)
            desired_technician_ids = (
                {technician.id for technician in desired_technicians}
                if desired_technicians is not None
                else set(old_technician_ids)
            )

            old_schedule = (
                old_ticket.service_date,
                old_ticket.start_time,
                old_ticket.end_time,
                old_ticket.recurrence_type,
                old_ticket.recurrence_end_date,
            )
            desired_schedule = (
                serializer.validated_data.get("service_date", old_ticket.service_date),
                serializer.validated_data.get("start_time", old_ticket.start_time),
                serializer.validated_data.get("end_time", old_ticket.end_time),
                serializer.validated_data.get("recurrence_type", old_ticket.recurrence_type),
                serializer.validated_data.get(
                    "recurrence_end_date",
                    old_ticket.recurrence_end_date,
                ),
            )
            schedule_changed = desired_schedule != old_schedule
            added_technician_ids = desired_technician_ids - old_technician_ids

            lock_ids = old_technician_ids.union(desired_technician_ids)
            locked_technicians = list(
                Technician.objects
                .select_for_update()
                .filter(pk__in=lock_ids)
                .order_by("pk")
            ) if lock_ids else []

            desired_service_date = desired_schedule[0]
            status_check_ids = set(added_technician_ids)
            conflict_check_ids = set()

            if desired_service_date:
                conflict_check_ids.update(added_technician_ids)

                if schedule_changed:
                    status_check_ids.update(desired_technician_ids)
                    conflict_check_ids.update(desired_technician_ids)

            self._validate_assignment_availability(
                locked_technicians=locked_technicians,
                status_check_ids=status_check_ids,
                conflict_check_ids=conflict_check_ids,
                service_date=desired_service_date,
                start_time=desired_schedule[1],
                end_time=desired_schedule[2],
                recurrence_type=desired_schedule[3],
                recurrence_end_date=desired_schedule[4],
                exclude_ticket_id=old_ticket.id,
            )

            old_snapshot = {
                "status": old_ticket.status,
                "priority": old_ticket.priority,
                "service_date": str(old_ticket.service_date) if old_ticket.service_date else None,
                "technicians": sorted(old_technician_ids),
            }

            ticket = serializer.save()
            new_technician_ids = set(
                ticket.technicians.values_list("id", flat=True)
            )
            new_snapshot = {
                "status": ticket.status,
                "priority": ticket.priority,
                "service_date": str(ticket.service_date) if ticket.service_date else None,
                "technicians": sorted(new_technician_ids),
            }

            changes = {
                key: {"from": old_snapshot[key], "to": new_snapshot[key]}
                for key in old_snapshot
                if old_snapshot[key] != new_snapshot[key]
            }
            if changes:
                log_activity(
                    request=self.request,
                    action="update",
                    module="Tickets",
                    object_id=ticket.id,
                    object_repr=ticket.ticket_number,
                    description=f"Updated ticket {ticket.ticket_number}",
                    changes=changes,
                )

            added_ids = new_technician_ids - old_technician_ids
            added = list(Technician.objects.filter(id__in=added_ids)) if added_ids else []
            should_send_closed = old_status != "closed" and ticket.status == "closed"

        # Notifications happen only after the transaction is successfully committed.
        if added:
            notify_technicians(ticket, added)
            send_assignment_notifications(ticket, added)

        if should_send_closed:
            send_closed_ticket_notification(ticket)

    def perform_destroy(self, instance):
        log_activity(
            request=self.request,
            action="delete",
            module="Tickets",
            object_id=instance.id,
            object_repr=instance.ticket_number,
            description=f"Deleted ticket {instance.ticket_number}: {instance.subject}",
        )
        instance.delete()

    @action(
        detail=True,
        methods=["post"],
        url_path="attachments",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_attachment(self, request, pk=None):
        if self.is_technician_account():
            raise PermissionDenied(
                "Technician accounts are read-only and cannot upload attachments."
            )

        ticket = self.get_object()
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            raise ValidationError({"file": "Choose a file to upload."})

        attachment_type = str(
            request.data.get(
                "attachment_type",
                "general",
            )
            or "general"
        ).strip()

        valid_attachment_types = {
            choice[0]
            for choice
            in TicketAttachment.ATTACHMENT_TYPE_CHOICES
        }

        if attachment_type not in valid_attachment_types:
            raise ValidationError({
                "attachment_type":
                    "Invalid attachment type."
            })

        # Keep uploads below the practical serverless request limit.
        if uploaded_file.size > 4 * 1024 * 1024:
            raise ValidationError({"file": "Attachment must be 4 MB or smaller."})

        content_type = (
            uploaded_file.content_type
            or "application/octet-stream"
        )

        if (
            attachment_type
            == "completed_work_ticket"
            and not (
                content_type.startswith("image/")
                or content_type
                == "application/pdf"
            )
        ):
            raise ValidationError({
                "file": (
                    "Completed work tickets must be "
                    "an image or PDF."
                )
            })

        attachment = TicketAttachment.objects.create(
            ticket=ticket,
            attachment_type=attachment_type,
            file_data=uploaded_file.read(),
            original_name=uploaded_file.name,
            file_size=uploaded_file.size,
            content_type=content_type,
            uploaded_by=request.user,
        )

        if (
            attachment_type
            == "completed_work_ticket"
        ):
            log_activity(
                request=request,
                action="upload",
                module="Tickets",
                object_id=ticket.id,
                object_repr=ticket.ticket_number,
                description=(
                    "Uploaded completed work ticket "
                    f"{uploaded_file.name} for "
                    f"{ticket.ticket_number}"
                ),
            )

        return Response(
            TicketAttachmentSerializer(
                attachment,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path=r"attachments/(?P<attachment_id>[^/.]+)/download",
    )
    def download_attachment(self, request, pk=None, attachment_id=None):
        ticket = self.get_object()

        attachment = ticket.attachments.filter(
            pk=attachment_id,
        ).first()

        if not attachment:
            return Response(
                {"detail": "Attachment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not attachment.file_data:
            return Response(
                {
                    "detail": (
                        "This attachment does not have stored file data. "
                        "It may have been uploaded before database attachment "
                        "storage was enabled."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        response = HttpResponse(
            bytes(attachment.file_data),
            content_type=(
                attachment.content_type
                or "application/octet-stream"
            ),
        )

        safe_name = (
            attachment.original_name
            or f"attachment-{attachment.id}"
        ).replace("\r", "").replace("\n", "").replace('"', "'")

        response["Content-Disposition"] = (
            f'attachment; filename="{safe_name}"'
        )
        response["Content-Length"] = str(
            attachment.file_size
            or len(attachment.file_data)
        )

        return response

    @action(detail=False, methods=["get"], url_path="availability")
    def availability(self, request):
        if not is_privileged_user(request.user):
            raise PermissionDenied(
                "Only administrators and managers can check technician availability."
            )

        service_date = parse_date(request.query_params.get("service_date", ""))
        start_time = parse_time(request.query_params.get("start_time", ""))
        end_time = parse_time(request.query_params.get("end_time", ""))
        recurrence_type = request.query_params.get("recurrence_type", "none") or "none"
        recurrence_end_date = parse_date(
            request.query_params.get("recurrence_end_date", "")
        )
        ticket_id = request.query_params.get("ticket_id")

        if recurrence_type not in {"none", "monthly", "quarterly"}:
            raise ValidationError({"recurrence_type": "Invalid recurrence type."})

        if bool(start_time) != bool(end_time):
            raise ValidationError({
                "start_time": "Set both Start Time and End Time to check availability."
            })

        if start_time and end_time and end_time <= start_time:
            raise ValidationError({"end_time": "End time must be later than start time."})

        if recurrence_type != "none" and service_date and not recurrence_end_date:
            raise ValidationError({
                "recurrence_end_date": "Choose Repeat Until to check recurring availability."
            })

        if recurrence_end_date and service_date and recurrence_end_date < service_date:
            raise ValidationError({
                "recurrence_end_date": "Repeat Until cannot be before the service date."
            })

        existing_ticket = None
        existing_assignment_ids = set()
        existing_schedule_unchanged = False

        if ticket_id:
            existing_ticket = (
                Ticket.objects
                .filter(pk=ticket_id)
                .prefetch_related("technicians")
                .first()
            )
            if existing_ticket:
                existing_assignment_ids = set(
                    existing_ticket.technicians.values_list("id", flat=True)
                )
                existing_schedule_unchanged = (
                    existing_ticket.service_date == service_date
                    and existing_ticket.start_time == start_time
                    and existing_ticket.end_time == end_time
                    and existing_ticket.recurrence_type == recurrence_type
                    and existing_ticket.recurrence_end_date == recurrence_end_date
                )

        technicians = list(Technician.objects.all().order_by("first_name", "last_name"))
        technician_ids = {technician.id for technician in technicians}

        conflicts = {}
        if service_date:
            conflicts = get_schedule_conflicts(
                technician_ids=technician_ids,
                service_date=service_date,
                start_time=start_time,
                end_time=end_time,
                recurrence_type=recurrence_type,
                recurrence_end_date=recurrence_end_date,
                exclude_ticket_id=(existing_ticket.id if existing_ticket else None),
            )

        status_labels = dict(Technician.STATUS_CHOICES)
        results = []

        for technician in technicians:
            preserve_existing = (
                existing_ticket is not None
                and existing_schedule_unchanged
                and technician.id in existing_assignment_ids
            )

            technician_conflicts = conflicts.get(technician.id, [])
            available = True
            reason = "Available" if service_date else "Active"

            if preserve_existing:
                available = True
                if technician.status == "active":
                    reason = "Existing booking"
                else:
                    reason = (
                        "Existing booking - "
                        f"{status_labels.get(technician.status, technician.status)}"
                    )
            elif technician.status != "active":
                available = False
                reason = status_labels.get(technician.status, technician.status)
            elif technician_conflicts:
                available = False
                conflict = technician_conflicts[0]
                booking_time = self._format_booking_time(
                    conflict.get("start_time"),
                    conflict.get("end_time"),
                )
                reason = (
                    f"Booked {conflict['service_date'].isoformat()} "
                    f"({booking_time}) - {conflict['ticket_number']}"
                )

            results.append({
                "id": technician.id,
                "employee_id": technician.employee_id,
                "full_name": technician.full_name,
                "status": technician.status,
                "available": available,
                "reason": reason,
                "existing_assignment": technician.id in existing_assignment_ids,
                "conflicts": [
                    {
                        "ticket_id": conflict["ticket_id"],
                        "ticket_number": conflict["ticket_number"],
                        "subject": conflict["subject"],
                        "service_date": conflict["service_date"].isoformat(),
                        "start_time": (
                            conflict["start_time"].strftime("%H:%M")
                            if conflict.get("start_time")
                            else None
                        ),
                        "end_time": (
                            conflict["end_time"].strftime("%H:%M")
                            if conflict.get("end_time")
                            else None
                        ),
                    }
                    for conflict in technician_conflicts[:5]
                ],
            })

        return Response({
            "service_date": service_date.isoformat() if service_date else None,
            "available_count": sum(1 for item in results if item["available"]),
            "technicians": results,
        })

    @action(detail=False, methods=["get"], url_path="calendar")
    def calendar(self, request):
        month = request.query_params.get("month")
        date_from = parse_date(request.query_params.get("date_from", ""))
        date_to = parse_date(request.query_params.get("date_to", ""))

        if month:
            try:
                year, month_number = [int(part) for part in month.split("-")]
                range_start = date(year, month_number, 1)
                if month_number == 12:
                    range_end = date(year + 1, 1, 1) - timedelta(days=1)
                else:
                    range_end = date(year, month_number + 1, 1) - timedelta(days=1)
            except (TypeError, ValueError):
                raise ValidationError({"month": "Use YYYY-MM format."})
        else:
            range_start = date_from or timezone.localdate().replace(day=1)
            range_end = date_to or (range_start + timedelta(days=62))

        queryset = self.get_queryset().filter(service_date__isnull=False).prefetch_related("technicians")
        tech_filter = request.query_params.get("technician")
        if tech_filter:
            queryset = queryset.filter(technicians__id=tech_filter).distinct()

        events = []
        for ticket in queryset:
            for occurrence_date in ticket_occurrences(ticket, range_start, range_end):
                events.append({
                    "id": f"{ticket.id}-{occurrence_date.isoformat()}",
                    "ticket_id": ticket.id,
                    "ticket_number": ticket.ticket_number,
                    "subject": ticket.subject,
                    "customer_id": ticket.customer_id,
                    "customer_name": ticket.customer.company_name if ticket.customer else "",
                    "location_name": ticket.location.location_name if ticket.location else None,
                    "priority": ticket.priority,
                    "status": ticket.status,
                    "service_date": occurrence_date.isoformat(),
                    "start_time": ticket.start_time,
                    "end_time": ticket.end_time,
                    "recurrence_type": ticket.recurrence_type,
                    "technicians": [
                        {"id": t.id, "full_name": t.full_name, "employee_id": t.employee_id}
                        for t in ticket.technicians.all()
                    ],
                })

        events.sort(key=lambda item: (item["service_date"], str(item["start_time"] or ""), item["ticket_number"]))
        return Response(events)


class TicketAttachmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TicketAttachment.objects.select_related("ticket", "uploaded_by")
    serializer_class = TicketAttachmentSerializer
    permission_classes = [HasModuleAccess]
    required_module = "tickets"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Keep attachment visibility aligned with ticket visibility.
        if not is_privileged_user(user):
            technician = get_linked_technician(user)
            if technician:
                queryset = queryset.filter(ticket__technicians=technician).distinct()
            else:
                queryset = queryset.filter(ticket__created_by=user)

        ticket_id = self.request.query_params.get("ticket")
        if ticket_id:
            queryset = queryset.filter(ticket_id=ticket_id)
        return queryset

    @action(detail=True, methods=["delete"], url_path="delete")
    def delete_attachment(self, request, pk=None):
        if not is_admin_user(request.user):
            raise PermissionDenied("Only an administrator can delete ticket attachments.")
        attachment = self.get_object()
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DashboardStatsView(APIView):
    permission_classes = [HasModuleAccess]
    required_module = "dashboard"

    def get(self, request):
        tickets = Ticket.objects.all().prefetch_related("technicians")

        # Keep dashboard ticket data aligned with ticket visibility.
        # Technicians see assigned tickets only; regular users see tickets they created.
        if not is_privileged_user(request.user):
            technician = get_linked_technician(request.user)
            if technician:
                tickets = tickets.filter(technicians=technician).distinct()
            else:
                tickets = tickets.filter(created_by=request.user)

        today = timezone.localdate()
        last_7_days = []
        for days_ago in range(6, -1, -1):
            day = today - timedelta(days=days_ago)
            last_7_days.append({
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "count": tickets.filter(created_at__date=day).count(),
            })

        upcoming = (
            tickets
            .filter(service_date__gte=today, status="open")
            .order_by("service_date", "start_time")[:8]
        )

        return Response({
            "total_tickets": tickets.count(),
            "open_tickets": tickets.filter(status="open").count(),
            "resolved_tickets": tickets.filter(status="closed").count(),
            "total_customers": (
                Customer.objects.count()
                if is_privileged_user(request.user)
                else tickets.values("customer_id").distinct().count()
            ),
            "status_counts": {
                "open": tickets.filter(status="open").count(),
                "closed": tickets.filter(status="closed").count(),
            },
            "last_7_days": last_7_days,
            "upcoming_jobs": [
                {
                    "id": ticket.id,
                    "ticket_number": ticket.ticket_number,
                    "subject": ticket.subject,
                    "customer_name": ticket.customer.company_name if ticket.customer else "",
                    "service_date": ticket.service_date,
                    "start_time": ticket.start_time,
                    "technician_names": [t.full_name for t in ticket.technicians.all()],
                }
                for ticket in upcoming
            ],
            "can_view_billable_hours": is_admin_user(request.user),
        })


class InboundEmailTicketView(APIView):
    """Create an unassigned ticket from the public tickets mailbox.

    An email provider (for example Postmark/Mailgun/SendGrid inbound parse) must
    POST the parsed message here. Protect the webhook with INBOUND_EMAIL_SECRET.
    No confirmation email is sent to the client, per the MVP checklist.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        configured_secret = os.getenv("INBOUND_EMAIL_SECRET", "").strip()
        provided_secret = request.headers.get("X-Inbound-Email-Secret", "").strip()
        if not configured_secret:
            return Response(
                {"detail": "Inbound email ticket creation is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if provided_secret != configured_secret:
            return Response({"detail": "Invalid integration secret."}, status=status.HTTP_403_FORBIDDEN)

        sender = str(
            request.data.get("from_email")
            or request.data.get("sender")
            or request.data.get("from")
            or ""
        ).strip()
        # Common inbound providers can send "Name <email@example.com>".
        if "<" in sender and ">" in sender:
            sender = sender.split("<", 1)[1].split(">", 1)[0].strip()

        customer = Customer.objects.filter(email__iexact=sender).first() if sender else None
        if not customer:
            raise ValidationError({
                "from_email": "No customer with this email address was found. Add the customer before routing their email into ticketing."
            })

        subject = str(request.data.get("subject") or "Email service request").strip()
        body = str(
            request.data.get("text")
            or request.data.get("body")
            or request.data.get("stripped_text")
            or ""
        ).strip()

        ticket = Ticket.objects.create(
            customer=customer,
            subject=subject[:200],
            description=body,
            contact_name=customer.contact_name,
            contact_email=sender or customer.email,
            contact_phone=customer.phone,
            category="service",
            priority="medium",
            status="open",
        )
        notify_manager_users(ticket)
        send_new_ticket_notification(ticket)
        return Response(
            TicketSerializer(ticket, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class DattoInboundTicketView(APIView):
    """Inbound endpoint for a Datto/RMM email relay or webhook.

    Datto currently emails Autotask. To use this endpoint in production, route
    the RMM email through a mail provider/webhook that POSTs the parsed payload
    here and configure DATTO_INBOUND_SECRET.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        configured_secret = os.getenv("DATTO_INBOUND_SECRET", "").strip()
        provided_secret = request.headers.get("X-Datto-Secret", "").strip()
        if not configured_secret:
            return Response(
                {"detail": "Datto inbound integration is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if provided_secret != configured_secret:
            return Response({"detail": "Invalid integration secret."}, status=status.HTTP_403_FORBIDDEN)

        customer_id = request.data.get("customer_id")
        customer_name = str(request.data.get("customer_name", "")).strip()
        customer_email = str(request.data.get("customer_email", "")).strip()

        customer = None
        if customer_id:
            customer = Customer.objects.filter(pk=customer_id).first()
        if not customer and customer_email:
            customer = Customer.objects.filter(email__iexact=customer_email).first()
        if not customer and customer_name:
            customer = Customer.objects.filter(company_name__iexact=customer_name).first()

        if not customer:
            raise ValidationError({"customer": "No matching customer was found for this RMM alert."})

        subject = str(request.data.get("subject", "RMM Alert")).strip() or "RMM Alert"
        description = str(request.data.get("description") or request.data.get("body") or "").strip()
        priority = str(request.data.get("priority", "medium")).strip().lower()
        if priority not in {"low", "medium", "high"}:
            priority = "medium"

        ticket = Ticket.objects.create(
            customer=customer,
            subject=subject[:200],
            description=description,
            category="service",
            priority=priority,
            status="open",
        )
        notify_manager_users(ticket)
        send_new_ticket_notification(ticket)
        return Response(TicketSerializer(ticket, context={"request": request}).data, status=status.HTTP_201_CREATED)

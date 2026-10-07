import calendar
from datetime import date

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail

from roles.permissions import normalize_role_name

from .models import Ticket


MANAGER_CLOSED_EMAIL = "managers@experttechnology.net"


def get_manager_emails():
    emails = list(
        User.objects.filter(
            is_active=True,
            profile__role__name__iexact="Manager",
        )
        .exclude(email="")
        .values_list("email", flat=True)
    )
    return sorted(set(email.strip() for email in emails if email and email.strip()))


def _send(subject, body, recipients):
    recipients = sorted(set(email for email in recipients if email))
    if not recipients:
        return 0
    try:
        return send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            fail_silently=True,
        )
    except Exception:
        # Email configuration should never make ticket creation fail.
        return 0


def send_new_ticket_notification(ticket):
    recipients = get_manager_emails()
    if not recipients:
        return 0
    return _send(
        f"New ticket {ticket.ticket_number}: {ticket.subject}",
        (
            f"A new ticket was created.\n\n"
            f"Ticket: {ticket.ticket_number}\n"
            f"Customer: {ticket.customer.company_name if ticket.customer else ''}\n"
            f"Subject: {ticket.subject}\n"
            f"Priority: {ticket.get_priority_display()}\n"
            f"Status: {ticket.get_status_display()}\n"
        ),
        recipients,
    )


def send_assignment_notifications(ticket, technicians):
    sent = 0
    for technician in technicians:
        email = technician.email or (technician.user.email if technician.user_id else "")
        if not email:
            continue
        schedule = ticket.service_date.isoformat() if ticket.service_date else "Not scheduled yet"
        sent += _send(
            f"Ticket assigned: {ticket.ticket_number}",
            (
                f"You have been assigned to {ticket.ticket_number}.\n\n"
                f"Customer: {ticket.customer.company_name if ticket.customer else ''}\n"
                f"Subject: {ticket.subject}\n"
                f"Service date: {schedule}\n"
                f"Priority: {ticket.get_priority_display()}\n"
            ),
            [email],
        )
    return sent


def send_closed_ticket_notification(ticket):
    recipients = sorted(set(get_manager_emails() + [MANAGER_CLOSED_EMAIL]))
    return _send(
        f"Ticket closed: {ticket.ticket_number}",
        (
            f"Ticket {ticket.ticket_number} has been closed.\n\n"
            f"Customer: {ticket.customer.company_name if ticket.customer else ''}\n"
            f"Subject: {ticket.subject}\n"
            f"Closed: {ticket.resolved_at or ''}\n"
        ),
        recipients,
    )


def add_months(original, months):
    month_index = original.month - 1 + months
    year = original.year + month_index // 12
    month = month_index % 12 + 1
    day = min(original.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def schedule_occurrence_dates(
    service_date,
    recurrence_type="none",
    recurrence_end_date=None,
):
    """Return every planned service date for a candidate schedule.

    New/changed recurring schedules are validated to have an end date. This
    helper remains tolerant so older records without one can still be read.
    """
    if not service_date:
        return []

    if recurrence_type == "none" or not recurrence_end_date:
        return [service_date]

    step = 1 if recurrence_type == "monthly" else 3
    occurrences = []
    current = service_date
    guard = 0

    while current <= recurrence_end_date and guard < 1200:
        occurrences.append(current)
        current = add_months(current, step)
        guard += 1

    return occurrences


def schedule_times_overlap(candidate_start, candidate_end, existing_start, existing_end):
    """Return True when two bookings overlap.

    A booking without a complete start/end pair is treated as an all-day
    booking. This is intentionally conservative so an unspecific booking cannot
    accidentally be double-booked. Adjacent bookings are allowed (for example,
    09:00-11:00 and 11:00-13:00).
    """
    candidate_has_range = candidate_start is not None and candidate_end is not None
    existing_has_range = existing_start is not None and existing_end is not None

    if not candidate_has_range or not existing_has_range:
        return True

    return candidate_start < existing_end and candidate_end > existing_start


def get_schedule_conflicts(
    technician_ids,
    service_date,
    start_time=None,
    end_time=None,
    recurrence_type="none",
    recurrence_end_date=None,
    exclude_ticket_id=None,
):
    """Find open ticket bookings that conflict with a candidate schedule.

    The return value is keyed by technician id. Each value is a list of conflict
    dictionaries containing the ticket and the first-class occurrence date.
    """
    technician_ids = {int(value) for value in technician_ids if value is not None}
    candidate_dates = schedule_occurrence_dates(
        service_date,
        recurrence_type,
        recurrence_end_date,
    )

    if not technician_ids or not candidate_dates:
        return {}

    candidate_date_set = set(candidate_dates)
    range_start = min(candidate_dates)
    range_end = max(candidate_dates)

    queryset = (
        Ticket.objects
        .filter(
            status="open",
            service_date__isnull=False,
            service_date__lte=range_end,
            technicians__id__in=technician_ids,
        )
        .prefetch_related("technicians")
        .distinct()
    )

    if exclude_ticket_id:
        queryset = queryset.exclude(pk=exclude_ticket_id)

    conflicts = {}

    for ticket in queryset:
        existing_dates = set(
            ticket_occurrences(
                ticket,
                range_start,
                range_end,
            )
        )
        overlap_dates = sorted(candidate_date_set.intersection(existing_dates))

        if not overlap_dates:
            continue

        if not schedule_times_overlap(
            start_time,
            end_time,
            ticket.start_time,
            ticket.end_time,
        ):
            continue

        shared_technician_ids = technician_ids.intersection(
            tech.id for tech in ticket.technicians.all()
        )

        for technician_id in shared_technician_ids:
            bucket = conflicts.setdefault(technician_id, [])
            for occurrence_date in overlap_dates:
                bucket.append({
                    "ticket_id": ticket.id,
                    "ticket_number": ticket.ticket_number,
                    "subject": ticket.subject,
                    "service_date": occurrence_date,
                    "start_time": ticket.start_time,
                    "end_time": ticket.end_time,
                })

    return conflicts


def ticket_occurrences(ticket, range_start, range_end):
    """Yield service dates for one ticket within a requested calendar range."""
    if not ticket.service_date or not ticket.technicians.exists():
        return []

    end_limit = ticket.recurrence_end_date or range_end
    end_limit = min(end_limit, range_end)

    if ticket.recurrence_type == "none":
        if range_start <= ticket.service_date <= range_end:
            return [ticket.service_date]
        return []

    step = 1 if ticket.recurrence_type == "monthly" else 3
    occurrences = []
    current = ticket.service_date

    # Fast-forward close to the requested range without requiring dateutil.
    guard = 0
    while current < range_start and guard < 600:
        current = add_months(current, step)
        guard += 1

    while current <= end_limit and guard < 1200:
        occurrences.append(current)
        current = add_months(current, step)
        guard += 1

    return occurrences

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from licenses.models import License
from tickets.models import Ticket
from warranties.models import Warranty
from systemsettings.models import SystemSetting

from .models import Notification


# =========================================================
# SYSTEM RECIPIENTS
# =========================================================

def get_system_admin_recipients():
    User = get_user_model()

    return (
        User.objects
        .filter(is_active=True)
        .filter(
            Q(is_superuser=True)
            | Q(
                profile__role__name__iexact="Admin"
            )
        )
        .distinct()
    )


# =========================================================
# TICKET DEADLINE NOTIFICATIONS
# =========================================================

def generate_ticket_deadline_notifications():
    today = timezone.localdate()

    # Get current value from System Settings.
    system_settings = SystemSetting.load()

    due_soon_days = (
        system_settings.ticket_due_soon_days
    )

    tickets = (
        Ticket.objects
        .select_related(
            "technician",
            "technician__user",
        )
        .exclude(
            status__in=[
                "resolved",
                "closed",
            ]
        )
        .filter(
            due_date__isnull=False,
            technician__isnull=False,
            technician__user__isnull=False,
        )
    )

    created_count = 0

    for ticket in tickets:
        recipient = ticket.technician.user

        days_remaining = (
            ticket.due_date - today
        ).days

        # =====================================
        # OVERDUE
        # =====================================

        if days_remaining < 0:
            notification_type = "ticket_overdue"
            title = "Ticket Overdue"

            overdue_days = abs(
                days_remaining
            )

            message = (
                f"{ticket.ticket_number}: "
                f"{ticket.subject} "
                f"is overdue by "
                f"{overdue_days} day"
                f"{'s' if overdue_days != 1 else ''}."
            )

        # =====================================
        # DUE SOON
        # =====================================

        elif days_remaining <= due_soon_days:
            notification_type = "ticket_due"
            title = "Ticket Due Soon"

            if days_remaining == 0:
                message = (
                    f"{ticket.ticket_number}: "
                    f"{ticket.subject} "
                    f"is due today."
                )

            elif days_remaining == 1:
                message = (
                    f"{ticket.ticket_number}: "
                    f"{ticket.subject} "
                    f"is due tomorrow."
                )

            else:
                message = (
                    f"{ticket.ticket_number}: "
                    f"{ticket.subject} "
                    f"is due in "
                    f"{days_remaining} days."
                )

        else:
            continue


        # =====================================
        # DUPLICATE PREVENTION
        # =====================================

        already_exists = (
            Notification.objects.filter(
                recipient=recipient,
                notification_type=notification_type,
                module="Tickets",
                object_id=str(ticket.id),
            )
            .exists()
        )

        if already_exists:
            continue


        Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            module="Tickets",
            object_id=str(ticket.id),
            link="/tickets",
        )

        created_count += 1


    return created_count


# =========================================================
# WARRANTY EXPIRATION NOTIFICATIONS
# =========================================================

def generate_warranty_expiration_notifications():
    today = timezone.localdate()

    # Get current value from System Settings.
    system_settings = SystemSetting.load()

    warning_days = (
        system_settings
        .warranty_expiry_warning_days
    )

    warranties = (
        Warranty.objects
        .select_related(
            "equipment"
        )
        .filter(
            expiration_date__isnull=False
        )
        .exclude(
            status="void"
        )
    )


    recipients = (
        get_system_admin_recipients()
    )

    created_count = 0


    for warranty in warranties:
        days_remaining = (
            warranty.expiration_date
            - today
        ).days


        equipment_name = (
            warranty
            .equipment
            .equipment_name
        )


        warranty_reference = (
            warranty.warranty_number
            or "Warranty"
        )


        # =====================================
        # EXPIRED
        # =====================================

        if days_remaining < 0:
            title = "Warranty Expired"

            expired_days = abs(
                days_remaining
            )

            message = (
                f"{equipment_name} "
                f"({warranty_reference}) "
                f"expired "
                f"{expired_days} day"
                f"{'s' if expired_days != 1 else ''} "
                f"ago."
            )

        # =====================================
        # EXPIRING SOON
        # =====================================

        elif days_remaining <= warning_days:
            title = (
                "Warranty Expiring Soon"
            )

            if days_remaining == 0:
                message = (
                    f"{equipment_name} "
                    f"({warranty_reference}) "
                    f"expires today."
                )

            elif days_remaining == 1:
                message = (
                    f"{equipment_name} "
                    f"({warranty_reference}) "
                    f"expires tomorrow."
                )

            else:
                message = (
                    f"{equipment_name} "
                    f"({warranty_reference}) "
                    f"expires in "
                    f"{days_remaining} days."
                )

        else:
            continue


        # =====================================
        # CREATE FOR ADMIN RECIPIENTS
        # =====================================

        for recipient in recipients:

            already_exists = (
                Notification.objects.filter(
                    recipient=recipient,
                    notification_type=(
                        "warranty_expiry"
                    ),
                    module="Warranties",
                    object_id=str(
                        warranty.id
                    ),
                    title=title,
                )
                .exists()
            )

            if already_exists:
                continue


            Notification.objects.create(
                recipient=recipient,
                notification_type=(
                    "warranty_expiry"
                ),
                title=title,
                message=message,
                module="Warranties",
                object_id=str(
                    warranty.id
                ),
                link="/warranties",
            )

            created_count += 1


    return created_count


# =========================================================
# LICENSE EXPIRATION NOTIFICATIONS
# =========================================================

def generate_license_expiration_notifications():
    today = timezone.localdate()

    # Get current value from System Settings.
    system_settings = SystemSetting.load()

    warning_days = (
        system_settings
        .license_expiry_warning_days
    )

    licenses = (
        License.objects
        .select_related(
            "equipment"
        )
        .filter(
            expiration_date__isnull=False
        )
        .exclude(
            status="suspended"
        )
    )


    recipients = (
        get_system_admin_recipients()
    )

    created_count = 0


    for license_record in licenses:

        days_remaining = (
            license_record.expiration_date
            - today
        ).days


        equipment_name = (
            license_record
            .equipment
            .equipment_name
        )


        license_reference = (
            license_record.license_number
            or license_record.license_type
            or "License"
        )


        # =====================================
        # EXPIRED
        # =====================================

        if days_remaining < 0:
            title = "License Expired"

            expired_days = abs(
                days_remaining
            )

            message = (
                f"{equipment_name} "
                f"({license_reference}) "
                f"expired "
                f"{expired_days} day"
                f"{'s' if expired_days != 1 else ''} "
                f"ago."
            )

        # =====================================
        # EXPIRING SOON
        # =====================================

        elif days_remaining <= warning_days:
            title = (
                "License Expiring Soon"
            )

            if days_remaining == 0:
                message = (
                    f"{equipment_name} "
                    f"({license_reference}) "
                    f"expires today."
                )

            elif days_remaining == 1:
                message = (
                    f"{equipment_name} "
                    f"({license_reference}) "
                    f"expires tomorrow."
                )

            else:
                message = (
                    f"{equipment_name} "
                    f"({license_reference}) "
                    f"expires in "
                    f"{days_remaining} days."
                )

        else:
            continue


        # =====================================
        # CREATE FOR ADMIN RECIPIENTS
        # =====================================

        for recipient in recipients:

            already_exists = (
                Notification.objects.filter(
                    recipient=recipient,
                    notification_type=(
                        "license_expiry"
                    ),
                    module="Licenses",
                    object_id=str(
                        license_record.id
                    ),
                    title=title,
                )
                .exists()
            )

            if already_exists:
                continue


            Notification.objects.create(
                recipient=recipient,
                notification_type=(
                    "license_expiry"
                ),
                title=title,
                message=message,
                module="Licenses",
                object_id=str(
                    license_record.id
                ),
                link="/licenses",
            )

            created_count += 1


    return created_count
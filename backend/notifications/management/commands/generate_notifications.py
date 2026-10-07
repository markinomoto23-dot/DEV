from django.core.management.base import BaseCommand

from notifications.services import (
    generate_ticket_deadline_notifications,
    generate_warranty_expiration_notifications,
    generate_license_expiration_notifications,
)


class Command(BaseCommand):
    help = (
        "Generate scheduled ticket, warranty, "
        "and license notifications."
    )

    def handle(self, *args, **options):
        self.stdout.write(
            "Generating scheduled notifications..."
        )

        ticket_count = (
            generate_ticket_deadline_notifications()
        )

        warranty_count = (
            generate_warranty_expiration_notifications()
        )

        license_count = (
            generate_license_expiration_notifications()
        )

        total_count = (
            ticket_count
            + warranty_count
            + license_count
        )

        self.stdout.write(
            f"Ticket notifications: {ticket_count}"
        )

        self.stdout.write(
            f"Warranty notifications: {warranty_count}"
        )

        self.stdout.write(
            f"License notifications: {license_count}"
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {total_count} "
                f"new notification(s)."
            )
        )

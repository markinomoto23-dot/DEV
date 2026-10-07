from rest_framework import serializers

from .models import Billing


class BillingSerializer(serializers.ModelSerializer):
    ticket_number = serializers.CharField(
        source="ticket.ticket_number",
        read_only=True,
        allow_null=True,
    )

    ticket_subject = serializers.CharField(
        source="ticket.subject",
        read_only=True,
        allow_null=True,
    )

    customer_name = serializers.CharField(
        source="ticket.customer.company_name",
        read_only=True,
        allow_null=True,
    )

    location_name = serializers.CharField(
        source="ticket.location.location_name",
        read_only=True,
        allow_null=True,
    )

    equipment_name = serializers.CharField(
        source="ticket.equipment.equipment_name",
        read_only=True,
        allow_null=True,
    )

    technician_name = serializers.CharField(
        source="technician.full_name",
        read_only=True,
        allow_null=True,
    )

    technician_employee_id = serializers.CharField(
        source="technician.employee_id",
        read_only=True,
        allow_null=True,
    )

    labor_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    balance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Billing

        fields = [
            "id",
            "invoice_number",

            "ticket",
            "ticket_number",
            "ticket_subject",

            "customer_name",
            "location_name",
            "equipment_name",

            "technician",
            "technician_name",
            "technician_employee_id",

            "labor_hours",
            "labor_rate",
            "labor_total",

            "parts_cost",
            "other_charges",
            "discount",
            "tax_rate",

            "subtotal",
            "tax_amount",
            "total_amount",

            "paid_amount",
            "balance",
            "status",

            "issued_date",
            "due_date",
            "notes",

            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "ticket": {
                "required": False,
                "allow_null": True,
            },
        }

        read_only_fields = [
            "id",
            "invoice_number",
            "ticket_number",
            "ticket_subject",
            "customer_name",
            "location_name",
            "equipment_name",
            "technician_name",
            "technician_employee_id",
            "labor_total",
            "subtotal",
            "tax_amount",
            "total_amount",
            "balance",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        paid_amount = attrs.get(
            "paid_amount",
            getattr(
                self.instance,
                "paid_amount",
                0,
            ),
        )

        labor_hours = attrs.get(
            "labor_hours",
            getattr(
                self.instance,
                "labor_hours",
                0,
            ),
        )

        if paid_amount < 0:
            raise serializers.ValidationError({
                "paid_amount":
                    "Paid amount cannot be negative."
            })

        if labor_hours < 0:
            raise serializers.ValidationError({
                "labor_hours":
                    "Labor hours cannot be negative."
            })

        issued_date = attrs.get(
            "issued_date",
            getattr(
                self.instance,
                "issued_date",
                None,
            ),
        )

        due_date = attrs.get(
            "due_date",
            getattr(
                self.instance,
                "due_date",
                None,
            ),
        )

        if (
            issued_date and
            due_date and
            due_date < issued_date
        ):
            raise serializers.ValidationError({
                "due_date":
                    "Due date cannot be earlier than issued date."
            })

        return attrs    
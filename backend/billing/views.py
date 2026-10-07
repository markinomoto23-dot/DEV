from rest_framework import viewsets
from rest_framework.filters import (
    SearchFilter,
    OrderingFilter,
)

from audittrail.utils import log_activity
from roles.permissions import HasModuleAccess

from .models import Billing
from .serializers import BillingSerializer


class BillingViewSet(viewsets.ModelViewSet):
    queryset = (
        Billing.objects
        .select_related(
            "ticket",
            "ticket__customer",
            "ticket__location",
            "ticket__equipment",
            "technician",
        )
        .all()
    )

    serializer_class = BillingSerializer

    permission_classes = [
        HasModuleAccess,
    ]

    required_module = "billing"

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "invoice_number",
        "ticket__ticket_number",
        "ticket__subject",
        "ticket__customer__company_name",
        "ticket__location__location_name",
        "ticket__equipment__equipment_name",
        "technician__employee_id",
        "technician__first_name",
        "technician__last_name",
    ]

    ordering_fields = [
        "invoice_number",
        "issued_date",
        "due_date",
        "total_amount",
        "paid_amount",
        "status",
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]

    # =====================================================
    # CUSTOMER / TICKET FILTERING
    # =====================================================

    def get_queryset(self):
        queryset = super().get_queryset()

        customer_id = (
            self.request.query_params.get(
                "customer"
            )
        )

        ticket_id = (
            self.request.query_params.get(
                "ticket"
            )
        )

        if customer_id:
            queryset = queryset.filter(
                ticket__customer_id=customer_id
            )

        if ticket_id:
            queryset = queryset.filter(
                ticket_id=ticket_id
            )

        return queryset

    # =====================================================
    # CREATE INVOICE
    # =====================================================

    def perform_create(self, serializer):
        billing = serializer.save()

        log_activity(
            request=self.request,
            action="create",
            module="Billing",
            object_id=billing.id,
            object_repr=billing.invoice_number,
            description=(
                f"Created invoice "
                f"{billing.invoice_number} "
                f"for "
                f"{billing.ticket.ticket_number if billing.ticket else 'No Ticket'}"
            ),
            changes={
                "ticket":
                    billing.ticket.ticket_number if billing.ticket else "No Ticket",

                "technician": (
                    str(billing.technician)
                    if billing.technician
                    else None
                ),

                "labor_hours":
                    str(billing.labor_hours),

                "labor_rate":
                    str(billing.labor_rate),

                "parts_cost":
                    str(billing.parts_cost),

                "other_charges":
                    str(billing.other_charges),

                "discount":
                    str(billing.discount),

                "tax_rate":
                    str(billing.tax_rate),

                "total_amount":
                    str(billing.total_amount),

                "paid_amount":
                    str(billing.paid_amount),

                "status":
                    billing.status,

                "due_date": (
                    str(billing.due_date)
                    if billing.due_date
                    else None
                ),
            },
        )

    # =====================================================
    # UPDATE INVOICE
    # =====================================================

    def perform_update(self, serializer):
        old_billing = self.get_object()

        old_values = {
            "technician": (
                str(old_billing.technician)
                if old_billing.technician
                else None
            ),

            "labor_hours":
                str(old_billing.labor_hours),

            "labor_rate":
                str(old_billing.labor_rate),

            "parts_cost":
                str(old_billing.parts_cost),

            "other_charges":
                str(old_billing.other_charges),

            "discount":
                str(old_billing.discount),

            "tax_rate":
                str(old_billing.tax_rate),

            "total_amount":
                str(old_billing.total_amount),

            "paid_amount":
                str(old_billing.paid_amount),

            "status":
                old_billing.status,

            "due_date": (
                str(old_billing.due_date)
                if old_billing.due_date
                else None
            ),
        }

        billing = serializer.save()

        new_values = {
            "technician": (
                str(billing.technician)
                if billing.technician
                else None
            ),

            "labor_hours":
                str(billing.labor_hours),

            "labor_rate":
                str(billing.labor_rate),

            "parts_cost":
                str(billing.parts_cost),

            "other_charges":
                str(billing.other_charges),

            "discount":
                str(billing.discount),

            "tax_rate":
                str(billing.tax_rate),

            "total_amount":
                str(billing.total_amount),

            "paid_amount":
                str(billing.paid_amount),

            "status":
                billing.status,

            "due_date": (
                str(billing.due_date)
                if billing.due_date
                else None
            ),
        }

        changes = {}

        for field in old_values:
            if old_values[field] != new_values[field]:
                changes[field] = {
                    "from": old_values[field],
                    "to": new_values[field],
                }

        # GENERAL UPDATE
        if changes:
            log_activity(
                request=self.request,
                action="update",
                module="Billing",
                object_id=billing.id,
                object_repr=billing.invoice_number,
                description=(
                    f"Updated invoice "
                    f"{billing.invoice_number}"
                ),
                changes=changes,
            )

        # PAYMENT CHANGE
        if (
            old_values["paid_amount"]
            != new_values["paid_amount"]
        ):
            log_activity(
                request=self.request,
                action="payment",
                module="Billing",
                object_id=billing.id,
                object_repr=billing.invoice_number,
                description=(
                    f"Payment updated for "
                    f"{billing.invoice_number} "
                    f"from ₱"
                    f"{old_values['paid_amount']} "
                    f"to ₱"
                    f"{new_values['paid_amount']}"
                ),
                changes={
                    "paid_amount": {
                        "from":
                            old_values[
                                "paid_amount"
                            ],

                        "to":
                            new_values[
                                "paid_amount"
                            ],
                    },

                    "status": {
                        "from":
                            old_values[
                                "status"
                            ],

                        "to":
                            new_values[
                                "status"
                            ],
                    },

                    "total_amount": {
                        "from":
                            old_values[
                                "total_amount"
                            ],

                        "to":
                            new_values[
                                "total_amount"
                            ],
                    },
                },
            )

    # =====================================================
    # DELETE INVOICE
    # =====================================================

    def perform_destroy(self, instance):
        billing_id = instance.id

        invoice_number = (
            instance.invoice_number
        )

        ticket_number = (
            instance.ticket.ticket_number if instance.ticket else "No Ticket"
        )

        total_amount = (
            str(instance.total_amount)
        )

        paid_amount = (
            str(instance.paid_amount)
        )

        log_activity(
            request=self.request,
            action="delete",
            module="Billing",
            object_id=billing_id,
            object_repr=invoice_number,
            description=(
                f"Deleted invoice "
                f"{invoice_number} "
                f"for ticket "
                f"{ticket_number}"
            ),
            changes={
                "ticket":
                    ticket_number,

                "total_amount":
                    total_amount,

                "paid_amount":
                    paid_amount,

                "status":
                    instance.status,
            },
        )

        instance.delete()
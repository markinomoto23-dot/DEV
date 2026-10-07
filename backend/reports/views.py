import csv
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.utils.dateparse import parse_date

from rest_framework.response import Response
from rest_framework.views import APIView

from billing.models import Billing
from customers.models import Customer
from roles.permissions import AdminOnly, HasModuleAccess, is_admin_user
from technicians.models import Technician
from tickets.models import Ticket


class ReportsSummaryView(APIView):
    permission_classes = [HasModuleAccess]
    required_module = "reports"

    def get(self, request):
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        technician_id = request.query_params.get("technician")
        status = request.query_params.get("status")

        parsed_from = parse_date(date_from) if date_from else None
        parsed_to = parse_date(date_to) if date_to else None

        tickets = (
            Ticket.objects
            .select_related("customer", "location", "equipment")
            .prefetch_related("technicians")
            .all()
        )

        billings = Billing.objects.select_related("ticket", "ticket__customer", "ticket__equipment", "technician")

        if parsed_from:
            tickets = tickets.filter(created_at__date__gte=parsed_from)
            billings = billings.filter(issued_date__gte=parsed_from)
        if parsed_to:
            tickets = tickets.filter(created_at__date__lte=parsed_to)
            billings = billings.filter(issued_date__lte=parsed_to)
        if technician_id:
            tickets = tickets.filter(technicians__id=technician_id).distinct()
            billings = billings.filter(technician_id=technician_id)
        if status:
            tickets = tickets.filter(status=status)

        total_tickets = tickets.count()
        open_tickets = tickets.filter(status="open").count()
        closed_tickets = tickets.filter(status="closed").count()
        total_customers = tickets.values("customer_id").distinct().count()
        total_technicians = tickets.values("technicians__id").exclude(technicians__id__isnull=True).distinct().count()

        if not any([date_from, date_to, technician_id, status]):
            total_customers = Customer.objects.count()
            total_technicians = Technician.objects.count()

        admin = is_admin_user(request.user)
        total_billed = Decimal("0.00")
        total_paid = Decimal("0.00")
        outstanding = Decimal("0.00")
        if admin:
            billing_totals = billings.aggregate(total_billed=Sum("total_amount"), total_paid=Sum("paid_amount"))
            total_billed = billing_totals["total_billed"] or Decimal("0.00")
            total_paid = billing_totals["total_paid"] or Decimal("0.00")
            outstanding = max(total_billed - total_paid, Decimal("0.00"))

        # Performance is based on CLOSED tickets in the requested closure period,
        # as requested by the client for raise/performance reviews.
        performance_tickets = Ticket.objects.filter(status="closed").prefetch_related("technicians")
        if parsed_from:
            performance_tickets = performance_tickets.filter(resolved_at__date__gte=parsed_from)
        if parsed_to:
            performance_tickets = performance_tickets.filter(resolved_at__date__lte=parsed_to)
        if technician_id:
            performance_tickets = performance_tickets.filter(technicians__id=technician_id)

        performance_rows = (
            Technician.objects
            .filter(tickets__isnull=False)
            .annotate(
                total_assigned=Count(
                    "tickets",
                    filter=Q(tickets__in=tickets),
                    distinct=True,
                ),
                open_tickets=Count(
                    "tickets",
                    filter=Q(tickets__in=tickets, tickets__status="open"),
                    distinct=True,
                ),
                closed_tickets=Count(
                    "tickets",
                    filter=Q(tickets__in=performance_tickets),
                    distinct=True,
                ),
            )
            .order_by("-closed_tickets", "last_name", "first_name")
        )

        formatted_technicians = []
        for technician in performance_rows:
            total = technician.total_assigned
            closed = technician.closed_tickets
            formatted_technicians.append({
                "technician_id": technician.id,
                "employee_id": technician.employee_id,
                "technician_name": technician.full_name,
                "total_tickets": total,
                "active_tickets": technician.open_tickets,
                "completed_tickets": closed,
                "closed_tickets": closed,
                "closure_rate": round((closed / total * 100), 1) if total else 0,
            })

        customer_history = list(
            tickets.values("customer_id", "customer__company_name")
            .annotate(
                total_tickets=Count("id", distinct=True),
                completed_tickets=Count("id", filter=Q(status="closed"), distinct=True),
            )
            .order_by("-total_tickets")[:10]
        )
        formatted_customers = [
            {
                "customer_id": item["customer_id"],
                "customer_name": item["customer__company_name"],
                "total_tickets": item["total_tickets"],
                "completed_tickets": item["completed_tickets"],
            }
            for item in customer_history
        ]

        equipment_history = list(
            tickets.exclude(equipment__isnull=True)
            .values("equipment_id", "equipment__equipment_name", "equipment__serial_number")
            .annotate(total_tickets=Count("id", distinct=True))
            .order_by("-total_tickets")[:10]
        )
        formatted_equipment = [
            {
                "equipment_id": item["equipment_id"],
                "equipment_name": item["equipment__equipment_name"],
                "serial_number": item["equipment__serial_number"],
                "total_tickets": item["total_tickets"],
            }
            for item in equipment_history
        ]

        recent_tickets = []
        for ticket in tickets.order_by("-created_at")[:10]:
            recent_tickets.append({
                "id": ticket.id,
                "ticket_number": ticket.ticket_number,
                "subject": ticket.subject,
                "customer_name": ticket.customer.company_name if ticket.customer else "",
                "technician_name": ", ".join(t.full_name for t in ticket.technicians.all()) or "Unassigned",
                "status": ticket.status,
                "priority": ticket.priority,
                "created_at": ticket.created_at,
            })

        return Response({
            "filters": {
                "date_from": date_from,
                "date_to": date_to,
                "technician": technician_id,
                "status": status,
            },
            "permissions": {
                "can_export": admin,
                "can_view_financials": admin,
            },
            "summary": {
                "total_tickets": total_tickets,
                "open_tickets": open_tickets,
                "resolved_tickets": closed_tickets,
                "closed_tickets": closed_tickets,
                "total_customers": total_customers,
                "total_technicians": total_technicians,
                "total_billed": total_billed,
                "total_paid": total_paid,
                "outstanding": outstanding,
            },
            "tickets_by_status": {
                "open": open_tickets,
                "closed": closed_tickets,
            },
            "technician_performance": formatted_technicians,
            "customer_history": formatted_customers,
            "equipment_history": formatted_equipment,
            "recent_tickets": recent_tickets,
        })


class ReportsExportCSVView(APIView):
    permission_classes = [AdminOnly]

    def get(self, request):
        date_from = parse_date(request.query_params.get("date_from", ""))
        date_to = parse_date(request.query_params.get("date_to", ""))
        technician_id = request.query_params.get("technician")

        tickets = Ticket.objects.select_related("customer", "location", "equipment").prefetch_related("technicians")
        if date_from:
            tickets = tickets.filter(created_at__date__gte=date_from)
        if date_to:
            tickets = tickets.filter(created_at__date__lte=date_to)
        if technician_id:
            tickets = tickets.filter(technicians__id=technician_id).distinct()

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="expert-tech-ticket-report.csv"'
        writer = csv.writer(response)
        writer.writerow([
            "Ticket", "Customer", "Subject", "Category", "Priority", "Status",
            "Service Date", "Due Date", "Technicians", "Created", "Closed",
        ])
        for ticket in tickets.order_by("-created_at"):
            writer.writerow([
                ticket.ticket_number,
                ticket.customer.company_name if ticket.customer else "",
                ticket.subject,
                ticket.get_category_display(),
                ticket.get_priority_display(),
                ticket.get_status_display(),
                ticket.service_date or "",
                ticket.due_date or "",
                ", ".join(t.full_name for t in ticket.technicians.all()),
                ticket.created_at.isoformat(),
                ticket.resolved_at.isoformat() if ticket.resolved_at else "",
            ])
        return response

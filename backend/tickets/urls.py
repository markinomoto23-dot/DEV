from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardStatsView,
    DattoInboundTicketView,
    InboundEmailTicketView,
    TicketAttachmentViewSet,
    TicketViewSet,
)

router = DefaultRouter()
router.register("attachments", TicketAttachmentViewSet, basename="ticket-attachment")
router.register("", TicketViewSet, basename="ticket")

urlpatterns = [
    path("dashboard-stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("datto-inbound/", DattoInboundTicketView.as_view(), name="datto-inbound"),
    path("inbound-email/", InboundEmailTicketView.as_view(), name="inbound-email"),
]
urlpatterns += router.urls

from django.urls import path
from .views import ReportsExportCSVView, ReportsSummaryView

urlpatterns = [
    path("summary/", ReportsSummaryView.as_view(), name="reports-summary"),
    path("export-csv/", ReportsExportCSVView.as_view(), name="reports-export-csv"),
]

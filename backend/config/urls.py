from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include



urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/accounts/",
        include("accounts.urls"),
    ),

    path(
        "api/customers/",
        include("customers.urls"),
    ),

    path(
        "api/locations/",
        include("locations.urls"),
    ),

    path(
    "api/equipment/",
    include("equipment.urls"),
    ),

    path(
    "api/warranties/",
    include("warranties.urls"),
    ),
    path(
        "api/licenses/",
        include("licenses.urls"),
    ),
    path(
        "api/tickets/",
        include("tickets.urls"),
    ),
    path(
    "api/technicians/",
    include("technicians.urls"),
    ),
    path(
        "api/billing/",
        include("billing.urls"),
    ),
    path(
        "api/reports/",
        include("reports.urls"),
    ),
    path(
        "api/access/",
        include("roles.urls"),
    ),
    path(
        "api/audit-trail/",
        include("audittrail.urls"),
    ),
    path(
        "api/notifications/",
        include("notifications.urls"),
    ),
    path(
        "api/settings/",
        include("systemsettings.urls"),
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

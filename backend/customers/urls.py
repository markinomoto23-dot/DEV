from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerImportCSVView,
    CustomerQuickCreateView,
    CustomerViewSet,
)

router = DefaultRouter()
router.register("", CustomerViewSet, basename="customer")

urlpatterns = [
    path(
        "quick-create/",
        CustomerQuickCreateView.as_view(),
        name="customer-quick-create",
    ),
    path(
        "import-csv/",
        CustomerImportCSVView.as_view(),
        name="customer-import-csv",
    ),
]
urlpatterns += router.urls

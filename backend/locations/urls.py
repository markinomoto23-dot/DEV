from rest_framework.routers import DefaultRouter

from .views import CustomerLocationDocumentViewSet, LocationViewSet


router = DefaultRouter()
router.register("documents", CustomerLocationDocumentViewSet, basename="customer-location-document")
router.register("", LocationViewSet, basename="location")

urlpatterns = router.urls

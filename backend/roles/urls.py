from django.urls import path

from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    MyPermissionsView,
    RoleViewSet,
    UserViewSet,
)


router = DefaultRouter()

router.register(
    "roles",
    RoleViewSet,
    basename="role",
)

router.register(
    "users",
    UserViewSet,
    basename="user",
)


urlpatterns = [
    path(
        "me/permissions/",
        MyPermissionsView.as_view(),
        name="my-permissions",
    ),
]

urlpatterns += router.urls
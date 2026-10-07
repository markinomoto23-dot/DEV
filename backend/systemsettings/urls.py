from django.urls import path

from .views import (
    RuntimeSettingsView,
    SystemSettingsView,
)


urlpatterns = [

    # Safe runtime settings for all
    # authenticated users.
    path(
        "runtime/",
        RuntimeSettingsView.as_view(),
        name="runtime-settings",
    ),

    # Full Settings module.
    path(
        "",
        SystemSettingsView.as_view(),
        name="system-settings",
    ),

]
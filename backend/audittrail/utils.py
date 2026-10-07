from .models import AuditLog


def get_client_ip(request):
    if not request:
        return None

    forwarded = request.META.get(
        "HTTP_X_FORWARDED_FOR"
    )

    if forwarded:
        return (
            forwarded
            .split(",")[0]
            .strip()
        )

    return request.META.get(
        "REMOTE_ADDR"
    )


def log_activity(
    request,
    action,
    module,
    object_id="",
    object_repr="",
    description="",
    changes=None,
    user_override=None,
):
    # =========================================
    # USER
    # =========================================

    user = user_override

    if (
        user is None
        and request
        and hasattr(request, "user")
        and request.user
        and request.user.is_authenticated
    ):
        user = request.user


    # =========================================
    # CREATE AUDIT LOG
    # =========================================

    return AuditLog.objects.create(
        user=user,

        action=action,

        module=module,

        object_id=str(
            object_id or ""
        ),

        object_repr=str(
            object_repr or ""
        )[:255],

        description=description,

        changes=changes or {},

        ip_address=get_client_ip(
            request
        ),
    )
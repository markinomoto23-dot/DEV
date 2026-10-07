from .models import Notification


def create_notification(
    recipient,
    title,
    message,
    notification_type="system",
    module="",
    object_id="",
    link="",
):

    if not recipient:
        return None

    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=
            notification_type,
        module=module,
        object_id=str(
            object_id or ""
        ),
        link=link,
    )
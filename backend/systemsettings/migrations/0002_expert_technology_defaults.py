from django.db import migrations, models


def apply_client_defaults(apps, schema_editor):
    SystemSetting = apps.get_model("systemsettings", "SystemSetting")
    setting = SystemSetting.objects.filter(pk=1).first()
    if not setting:
        return
    changed = []
    if not setting.support_email:
        setting.support_email = "Tickets@experttechnology.net"
        changed.append("support_email")
    if not setting.contact_number:
        setting.contact_number = "985-242-4343"
        changed.append("contact_number")
    if setting.timezone == "Asia/Manila":
        setting.timezone = "America/Chicago"
        changed.append("timezone")
    if changed:
        setting.save(update_fields=changed)


class Migration(migrations.Migration):
    dependencies = [("systemsettings", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="systemsetting",
            name="support_email",
            field=models.EmailField(blank=True, default="Tickets@experttechnology.net", max_length=254),
        ),
        migrations.AlterField(
            model_name="systemsetting",
            name="contact_number",
            field=models.CharField(blank=True, default="985-242-4343", max_length=50),
        ),
        migrations.AlterField(
            model_name="systemsetting",
            name="timezone",
            field=models.CharField(
                choices=[
                    ("Asia/Manila", "Asia/Manila"),
                    ("UTC", "UTC"),
                    ("America/New_York", "America/New_York"),
                    ("America/Chicago", "America/Chicago"),
                    ("America/Denver", "America/Denver"),
                    ("America/Los_Angeles", "America/Los_Angeles"),
                ],
                default="America/Chicago",
                max_length=100,
            ),
        ),
        migrations.RunPython(apply_client_defaults, migrations.RunPython.noop),
    ]

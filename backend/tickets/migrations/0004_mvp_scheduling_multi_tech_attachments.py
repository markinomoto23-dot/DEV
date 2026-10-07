import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def migrate_existing_ticket_values(apps, schema_editor):
    Ticket = apps.get_model("tickets", "Ticket")

    Ticket.objects.filter(status__in=["in_progress", "on_hold"]).update(status="open")
    Ticket.objects.filter(status="resolved").update(status="closed")
    Ticket.objects.filter(priority="urgent").update(priority="high")

    for ticket in Ticket.objects.exclude(technician_id__isnull=True).iterator():
        ticket.technicians.add(ticket.technician_id)


def reverse_existing_ticket_values(apps, schema_editor):
    # Values cannot be unambiguously restored; preserve current open/closed/high values.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("tickets", "0003_ticket_created_by"),
        ("technicians", "0002_technician_user"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="ticket",
            name="priority",
            field=models.CharField(
                choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
                default="medium",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="ticket",
            name="status",
            field=models.CharField(
                choices=[("open", "Open"), ("closed", "Closed")],
                default="open",
                max_length=30,
            ),
        ),
        migrations.AddField(model_name="ticket", name="contact_name", field=models.CharField(blank=True, max_length=150)),
        migrations.AddField(model_name="ticket", name="contact_email", field=models.EmailField(blank=True, max_length=254)),
        migrations.AddField(model_name="ticket", name="contact_phone", field=models.CharField(blank=True, max_length=50)),
        migrations.AddField(model_name="ticket", name="service_date", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="ticket", name="start_time", field=models.TimeField(blank=True, null=True)),
        migrations.AddField(model_name="ticket", name="end_time", field=models.TimeField(blank=True, null=True)),
        migrations.AddField(
            model_name="ticket",
            name="recurrence_type",
            field=models.CharField(
                choices=[("none", "Does not repeat"), ("monthly", "Monthly"), ("quarterly", "Quarterly")],
                default="none",
                max_length=20,
            ),
        ),
        migrations.AddField(model_name="ticket", name="recurrence_end_date", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="ticket", name="work_performed", field=models.TextField(blank=True)),
        migrations.AddField(model_name="ticket", name="time_on_site", field=models.TextField(blank=True)),
        migrations.AddField(model_name="ticket", name="equipment_materials_used", field=models.TextField(blank=True)),
        migrations.AddField(
            model_name="ticket",
            name="technicians",
            field=models.ManyToManyField(blank=True, related_name="tickets", to="technicians.technician"),
        ),
        migrations.AlterField(
            model_name="ticket",
            name="technician",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="legacy_tickets",
                to="technicians.technician",
            ),
        ),
        migrations.CreateModel(
            name="TicketAttachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="ticket_attachments/%Y/%m/")),
                ("original_name", models.CharField(blank=True, max_length=255)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                ("ticket", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attachments", to="tickets.ticket")),
                ("uploaded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ticket_attachments", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-uploaded_at"]},
        ),
        migrations.RunPython(migrate_existing_ticket_values, reverse_existing_ticket_values),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "tickets",
            "0004_ticketattachment_database_storage",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="ticketattachment",
            name="attachment_type",
            field=models.CharField(
                choices=[
                    (
                        "general",
                        "General Attachment",
                    ),
                    (
                        "completed_work_ticket",
                        "Completed Work Ticket",
                    ),
                ],
                db_index=True,
                default="general",
                max_length=40,
            ),
        ),
    ]

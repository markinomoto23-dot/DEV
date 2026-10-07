from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tickets", "0004_mvp_scheduling_multi_tech_attachments"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="ticketattachment",
            name="file",
        ),
        migrations.AddField(
            model_name="ticketattachment",
            name="content_type",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="ticketattachment",
            name="file_data",
            field=models.BinaryField(blank=True, default=bytes),
        ),
        migrations.AddField(
            model_name="ticketattachment",
            name="file_size",
            field=models.PositiveBigIntegerField(default=0),
        ),
    ]

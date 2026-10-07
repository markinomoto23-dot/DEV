from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("equipment", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="equipment",
            name="ownership_type",
            field=models.CharField(
                choices=[("owned", "Customer Owned"), ("leased", "Leased Asset")],
                default="owned",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="equipment",
            name="lease_provider",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="equipment",
            name="lease_end_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]

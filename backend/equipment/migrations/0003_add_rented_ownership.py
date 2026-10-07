from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("equipment", "0002_equipment_lease_fields")]

    operations = [
        migrations.AlterField(
            model_name="equipment",
            name="ownership_type",
            field=models.CharField(
                choices=[
                    ("owned", "Customer Owned"),
                    ("leased", "Leased Asset"),
                    ("rented", "Rented"),
                ],
                default="owned",
                max_length=20,
            ),
        ),
    ]

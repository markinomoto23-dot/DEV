from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("locations", "0003_location_contact_email"),
    ]

    operations = [
        migrations.AlterField(
            model_name="location",
            name="status",
            field=models.CharField(
                choices=[
                    ("active", "Active"),
                    ("inactive", "Inactive"),
                    ("credit_hold", "Credit Hold"),
                ],
                default="active",
                max_length=20,
            ),
        ),
    ]

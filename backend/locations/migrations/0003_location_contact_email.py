from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("locations", "0002_customerlocationdocument"),
    ]

    operations = [
        migrations.AddField(
            model_name="location",
            name="contact_email",
            field=models.EmailField(blank=True, max_length=254),
        ),
    ]

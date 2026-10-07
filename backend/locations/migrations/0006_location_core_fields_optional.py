from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("locations", "0005_remove_customerlocationdocument_file_and_more")]
    operations = [
        migrations.AlterField(model_name="location", name="customer", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="locations", to="customers.customer")),
        migrations.AlterField(model_name="location", name="location_name", field=models.CharField(blank=True, default="", max_length=150)),
    ]

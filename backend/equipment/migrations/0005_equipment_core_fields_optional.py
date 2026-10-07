from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("equipment", "0004_alter_equipment_ownership_type")]
    operations = [
        migrations.AlterField(model_name="equipment", name="location", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="equipment", to="locations.location")),
        migrations.AlterField(model_name="equipment", name="equipment_name", field=models.CharField(blank=True, default="", max_length=150)),
    ]

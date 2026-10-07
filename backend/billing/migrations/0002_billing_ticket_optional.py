from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("billing", "0001_initial")]
    operations = [migrations.AlterField(model_name="billing", name="ticket", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="billings", to="tickets.ticket"))]

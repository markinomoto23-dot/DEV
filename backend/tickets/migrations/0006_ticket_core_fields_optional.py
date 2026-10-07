from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("tickets", "0005_ticketattachment_attachment_type")]
    operations = [
        migrations.AlterField(model_name="ticket", name="customer", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="tickets", to="customers.customer")),
        migrations.AlterField(model_name="ticket", name="subject", field=models.CharField(blank=True, default="", max_length=200)),
    ]

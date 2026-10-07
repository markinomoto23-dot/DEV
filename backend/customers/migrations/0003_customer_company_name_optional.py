from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("customers", "0002_customer_credit_hold_status")]
    operations = [migrations.AlterField(model_name="customer", name="company_name", field=models.CharField(blank=True, default="", max_length=150))]

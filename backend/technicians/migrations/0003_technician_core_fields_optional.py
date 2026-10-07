from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("technicians", "0002_technician_user")]
    operations = [
        migrations.AlterField(model_name="technician", name="employee_id", field=models.CharField(blank=True, max_length=50, null=True, unique=True)),
        migrations.AlterField(model_name="technician", name="first_name", field=models.CharField(blank=True, default="", max_length=100)),
        migrations.AlterField(model_name="technician", name="last_name", field=models.CharField(blank=True, default="", max_length=100)),
    ]

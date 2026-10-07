from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("systemsettings", "0002_expert_technology_defaults")]
    operations = [
        migrations.AlterField(model_name="systemsetting", name="system_name", field=models.CharField(blank=True, default="Expert Technology Service Management", max_length=150)),
        migrations.AlterField(model_name="systemsetting", name="company_name", field=models.CharField(blank=True, default="Expert Technology", max_length=150)),
    ]

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("roles", "0001_initial")]
    operations = [migrations.AlterField(model_name="role", name="name", field=models.CharField(blank=True, max_length=100, null=True, unique=True))]

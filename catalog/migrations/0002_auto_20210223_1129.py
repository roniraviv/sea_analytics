# Generated by Django 2.1.7 on 2021-02-23 09:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='map',
            name='training_end_status',
            field=models.CharField(blank=True, default='32.1734219,34.785583,18.769', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='map',
            name='training_start_status',
            field=models.CharField(blank=True, default='32.1692714,34.7892866,17.211', max_length=100, null=True),
        ),
    ]

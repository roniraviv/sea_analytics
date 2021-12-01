# Generated by Django 2.1.7 on 2021-12-01 19:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0014_auto_20211128_2105'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='training_media_resolution',
            field=models.PositiveSmallIntegerField(blank=True, choices=[(0, 'low (LRV)'), (1, 'high (MP4)')], default=0, null=True, verbose_name='Training Media Resolution'),
        ),
    ]

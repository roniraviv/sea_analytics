# Generated by Django 2.1.7 on 2021-07-07 21:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0004_auto_20210624_0835'),
    ]

    operations = [
        migrations.AddField(
            model_name='media',
            name='favorite_files',
            field=models.TextField(blank=True, default='', null=True, verbose_name='Favorite media files'),
        ),
    ]

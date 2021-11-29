# Generated by Django 2.1.7 on 2021-11-08 17:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0007_training_training_appendices'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='training_email_notification_en',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_location',
            field=models.CharField(blank=True, default='Sea', max_length=250, verbose_name='Training Location'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_media_resolution',
            field=models.PositiveSmallIntegerField(blank=True, choices=[('0', 'low (LRV)'), ('1', 'high (MP4)')], default=0, null=True, verbose_name='Training Media Resolution'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainee_intpoints_len',
            field=models.IntegerField(blank=True, default=-1, null=True, verbose_name='Training Athlete IntPoints Length'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainee_intpoints_thr',
            field=models.CharField(blank=True, default='8;20', max_length=100, null=True, verbose_name='Training IntPoints Threshold'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainee_skip_start',
            field=models.PositiveSmallIntegerField(blank=True, default=0, null=True, verbose_name='Training Athlete Skip Start'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainee_smoothing_factor',
            field=models.PositiveSmallIntegerField(blank=True, default=20, null=True, verbose_name='Training Athlete Smoothing Factor'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainee_speed_dir_window',
            field=models.PositiveSmallIntegerField(blank=True, default=5, null=True, verbose_name='Training Athlete Speed Direction Window'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainee_time_hours_offset',
            field=models.PositiveSmallIntegerField(blank=True, default=2, null=True, verbose_name='Training Athlete Hours Offset'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainee_video_duration',
            field=models.PositiveSmallIntegerField(blank=True, default=30, null=True, verbose_name='Training Athlete Video Duration [sec]'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainer_time_sec_offset_audio',
            field=models.PositiveSmallIntegerField(blank=True, default=5, null=True, verbose_name='Training Coach Audio Offset [sec]'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_trainer_time_sec_offset_video',
            field=models.PositiveSmallIntegerField(blank=True, default=0, null=True, verbose_name='Training Coach Video Offset [sec]'),
        ),
        migrations.AddField(
            model_name='profile',
            name='training_type',
            field=models.CharField(blank=True, choices=[('1', 'Short Course'), ('2', 'Coastal/Inshore'), ('3', 'Offshore'), ('4', 'Oceanic'), ('5', 'Other')], default='1', max_length=250, null=True, verbose_name='Training Type'),
        ),
    ]
#!/usr/bin/env python

# Created by Danit Gino at June 2020
# All rights reserved

# Usage example:  utils/build_training.py --csv_map utils/build_training_demo.csv --video_duration_sec=30 --training_id=2468 --outdir=demo

# Assumptions:
# ------------
# 1. User provides a valid CSV map, through the --csv_map flag
#
#      type,path
#      trainer,<path to Trainer folder>
#      trainee_0,<path to Trainee #0 folder>
#      trainee_1,<path to Trainee #1 folder>
#      ...
#
#    User can select media resolution (mp4/lrv) with the --media_resolution flag (default='low', i.e. LRV format)
#
# 2. Trainer folder comprises multiple video files (mp4) and multiple audio files (ogg/m4a)
#
#    Files format:  ptt_<vessel_id>_yyyy-mm-dd_hh.mm.ss.ogg|m4a
#                   ptv_<vessel_id>_yyyy-mm-dd_hh.mm.ss.mp4
#
#    Note:  vessel_id == '0' ---> media is relevant for all trainees
#
# 3. Each Trainee folder comprises multiple sequential video files (mp4)
#
#    Files format (example):  GH0200005.mp4, GH0200006.mp4, ...
#
# 4. The outdir path is relative to MEDIA_ROOT, e.g. --outdir=demo will allocate the new training under media/demo
#    The default value of outdir is "training_<training_id>"
#
# Work-Flow:
# ----------
# 1. Read locations map (CSV)
# 2. Import Trainer data to local area (Videos+Audios, 'as-is')
# 3. For each Trainee:
#    3.1. For each video file:
#         3.1. Generate a corresponding matching GPX file
#         3.2. Extract "interesting-points" from the GPX file
#         3.3. Add additional "interesting-points" based on Trainer markings (take only relevant markings)
#         3.4. Trimming the "big" videos into small videos according to "interesting-point"
#         3.5. Import Trainees data to local area (Videos + merged GPX)
# 4. Create a merged GPX file (all Trainees)
# 5. Add training to Local and Remote server
# 6. Publish media data to S3

# ------------------------------------------------------------------------------------------------------------------

import os
import boto3
import argparse
import pandas as pd
from glob import glob1
import urllib.request, json
from decouple import config
from shutil import copyfile
from tabulate import tabulate
from collections import Counter
from time import time, gmtime, strftime
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
from django.utils.timezone import make_aware
from boto3.exceptions import S3UploadFailedError
from os import path, makedirs, listdir, system, remove
from subprocess import PIPE, Popen, getstatusoutput, check_output
try:
    from .gpx_analysis import gpx_analyzer
except ImportError:
    from gpx_analysis import gpx_analyzer

BASE_DIR = path.dirname(path.dirname(path.abspath(__file__)))
MEDIA_ROOT = path.join(BASE_DIR, 'media')

AWS_ACCESS_KEY_ID = config('DB_AWS_ACCESS_KEY_ID')              # from sea_analytics.settings
AWS_SECRET_ACCESS_KEY = config('DB_AWS_SECRET_ACCESS_KEY')      # from sea_analytics.settings
AWS_STORAGE_BUCKET_NAME = config('DB_AWS_STORAGE_BUCKET_NAME')  # from sea_analytics.settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sea_analytics.settings")

bash_cmd = 'bash_msys' if os.name == "nt" else 'bash'

trainee_map_colors = ("Black",
                      "DarkRed",
                      "DarkGreen",
                      "DarkBlue",
                      "DarkMagenta",
                      "DarkCyan",
                      "LightGray",
                      "DarkGray",
                      "Red",
                      "Green",
                      "Yellow",
                      "Blue",
                      "Magenta",
                      "Cyan",
                      "White")

logfile = "build_training.log"

# ------------------------------------------------------------------------------------------------------------

def generic_print(msg, msg_type):
    if __name__ == "__main__":
        if os.name == "nt":
            print('[' + msg_type + '] ' + msg)
        else:
            if msg_type == 'INFO':
                print('\033[92m [' + msg_type + '] ' + msg + '\033[0m')
            elif msg_type == 'DEBUG':
                print('\033[94m [' + msg_type + '] ' + msg + '\033[0m')
            elif msg_type == 'WARNING':
                print('\033[93m [' + msg_type + '] ' + msg + '\033[0m')
            elif msg_type == 'ERROR':
                print('\033[91m [' + msg_type + '] ' + msg + '\033[0m')
            else:
                print('[' + msg_type + '] ' + msg)
    else:
        with open(logfile, "a") as logger:
            logger.write('[' + msg_type + '] ' + msg + '\n')

def info(msg):
    generic_print(msg, 'INFO')

def debug(msg):
    generic_print(msg, 'DEBUG')

def warn(msg):
    generic_print(msg, 'WARNING')

def error(msg):
    generic_print(msg, 'ERROR')

# ------------------------------------------------------------------------------------------------------------

def read_csv_map(csv_map, training_id, debug_en=False):
    """ Loads CSV which maps users to their media roots """

    info('Reading users map (CSV)')

    try:
        map_df = pd.read_csv(csv_map).set_index('type')
        map_df['path'] = map_df['path'].replace({'TRAINING_AUTO':'training_%s' % training_id}, regex=True)
        map_df['path'] = map_df['path'].replace({'TRAINING_AUTO_SHORT': '%s' % training_id}, regex=True)
        map_dict = map_df.to_dict()['path']

        if debug_en:
            debug(tabulate(map_df, headers='keys', tablefmt='psql'))

    except:
        error('Could not load CSV map (%s)' % csv_map)
        return None

    return map_dict

# ------------------------------------------------------------------------------------------------------------

def get_video_duration(videofile):
    """ Get an input video file, and return its native duration (hh:mm:ss) """

    cmd = 'ffprobe -i %s 2>&1 | grep "Duration" | cut -d" " -f4 | cut -d"." -f1' % videofile
    res = getstatusoutput(cmd)
    success = (res[0] == 0)
    if not success or res[1] == '':
        error('Could not retrieve video duration for: %s' % videofile)
        return '00.00.00'
    return res[1].replace(':', '.')

# ------------------------------------------------------------------------------------------------------------

def import_trainer_data(path_src, path_dst, trainer_time_sec_offset_video, trainer_time_sec_offset_audio, debug_en=False):
    """ Expecting to find multiple video files (mp4) and multiple audio files (ogg/m4a) """

    info('Loading trainer data from: %s' % path_src)

    video_files = glob1(path_src, "*.mp4")
    video_files.sort()

    audio_files = glob1(path_src, "*.ogg")
    audio_files.extend(glob1(path_src, "*.m4a"))
    audio_files.sort()

    success = video_files or audio_files

    trainer_marks = {}

    def update_trainer_marks(filename):
        marks = path.splitext(filename)[0].split('_')
        trainee_sel = 'all' if int(marks[1]) == 0 else marks[1]
        absolute_time = marks[3]
        relative_time = "00:00:00"
        duration_time = marks[4].replace(".", ":")
        if filename.endswith('.m4a'):
            m = datetime.strptime(duration_time, '%H:%M:%S')
            duration_time_sec_pre = int(m.hour * 60 + m.minute * 60 + m.second)
            duration_time_sec_int = max(duration_time_sec_pre, 30)
            duration_time = make_aware(datetime(year=1900,
                                                month=1,
                                                day=1,
                                                hour=datetime.min.hour,
                                                minute=datetime.min.minute,
                                                second=duration_time_sec_int)).strftime("%H:%M:%S")
        if trainee_sel not in trainer_marks:
            trainer_marks[trainee_sel] = []
        trainer_marks[trainee_sel].append("%s_%s_%s" % (absolute_time, relative_time, duration_time))

    def get_new_filename(filename, offset):
        duration_time = get_video_duration(path.join(path_src, filename))
        prefix = '_'.join(filename.split('_')[:3])
        midname = '.'.join(filename.split('_')[3].split('.')[:-1])
        suffix = filename.split('_')[3].split('.')[-1]
        newmidname = (datetime.strptime(midname, '%H.%M.%S') + timedelta(seconds=int(offset))).strftime("%H.%M.%S")
        newfilename = "%s_%s_%s.%s" % (prefix, newmidname, duration_time, suffix)
        return newfilename

    if success:

        # Import Video data:
        for filename in video_files:
            newfilename = get_new_filename(filename, trainer_time_sec_offset_video)
            update_trainer_marks(newfilename)
            if debug_en:
                debug('Fetching: %s' % newfilename)
            else:
                copyfile(path.join(path_src, filename), path.join(path_dst, newfilename))

        # Import Audio data:
        for filename in audio_files:
            newfilename = get_new_filename(filename, trainer_time_sec_offset_audio)
            update_trainer_marks(newfilename)
            if debug_en:
                debug('Fetching: %s' % newfilename)
            else:
                copyfile(path.join(path_src, filename), path.join(path_dst, newfilename))

    else:
        warn("Could not load Trainer media files")

    return success, trainer_marks

# ------------------------------------------------------------------------------------------------------------

def merge_time_marks(marks, debug_en):
    """ Get a list of time marks (hh.mm.ss_hh:mm:ss_hh:mm:ss] and return a merged list """

    # 15.32.43_00:13:45_00.00.30

    #  A1------A1_duration-------|    -----> A = min(A1,A2)
    #      A2---A2_duration---|              A_duration = max(A1_duration, A2_duration + A2-A1)
    #      A2------A2_duration-------|

    merged_marks = []

    mark_start = lambda m: datetime.strptime(m.split('_')[0], '%H.%M.%S')
    mark_start_rel = lambda m: datetime.strptime(m.split('_')[1], '%H:%M:%S')
    mark_duration = lambda m: datetime.strptime(m.split('_')[2], '%H:%M:%S')
    mark_duration_sec = lambda m: (mark_duration(m).hour * 60 + mark_duration(m).minute) * 60 + mark_duration(m).second
    mark_end = lambda m: mark_start(m) + timedelta(seconds=mark_duration_sec(m))
    is_overlap = lambda m1, m2: not((mark_end(m1) < mark_start(m2)) or (mark_end(m2) < mark_start(m1)))

    visited_marks = []

    for mark in marks:

        if mark_start(mark).time() not in visited_marks:

            mark_overlaps_start = [mark_start(m) for m in marks if is_overlap(mark, m)]
            mark_overlaps_start_rel = [mark_start_rel(m) for m in marks if is_overlap(mark, m)]
            mark_overlaps_end = [mark_end(m) for m in marks if is_overlap(mark, m)]
            m_start = min(mark_overlaps_start)
            start_rel_list = [m for m in mark_overlaps_start_rel if ((m.hour*60+m.minute)*60+m.second) > 0]
            m_start_rel = min(start_rel_list) if start_rel_list else make_aware(datetime(year=1900, month=1, day=1, hour=0, minute=0, second=0))
            m_end = max(mark_overlaps_end)
            m_diff = datetime.min + (m_end - m_start)
            m_duration = make_aware(datetime(year=1900, month=1, day=1, hour=m_diff.hour, minute=m_diff.minute, second=m_diff.second))
            merged_marks.append('%s_%s_%s' % (m_start.strftime("%H.%M.%S"), m_start_rel.strftime("%H:%M:%S"), m_duration.strftime("%H:%M:%S")))
            visited_marks += [m.time() for m in mark_overlaps_start]

    if debug_en:
        debug('Marks BEFORE merge:')
        for mark in sorted(marks):
            debug('mark=%s' % mark)
        debug('Marks AFTER merge:')
        for mark in sorted(merged_marks):
            debug('mark=%s' % mark)

    return merged_marks

# ------------------------------------------------------------------------------------------------------------

def import_trainee_data(path_src, path_dst, media_resolution, video_duration_sec, trainer_marks, trainee_track_color,
                        gpx_smoothing_factor, gpx_skip_start, gpx_time_hours_offset, debug_en=False):
    """ Expecting to multiple video files (mp4/lrv) with corresponding gps files (gpx) """

    map_file = None

    info('Loading trainee data from: %s' % path_src)

    gpx_list = []

    if media_resolution == 'low':
        video_files = glob1(path_src, "*.lrv")
        video_files.extend(glob1(path_src, "*.LRV"))
    elif media_resolution == 'high':
        video_files = glob1(path_src, "*.mp4")
        video_files.extend(glob1(path_src, "*.MP4"))
    else:
        error('Unsupported media resolution selected: %s' % media_resolution)

    video_files = list(dict.fromkeys(video_files))
    video_files.sort()
    
    success = video_files

    if success:

        for idx, filename in enumerate(video_files):

            video_file = path.join(path_src,filename)
        
            duration_time = get_video_duration(video_file)
            if duration_time == '00.00.00':
                info('Skipping corrupted file: %s' % video_file)
                continue

            # Generate a GPX file: 
            info('GPX generation for: %s' % filename)
            
            cmd = ['python',
                   'utils/gopro2gpx/gopro2gpx.py',
                   video_file,
                   path.join(path_src, path.splitext(filename)[0])]
            
            if debug_en:
                debug('cmd = %s' % ' '.join(cmd))
            else:
                success = False
                err_msg = ''
                for k in range(3):
                    res = getstatusoutput(' '.join(cmd))
                    if res[0] == 0:
                        success = True
                        break
                    else:
                        err_msg = str(res[1:])
                if not success:
                    error("FAILED (%s)" % err_msg)

            map_file = path.join(path_src, path.splitext(filename)[0]) + '.gpx'

            if not path.exists(map_file):
                success = False
                if debug_en:
                    warn('Could not find a GPX match for: %s' % video_file)
                    continue
                else:
                    error('Could not find a GPX match for: %s' % video_file)
                    return success, map_file

            # Analyze "Important Points" from GPX:
            skip_start = gpx_skip_start if idx == 0 else 0
            res = gpx_analyzer(open(map_file, 'r'), int(gpx_smoothing_factor), int(gpx_time_hours_offset), skip_start)

            gpx_start_time = datetime.strptime(res["start_time"].strftime("%H:%M:%S"), '%H:%M:%S').replace(year=datetime.min.year) - timedelta(seconds=int(skip_start))
            gpx_finish_time = datetime.strptime(res["finish_time"].strftime("%H:%M:%S"), '%H:%M:%S').replace(year=datetime.min.year)

            duration_str = strftime("%H:%M:%S", gmtime(int(video_duration_sec)))
            marks_list = list(set(res["interesing_points_time"].split(',')))
            marks_date = list(Counter([x.split('_')[0] for x in marks_list]).keys())[0].strip()

            marks = []
            for x in marks_list:
                if x:
                    margin_str = strftime("%H:%M:%S", gmtime(int(int(video_duration_sec)/2)))
                    margin_time = datetime.strptime(margin_str, '%H:%M:%S')
                    mark_time = datetime.min + (datetime.strptime(x.split('_')[1], '%H:%M:%S') - margin_time)
                    mark_time_str = mark_time.strftime("%H:%M:%S")
                    x_diff = mark_time - gpx_start_time
                    if x_diff.days >= 0:
                        absolute_time = mark_time_str.replace(':', '.')
                        relative_time = (datetime.min + x_diff).strftime("%H:%M:%S")
                        marks.append('%s_%s_%s' % (absolute_time, relative_time, duration_str))

            # add markings based on Trainer marks
            if trainer_marks:
                for trainer_mark in trainer_marks:
                    trainer_mark_abs_time = datetime.strptime(trainer_mark.split('_')[0], '%H.%M.%S').replace(year=datetime.min.year)
                    if gpx_start_time < trainer_mark_abs_time < gpx_finish_time:
                        trainer_mark_list = trainer_mark.split('_')
                        trainer_mark_list_new = [trainer_mark_list[0],
                                                 (datetime.min + (trainer_mark_abs_time - gpx_start_time)).strftime("%H:%M:%S"),
                                                 trainer_mark_list[2]]
                        trainer_mark_new = '_'.join(trainer_mark_list_new)
                        marks.append(trainer_mark_new)
                        if debug_en:
                            debug('adding training mark: %s' % trainer_mark_new)
                    elif debug_en:
                        debug('skipping training mark: %s (not with [%s,%s] range' %
                              (trainer_mark_abs_time.strftime("%H:%M:%S"),
                               gpx_start_time.strftime("%H:%M:%S"),
                               gpx_finish_time.strftime("%H:%M:%S")))


            # Merge time marks (remove overlaps)
            marks_merged = merge_time_marks(marks, debug_en)

            if marks_merged:

                marks_str = ','.join(marks_merged)

                # Trim the "big" input video accordingly + Import:
                cmd = [bash_cmd,
                       'utils/video_trim.sh',
                       '--video_in=%s' % video_file.replace('\\','\\\\'),
                       '--marks=%s' % marks_str,
                       '--video_out_prefix="%s"' % path.join(path_dst, 'ptv_' + marks_date)]

                info('Video Trimming for: %s' % filename)
                if debug_en:
                    debug('cmd = %s' % ' '.join(cmd))
                else:
                    res = getstatusoutput(' '.join(cmd))
                    success = (res[0] == 0)
                    if not success:
                        error("FAILED (%s)" % res[1])

            else:
                warn('Did not find any interesting-point in %s (trimming skipped)' % filename)

            gpx_list.append(map_file)

        # Create a merged GPX (all videos) + Import:
        info('GPX Merge generation')
        map_file = path.join(path_dst, 'gpx_merged.gpx')
        cmd = [bash_cmd,
               'utils/gpx_merger.sh',
               '--gpx_in="%s"' % ','.join(gpx_list),
               '--gpx_out="%s"' % map_file,
               '--mode="same_track"',
               '--color=%s' % trainee_track_color]

        if debug_en:
            debug('cmd = %s' % ' '.join(cmd))
        else:
            res = getstatusoutput(' '.join(cmd))
            success = (res[0] == 0)
            if not success:
                error("FAILED (%s)" % res[1])

    else:
        warn("Could not load Trainee video files")

    return success, map_file

# ------------------------------------------------------------------------------------------------------------

def fetch_data(csv_map, training_id, media_resolution, video_duration_sec, outdir, only_publish,
               trainee_smoothing_factor, trainee_skip_start, trainee_time_hours_offset, trainer_time_sec_offset_video,
               trainer_time_sec_offset_audio, debug_en):
    """ Fetch the data into local disk, and structure it in a training format """

    # Read data locations map:
    map_dict = read_csv_map(csv_map, training_id, debug_en)
    
    if only_publish:
        for user, root in map_dict.items():
            if isinstance(root, str) and not path.isdir(root):
                continue
            map_dict[user] = path.join(outdir, user)
        return True, map_dict

    # Init:
    gpx_list = []
    makedirs(outdir, exist_ok=True)

    # Import Trainer data to local area (+structuring):
    user = 'trainer'
    trainer_marks = []
    trainer_marks_filtered = []
    root = map_dict[user]
    if isinstance(root, str) and path.isdir(root):

        makedirs(path.join(outdir, user), exist_ok=True)
        success, trainer_marks = import_trainer_data(root,
                                                     path.join(outdir, user),
                                                     trainer_time_sec_offset_video,
                                                     trainer_time_sec_offset_audio,
                                                     debug_en)
    else:
        warn('Could not find %s data on disk' % user)
        success = False

    # Import Trainees data to local area (+structuring):
    for user,root in map_dict.items():

        if isinstance(root, str) and not path.isdir(root):
            info('Skipping %s (not exist on disk)' % user)
            continue

        map_dict[user] = path.join(outdir, user)

        if user == 'trainer':
            continue

        elif user.startswith('trainee'):

            makedirs(path.join(outdir, user), exist_ok=True)

            vessel_id = user.split('_')[1]

            if trainer_marks:
                trainer_marks_filtered = []
                if 'all' in trainer_marks:
                    trainer_marks_filtered += trainer_marks['all']
                if vessel_id in trainer_marks:
                    trainer_marks_filtered += trainer_marks[vessel_id]

            success, map_file = import_trainee_data(root,
                                                    path.join(outdir, user),
                                                    media_resolution,
                                                    video_duration_sec,
                                                    trainer_marks_filtered,
                                                    trainee_map_colors[int(vessel_id)],
                                                    trainee_smoothing_factor,
                                                    trainee_skip_start,
                                                    trainee_time_hours_offset,
                                                    debug_en)
            gpx_list.append(map_file)

        if not success:
            error("couldn't fetch trainee data, aborting")
            return success, map_dict
    
    # Create a merged GPX (all trainees):
    if gpx_list:

        cmd = [bash_cmd,
               'utils/gpx_merger.sh',
               '--gpx_in="%s"' % ','.join(gpx_list),
               '--gpx_out="%s"' % path.join(outdir, 'gpx_merged.gpx'),
               '--mode="different_tracks"']

        if debug_en:
            debug('cmd = %s' % ' '.join(cmd))
        else:
            res = getstatusoutput(' '.join(cmd))
            success = (res[0] == 0)

    return success, map_dict

# ------------------------------------------------------------------------------------------------------------

def build_local_training_recipe(map_dict, training_id, cloud_url, outdir, trainee_smoothing_factor,
                                trainee_time_hours_offset, debug_en):
    """ Build a local add_training script """

    script_name = path.join("utils", "add_training_%s.py" % training_id)

    info('Generating a designated script (%s) for adding the new Training to database' % script_name)

    f = open(script_name, "w")

    f.write('# Created automatically by %s\n' % path.basename(__file__))
    f.write('# Usage:  python manage.py runscript utils.add_training_%s\n' % training_id)
    f.write('#\n')
    f.write('\n')
    f.write('import urllib.request, json\n')
    f.write('from catalog.models import Training\n')
    f.write('from django.contrib.auth.models import User, Group\n')
    f.write('from .db_init_aux import add_training, add_trainee, add_trainer, add_map\n')
    f.write('\n')
    f.write('def add_new_training():\n')
    f.write('\n')
    f.write('    # Fetch Training (cloud will succeed, local will fail):\n')
    f.write('    try:\n')
    f.write('       training_obj = Training.objects.get(training_id="%s")\n' % training_id)
    f.write('       trainer_user = training_obj.get_trainer()\n')
    f.write('\n')
    f.write('    except Training.DoesNotExist:\n')
    f.write('       with urllib.request.urlopen("%s/api/get_trainings/?training_id=%s") as url:\n' % (cloud_url, training_id))
    f.write('           data = json.loads(url.read().decode())[0]\n')
    f.write('           training_obj = add_training(training_id="%s",\n' % training_id)
    f.write('                                       training_type=data["training_type"],\n')
    f.write('                                       training_date=data["training_date"],\n')
    f.write('                                       training_location=data["training_location"],\n')
    f.write('                                       training_duration=data["training_duration"],\n')
    f.write('                                       training_vessels_num=data["training_vessels_num"],\n')
    f.write('                                       training_wind_direction=data["training_wind_direction"],\n')
    f.write('                                       training_wind_speed=data["training_wind_speed"],\n')
    f.write('                                       training_waves=data["training_waves"],\n')
    f.write('                                       training_current=data["training_current"],\n')
    f.write('                                       training_comments=data["training_comments"],\n')
    f.write('                                       lut_user_vessel_id=data["lut_user_vessel_id"])\n')
    f.write('\n')
    f.write('           # Import new Trainee users:\n')
    f.write('           for trainee_json in data["get_training_json"]:\n')
    f.write('               try:\n')
    f.write('                   User.objects.get(username=trainee_json["trainee_name"])\n')
    f.write('               except User.DoesNotExist:\n')
    f.write('                   user_url = "%s/api/get_users/?username=%%s" %% trainee_json["trainee_name"]\n' % cloud_url)
    f.write('                   with urllib.request.urlopen(user_url) as url:\n')
    f.write('                       trainee_data = json.loads(url.read().decode())[0]\n')
    f.write('                       trainee_user, created = User.objects.get_or_create(username=trainee_data["username"],\n')
    f.write('                                                                          email=trainee_data["email"])\n')
    f.write('                       if created:\n')
    f.write('                           for grp_url in trainee_data["groups"]:\n')
    f.write('                               with urllib.request.urlopen(grp_url) as url:\n')
    f.write('                                   grp = json.loads(url.read().decode())["name"]\n')
    f.write('                                   trainee_user.groups.add(Group.objects.get(name=grp))\n')
    f.write('                           for key in trainee_data["profile"].keys():\n')
    f.write('                               if key == "get_trainees_json" or key == "get_trainers_json":\n')
    f.write('                                   continue\n')
    f.write('                               else:\n')
    f.write('                                   trainee_user.profile.__setattr__(key, trainee_data["profile"][key])\n')
    f.write('                           trainee_user.set_password("123456")\n')
    f.write('                           trainee_user.save()\n')
    f.write('                           print("New Trainee user imported successully", trainee_user)\n')
    f.write('\n')
    f.write('           # Import new Trainer user:\n')
    f.write('           try:\n')
    f.write('               trainer_user = User.objects.get(username=data["get_trainer_json"])\n')
    f.write('           except User.DoesNotExist:\n')
    f.write('               user_url = "%s/api/get_users/?username=%%s" %% data["get_trainer_json"]\n' % cloud_url)
    f.write('               with urllib.request.urlopen(user_url) as url:\n')
    f.write('                   trainer_data = json.loads(url.read().decode())[0]\n')
    f.write('                   trainer_user, created = User.objects.get_or_create(username=trainer_data["username"],\n')
    f.write('                                                                      email=trainer_data["email"])\n')
    f.write('                   if created:\n')
    f.write('                       for grp_url in trainer_data["groups"]:\n')
    f.write('                           with urllib.request.urlopen(grp_url) as url:\n')
    f.write('                               grp = json.loads(url.read().decode())["name"]\n')
    f.write('                               trainer_user.groups.add(Group.objects.get(name=grp))\n')
    f.write('                       for key in trainer_data["profile"].keys():\n')
    f.write('                           if key == "get_trainers_json" or key == "get_trainees_json":\n')
    f.write('                               continue\n')
    f.write('                           else:\n')
    f.write('                               trainer_user.profile.__setattr__(key, trainer_data["profile"][key])\n')
    f.write('                       trainer_user.set_password("123456")\n')
    f.write('                       trainer_user.save()\n')
    f.write('                       print("New Trainer user imported successully", trainer_user)\n')
    f.write('\n')
    f.write('           # Bind Trainer with Trainees:\n')
    f.write('           for trainee in trainer_user.profile.get_trainees_json():\n')
    f.write('               try:\n')
    f.write('                   trainee_obj = User.objects.get(username=trainee)\n')
    f.write('               except User.DoesNotExist:\n')
    f.write('                   print("[ERROR] Could not locate trainee user %s, in %s team" % (trainee, data["get_trainer_json"]))\n')
    f.write('               trainer_user.profile.trainees.add(trainee_obj)\n')
    f.write('               trainer_user.save()\n')
    f.write('               trainee_obj.profile.trainers.add(trainer_user)\n')
    f.write('               trainee_obj.save()\n')
    f.write('               print("Bindind %s <--> %s" % (trainer_user.username, trainee))\n')
    f.write('\n')
    for user, _ in map_dict.items():
        root = path.join(outdir, user)
        if user == 'trainer':
            f.write('    # Add data from a new user (trainer):\n')
            f.write('    add_trainer(user_obj=trainer_user,\n')
            f.write('                training_obj=training_obj,\n')
            f.write('                video_folder=r"%s",\n' % root)
            f.write('                audio_folder=r"%s")\n' % root)
            f.write('\n')
        elif user.startswith('trainee') and path.isdir(root):
            f.write('    # Add data from a new user (trainee):\n')
            f.write('    add_trainee(user_obj=training_obj.get_trainee_user(%s),\n' % user.split('_')[1])
            f.write('                training_obj=training_obj,\n')
            f.write('                video_folder=r"%s",\n' % root)
            if debug_en:
                f.write('                gpx_filename=r"%s",\n' % path.join(root, 'dummy.gpx'))
            else:
                f.write('                gpx_filename=r"%s",\n' % path.join(root, glob1(root, "*.gpx")[0]))
            f.write('                smoothing_factor=%d,\n' % int(trainee_smoothing_factor))
            f.write('                time_hours_offset=%d)\n' % int(trainee_time_hours_offset))
            f.write('\n')
    if path.exists(path.join(outdir, 'gpx_merged.gpx')):
        f.write('    # Merged Map:\n')
        f.write('    add_map(user_obj=trainer_user,\n')
        f.write('            training_obj=training_obj,\n')
        f.write('            map_url=r"%s",\n' % path.join(outdir, 'gpx_merged.gpx'))
        f.write('            merged=True,\n')
        f.write('            smoothing_factor=%d,\n' % int(trainee_smoothing_factor))
        f.write('            time_hours_offset=%d)\n' % int(trainee_time_hours_offset))
        f.write('\n')
    f.write('    print("Done")\n')
    f.write('\n')
    f.write('def run():\n')
    f.write('    add_new_training()\n')
    f.write('\n')
    f.write('if __name__ == "__main__":\n')
    f.write('    run()\n')
    f.write('\n')

    f.close()

    return script_name

# ------------------------------------------------------------------------------------------------------------

def build_cloud_training_recipe(map_dict, training_id, outdir, trainee_smoothing_factor, trainee_time_hours_offset):
    """ Build a cloud add_training script """

    script_name = path.join("utils", "add_training_%s_cloud.py" % training_id)

    info('Generating a designated script (%s) for adding the new Training to database' % script_name)

    f = open(script_name, "w")

    f.write('# Created automatically by %s\n' % path.basename(__file__))
    f.write('# Usage:  heroku run python manage.py shell < utils/add_training_%s_cloud.py\n' % training_id)
    f.write('#\n')
    f.write('\n')
    f.write('from catalog.models import Training\n')
    f.write('from utils.db_init_aux import add_trainee, add_trainer, add_map\n')
    f.write('from sea_analytics.settings import AWS_S3_CUSTOM_REG_DOMAIN, AWS_CLOUDFRONT_DOMAIN\n')
    f.write('\n')
    f.write('training_obj = Training.objects.get(training_id="%s")\n' % training_id)
    f.write('trainer_user = training_obj.get_trainer()\n')
    f.write('\n')
    f.write('url_prefix = AWS_CLOUDFRONT_DOMAIN if AWS_CLOUDFRONT_DOMAIN else AWS_S3_CUSTOM_REG_DOMAIN\n')
    f.write('url_prefix += "/media"\n')
    f.write('\n')
    for user, _ in map_dict.items():
        root = path.join(outdir, user)
        if user == 'trainer':
            f.write('# Add data from a new user (trainer):\n')
            f.write('add_trainer(user_obj=trainer_user,\n')
            f.write('            training_obj=training_obj,\n')
            f.write('            video_folder=url_prefix + "/training_%s/%s",\n' % (training_id, user))
            f.write('            audio_folder=url_prefix + "/training_%s/%s")\n' % (training_id, user))
            f.write('\n')
        elif user.startswith('trainee') and path.isdir(root):
            f.write('# Add data from a new user (trainee):\n')
            f.write('add_trainee(user_obj=training_obj.get_trainee_user(%s),\n' % user.split('_')[1])
            f.write('            training_obj=training_obj,\n')
            f.write('            video_folder=url_prefix + "/training_%s/%s",\n' % (training_id, user))
            f.write('            gpx_filename=url_prefix + "/training_%s/%s/gpx_merged.gpx",\n' % (training_id, user))
            f.write('            smoothing_factor=%d,\n' % int(trainee_smoothing_factor))
            f.write('            time_hours_offset=%d)\n' % int(trainee_time_hours_offset))
            f.write('\n')
    if path.exists(path.join(outdir, 'gpx_merged.gpx')):
        f.write('# Merged Map:\n')
        f.write('add_map(user_obj=trainer_user,\n')
        f.write('        training_obj=training_obj,\n')
        f.write('        map_url=url_prefix + "/training_%s/gpx_merged.gpx",\n' % training_id)
        f.write('        merged=True,\n')
        f.write('        smoothing_factor=%d,\n' % int(trainee_smoothing_factor))
        f.write('        time_hours_offset=%d)\n' % int(trainee_time_hours_offset))
    f.write('\n')
    f.write('print("Done")\n')
    f.write('exit()\n')
    f.write('\n')

    f.close()

    return script_name

# ------------------------------------------------------------------------------------------------------------

def build_training_recipes(map_dict, training_id, cloud_url, outdir, trainee_smoothing_factor,
                           trainee_time_hours_offset, debug_en):
    """ Add a new training to the local database """

    script_local = build_local_training_recipe(map_dict,
                                               training_id,
                                               cloud_url,
                                               outdir,
                                               trainee_smoothing_factor,
                                               trainee_time_hours_offset,
                                               debug_en)

    script_cloud = build_cloud_training_recipe(map_dict,
                                               training_id,
                                               outdir,
                                               trainee_smoothing_factor,
                                               trainee_time_hours_offset)

    return script_local, script_cloud

# ------------------------------------------------------------------------------------------------------------

def launch_training_recipe(script, is_local, debug_en):
    """ Add a new training to the local database """

    success = True

    info('Launching the script %s, and adding the new training' % script)

    if is_local:

        module_name = path.splitext(script)[0].replace('/', '.').replace('\\', '.')
        cmd = 'python manage.py runscript %s' % module_name

    else:
        if os.name == "nt":
            cmd = 'cat %s | heroku run python manage.py shell' % script
        else:
            cmd = 'heroku run python manage.py shell < %s' % script

    if debug_en:
        debug('cmd = %s' % cmd)
    else:
        if is_local:
            res = getstatusoutput(cmd)
            success = success and (res[0] == 0)
            if not success:
                error("Failed running: %s" % cmd)
        else:
            system(cmd)
            os.remove(script)

    return success

# ------------------------------------------------------------------------------------------------------------

def publish_training_to_s3(map_dict, outdir, debug_en):
    """ Publish training media data to Amazon-S3 """

    success = True
    HTTP_OK = 200

    remove_prefix = lambda x, prefix: x[len(prefix):] if x.startswith(prefix) else x
    os_compat = lambda x: x.replace('\\','/') if os.name == "nt" else x
    
    #outdir_rel = re.sub(path.dirname(outdir), 'media', outdir)
    outdir_rel = os_compat(path.join('media', remove_prefix(outdir, path.dirname(path.dirname(outdir))))[1:])

    # Connect to Amazon-S3 client:
    s3_client = boto3.client('s3',
                             aws_access_key_id=AWS_ACCESS_KEY_ID,
                             aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

    # Make a new training directory:
    if debug_en:
        debug('Making a new dir "%s" on S3 (bucket=%s)' %(outdir_rel, AWS_STORAGE_BUCKET_NAME))
    else:
        res = s3_client.put_object(Bucket=AWS_STORAGE_BUCKET_NAME, Key='%s/' % outdir_rel)
        success = res['ResponseMetadata']['HTTPStatusCode'] == HTTP_OK
        if not success:
            error('Could not open a new directory "%s" on S3 bucket "%s"' % (outdir_rel, AWS_STORAGE_BUCKET_NAME))
            return success

    # Make a new sub-directories (per-user) and upload media data:
    for user, root in map_dict.items():

        if not path.isdir(root):
            continue

        root_rel = os_compat(path.join(outdir_rel, user))

        if debug_en:
            debug('Making a new dir on S3 (bucket=%s):  %s' % (AWS_STORAGE_BUCKET_NAME, root_rel))
        else:
            res = s3_client.put_object(Bucket=AWS_STORAGE_BUCKET_NAME, Key='%s/' % root_rel)
            success = res['ResponseMetadata']['HTTPStatusCode'] == HTTP_OK
            if not success:
                error('Could not open a new directory "%s" on S3 bucket "%s"' % (root_rel, AWS_STORAGE_BUCKET_NAME))
                return success

        for f in listdir(root):
            if path.splitext(f)[1] not in (".ogg", ".m4a", ".mp4", ".gpx"):
                if debug_en:
                    debug('Skipping: %s' % f)
                continue

            info('%s: Publishing %s ...' % (user, f))
            if debug_en:
                debug('%s --> %s' % (path.join(root, f), path.join(root_rel, f)))
            else:
                try:
                    filepath = os_compat(path.join(root_rel, f))
                    s3_client.upload_file(path.join(root, f), AWS_STORAGE_BUCKET_NAME, filepath)
                except (ClientError, S3UploadFailedError) as e:
                    error('Could not upload file "%s": %s' % e)
                    return success

    info('Publishing gpx_merged.gpx ...')
    if not debug_en:
        filepath = os_compat(path.join(outdir_rel, 'gpx_merged.gpx'))
        if path.exists(filepath):
            s3_client.upload_file(path.join(outdir, 'gpx_merged.gpx'), AWS_STORAGE_BUCKET_NAME, filepath)

    return success

# ------------------------------------------------------------------------------------------------------------

def run_local_server(debug_en):
    """ Launches the local server in background mode """

    info('READY! --> Launching Local Server, while continue publishing to cloud in background')
    cmd_list = ['python', 'manage.py', 'runserver']
    cmd = ' '.join(cmd_list) + ' &'
    if debug_en:
        debug('cmd = %s' % cmd)
    else:
        if os.name == "nt":
            Popen(cmd_list)
        else:
            system(cmd)

# ------------------------------------------------------------------------------------------------------------

def build_training(csv_map, training_id, media_resolution, cloud_url, video_duration_sec, outdir, dont_publish,
                   only_publish, trainee_smoothing_factor, trainee_skip_start, trainee_time_hours_offset,
                   trainer_time_sec_offset_video, trainer_time_sec_offset_audio, debug_en):
    """ Fetch the data into local disk, and structure it in a training format """

    start_time = time()

    # Fetch data from media devices:
    success, map_dict = fetch_data(csv_map,
                                   training_id,
                                   media_resolution,
                                   video_duration_sec,
                                   outdir,
                                   only_publish,
                                   trainee_smoothing_factor,
                                   trainee_skip_start,
                                   trainee_time_hours_offset,
                                   trainer_time_sec_offset_video,
                                   trainer_time_sec_offset_audio,
                                   debug_en)
    if not success:
        error('fetch_data failed')
        return success

    if only_publish:
        script_cloud = path.join("utils", "add_training_%s_cloud.py" % training_id)

    else:

        # Generate trainings recipes:
        script_local, script_cloud = build_training_recipes(map_dict,
                                                            training_id,
                                                            cloud_url,
                                                            outdir,
                                                            trainee_smoothing_factor,
                                                            trainee_time_hours_offset,
                                                            debug_en)

        # Add training to local server:
        success = launch_training_recipe(script_local,
                                         True,
                                         debug_en)
        if not success:
            error('add_training failed')
            return success

        elapsed_time = time() - start_time
        info(strftime("Elapsed Time: %H:%M:%S", gmtime(elapsed_time)))

        # Run Local Server (in background):
        run_local_server(debug_en)

    # Publish media data to Amazon S3:
    if not dont_publish:
        success = publish_training_to_s3(map_dict,
                                         outdir,
                                         debug_en)
        if not success:
            error('publish_training_to_s3 failed')
            return success

        # Add training to remote server:
        success = launch_training_recipe(script_cloud,
                                         False,
                                         debug_en)
        if not success:
            error('add_training failed')
            return success

        elapsed_time = time() - start_time
        info(strftime("Elapsed Time: %H:%M:%S", gmtime(elapsed_time)))

    return success

# ------------------------------------------------------------------------------------------------------------
def clear_logfile():
    """ clear log file, if exists """

    if path.exists(logfile):
        remove(logfile)

# ------------------------------------------------------------------------------------------------------------
def clean_exitsting_training(training_id, debug_en):
    """ Cleans an existing training, if exists """

    success = True
    HTTP_OK = 200
    HTTP_NO_CONTENT = 204

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    # Cloud: Delete training-related Media and Map objects (but keep Training skeleton)
    info('Cleaning training related Media/Maps from Cloud server')

    script_name = path.join("utils", "clean_training_%s_cloud.py" % training_id)
    f = open(script_name, "w")
    f.write('# Created automatically by %s\n' % path.basename(__file__))
    f.write('# Usage:  heroku run python manage.py shell < utils/add_training_%s_cloud.py\n' % training_id)
    f.write('\n')
    f.write('from catalog.models import Media, Map\n')
    f.write('Media.objects.filter(training__training_id="%s").delete()\n' % training_id)
    f.write('Map.objects.filter(training__training_id="%s").delete()\n' % training_id)
    f.write('print("Done")\n')
    f.write('exit()\n')
    f.write('\n')
    f.close()

    launch_training_recipe(script_name, False, debug_en)

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    # S3: Delete training folder from bucket
    info('Cleaning training related data from S3 bucket')

    s3_client = boto3.client('s3',
                             aws_access_key_id=AWS_ACCESS_KEY_ID,
                             aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

    response = s3_client.list_objects_v2(Bucket=AWS_STORAGE_BUCKET_NAME,
                                         Prefix='media/training_' + training_id)

    if 'Contents' in response:
        for object in response['Contents']:
            if debug_en:
                print('Deleting', object['Key'])
            else:
                res = s3_client.delete_object(Bucket=AWS_STORAGE_BUCKET_NAME, Key=object['Key'])
                success = res['ResponseMetadata']['HTTPStatusCode'] in (HTTP_OK, HTTP_NO_CONTENT)
                if not success:
                    error('Could not delete path %s in S3 bucket "%s"' % (object['Key'], AWS_STORAGE_BUCKET_NAME))
                    return success

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    # Local: Delete Training object
    info('Cleaning training from Local server')

    script_name = path.join("utils", "clean_training_%s.py" % training_id)
    f = open(script_name, "w")
    f.write('# Created automatically by %s\n' % path.basename(__file__))
    f.write('# Usage:  python manage.py runscript utils.add_training_%s\n' % training_id)
    f.write('\n')
    f.write('from catalog.models import Training\n')
    f.write('Training.objects.filter(training_id="%s").delete()\n' % training_id)
    f.write('print("Done")\n')
    f.write('exit()\n')
    f.write('\n')
    f.close()

    launch_training_recipe(script_name, True, debug_en)

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    info('Existing training (%s) was cleaned successfully!' % training_id)

    return success

# ------------------------------------------------------------------------------------------------------------

def build_pre_check(csv_map, training_id, media_resolution, cloud_url, debug_en):
    """ Build Training preliminary checks """

    # CSV map check:
    csv_trainees_num = 0
    map_dict = read_csv_map(csv_map, training_id, debug_en)
    if not map_dict:
        return False
    for user, root in map_dict.items():
        if isinstance(root, str) and not path.isdir(root):
            if debug_en:
                warn('Could not find %s data on disk' % user)
        else:
            user_files = listdir(root)
            if user == "trainer":
                files_num = len([x for x in user_files if x.endswith('.mp4') or x.endswith('.MP4') or x.endswith('.ogg')])
            else:
                if media_resolution == 'low':
                    files_num = len([x for x in user_files if x.endswith('.lrv') or x.endswith('.LRV')])
                elif media_resolution == 'high':
                    files_num = len([x for x in user_files if x.endswith('.mp4') or x.endswith('.MP4')])
                else:
                    error('Unsupported media resolution selected: %s' % media_resolution)
                csv_trainees_num += 1 
            
            if files_num > 0:
                if debug_en:
                    debug('Found %d legitimate files for User %s' % (files_num, user))
            else:
                error('Could not find any legitimate file in %s folder (%s)' % (user, root))
                return False
    info('CSV map check passed')

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    # Verify that training is registered correctly in cloud
    url_str = "%s/api/get_trainings/?training_id=%s" % (cloud_url, training_id)
    with urllib.request.urlopen(url_str) as url:
        data = json.loads(url.read().decode())
        if data:
            trainer = data[0]['get_trainer_json']
            if debug_en:
                debug('Trainer: %s' % trainer)
            lut_user_vessel_id = data[0]['lut_user_vessel_id']
            lut_user_vessel_id_list = lut_user_vessel_id.split(',')
            for pair in lut_user_vessel_id_list:
                user = pair.split(':')[0]
                vessel = pair.split(':')[1]
                if debug_en:
                    debug('%s ---> %s' % (user, vessel))
                if not vessel.isdigit():
                    error('Invalid Vessel_ID for %s' % user)
                    return False
            #if len(lut_user_vessel_id_list) != csv_trainees_num:
            #    error('Trainees number in CSV (%d) does not meet the Trainees number in Cloud (%d)' % (csv_trainees_num, len(lut_user_vessel_id_list)))
            #    return False
        else:
            error('Could not fetch training "%s" from cloud' % training_id)
            return False
    info('Training registration check passed (%s)' % training_id)

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    # Verify that local media folder has at least 10G free storage
    stats = Popen(["df", "-Pk", "./media"], stdout=PIPE).communicate()[0]
    free_storage_gb = int(stats.splitlines()[1].split()[3]) / 1024 / 1024
    if free_storage_gb < 10:
        error('Insufficient storage in local media folder (%.2fGB < 10GB)' % free_storage_gb)
        return False
    info('Local media storage quota check passed (%.2fGB > 10GB)' % free_storage_gb)

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    # Verify that the remote server is bound correctly:
    output = check_output(['heroku', 'apps:info'])
    heroku_app = output.decode("utf-8").split('\n')[0].split(' ')[1]
    env_app=''
    with open('.env', 'r') as f:
        for line in f.readlines():
            if 'GUI_CLOUD_URL' in line:
                env_app=line.split('/')[-1].split('.')[0]
    info('Heroku app: %s' % heroku_app)
    if heroku_app != env_app:
        warn('Heroku app does not match GUI_CLOUD_URL app, as states in .env file (%s)' % env_app)
        info('Switching to the the correct application')
        cmd = 'heroku git:remote -a %s' % env_app
        res = getstatusoutput(cmd)
        success = (res[0] == 0)
        if not success or res[1] == '':
            error('Could not connect with app: %s' % env_app)
            return False
    
    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
    
    info('Pre-Checks completed successfully!')

    return True

# ------------------------------------------------------------------------------------------------------------


if __name__ == "__main__":

    # User args:
    parser = argparse.ArgumentParser(description='Training Builder - Sea Analytics')
    parser.add_argument('--csv_map', dest='csv_map')
    parser.add_argument('--media_resolution', dest='media_resolution', default='low')
    parser.add_argument('--video_duration_sec', dest='video_duration_sec', default=30)
    parser.add_argument('--trainee_smoothing_factor', dest='trainee_smoothing_factor', default=10)
    parser.add_argument('--trainee_skip_start', dest='trainee_skip_start', default=180)
    parser.add_argument('--trainee_time_hours_offset', dest='trainee_time_hours_offset', default=3)
    parser.add_argument('--trainer_time_sec_offset_video', dest='trainer_time_sec_offset_video', default=18)
    parser.add_argument('--trainer_time_sec_offset_audio', dest='trainer_time_sec_offset_audio', default=3)
    parser.add_argument('--training_id', dest='training_id', default=-1)
    parser.add_argument('--cloud_url', dest='cloud_url', default="https://sea-analytics-v2.herokuapp.com")
    parser.add_argument('--outdir', dest='outdir')
    parser.add_argument('--dont_publish', dest='dont_publish', action='store_true')
    parser.add_argument('--only_publish', dest='only_publish', action='store_true')
    parser.add_argument('--skip_pre_check', dest='skip_pre_check', action='store_true')
    parser.add_argument('--pre_check_only', dest='pre_check_only', action='store_true')
    parser.add_argument('--overwrite', dest='overwrite_en', action='store_true')
    parser.add_argument('--debug', dest='debug_en', action='store_true')
    parser.set_defaults(debug_en=False)
    args = parser.parse_args()

    clear_logfile()

    pre_checks_pass = True
    if not args.skip_pre_check:
        pre_checks_pass = build_pre_check(args.csv_map,
                                          args.training_id,
                                          args.media_resolution,
                                          args.cloud_url,
                                          args.debug_en)
    overwrite_pass = True
    if args.overwrite_en and pre_checks_pass:
        overwrite_pass = clean_exitsting_training(args.training_id, args.debug_en)

    if not args.pre_check_only and pre_checks_pass and overwrite_pass:

        res = build_training(args.csv_map,
                             args.training_id,
                             args.media_resolution,
                             args.cloud_url,
                             args.video_duration_sec,
                             path.join(MEDIA_ROOT, args.outdir if args.outdir else "training_%s" % args.training_id),
                             args.dont_publish,
                             args.only_publish,
                             args.trainee_smoothing_factor,
                             args.trainee_skip_start,
                             args.trainee_time_hours_offset,
                             args.trainer_time_sec_offset_video,
                             args.trainer_time_sec_offset_audio,
                             args.debug_en)

        # Epilog
        if res:
            info("%s Completed Successfully!" % path.basename(__file__))
        else:
            error("%s Completed Abnormally!" % path.basename(__file__))


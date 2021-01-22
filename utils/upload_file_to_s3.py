#!/usr/bin/env python

# Created by Danit Gino at January 2021
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

import boto3
import argparse
from os import path
from botocore.exceptions import ClientError
from boto3.exceptions import S3UploadFailedError

def upload_file_to_s3(local_file, s3_folder, s3_file, aws_access_key_id, aws_secret_access_key, aws_bucket, debug_en):
    """ upload a given file to given location on Amazon-S3 """

    success = True
    HTTP_OK = 200

    # Connect to Amazon-S3 client:
    s3_client = boto3.client('s3',
                             aws_access_key_id=aws_access_key_id,
                             aws_secret_access_key=aws_secret_access_key)

    # Make a new directory on S3 (if not already exists):
    if s3_folder+'/' in [x['Key'] for x in s3_client.list_objects(Bucket=aws_bucket)['Contents']]:
        if debug_en:
            print('[DEBUG] % already exists in S3, no need to recreate it' % s3_folder)
    else:
        if debug_en:
            print('[DEBUG] Making a new dir "%s" on S3 (bucket=%s)' % (s3_folder, aws_bucket))
        else:
            res = s3_client.put_object(Bucket=aws_bucket, Key='%s/' % s3_folder)
            success = res['ResponseMetadata']['HTTPStatusCode'] == HTTP_OK
            if not success:
                print('[ERROR] Could not open a new directory "%s" on S3 bucket "%s"' % (s3_folder, aws_bucket))
                return success

    # Upload local_file to S3:
    print('[INFO] Publishing %s to %s/%s...' % (local_file, s3_folder, s3_file))
    if not debug_en:
        try:
            if path.exists(local_file):
                s3_client.upload_file(local_file, aws_bucket, path.join(s3_folder, s3_file))
        except (ClientError, S3UploadFailedError) as e:
            print('[ERROR] Could not upload file "%s": %s' % e)
            success = False

    return success

# ------------------------------------------------------------------------------------------------------------------

if __name__ == "__main__":

    # User args:
    parser = argparse.ArgumentParser(description='S3 File Uploader')
    parser.add_argument('--local_file', dest='local_file')
    parser.add_argument('--s3_folder', dest='s3_folder')
    parser.add_argument('--s3_file', dest='s3_file')
    parser.add_argument('--aws_access_key_id', dest='aws_access_key_id')
    parser.add_argument('--aws_secret_access_key', dest='aws_secret_access_key')
    parser.add_argument('--aws_bucket', dest='aws_bucket')
    parser.add_argument('--debug', dest='debug_en', action='store_true')
    parser.set_defaults(debug_en=False)
    args = parser.parse_args()

    success = upload_file_to_s3(args.local_file,
                                args.s3_folder,
                                args.s3_file,
                                args.aws_access_key_id,
                                args.aws_secret_access_key,
                                args.aws_bucket,
                                args.debug_en)

    print('Completed %s' % 'Successfully' if success else 'with Errors')

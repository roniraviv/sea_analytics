#!/usr/bin/env python

# Created by Shahar Gino at February 2021
# All rights reserved

# Supported commands:
# - is_valid_user
# - get_install_unique_id
# - check_installation_license
# - get_data
# - get_attribute
# - update_db
# - generate_license
# - register_user
# - generate_heroku_netrc
# - get_mac_whitelist
# - is_in_mac_whitelist

# ------------------------------------------------------------------------------------------------------------------

import pytz
import argparse
import pandas as pd
from os import path, rename
from datetime import datetime
from tabulate import tabulate
from sqlalchemy import create_engine
import sqlalchemy.types as sql_types
from cryptography.fernet import Fernet
from uuid import getnode, uuid4
from getpass import getuser

# ------------------------------------------------------------------------------------------------------------------
def connect_to_db(connit_type_pre, connit_user, connit_pass, connit_host, connit_port, connit_db, debug_en=False):

    connit_type = connit_type_pre
    if connit_type == "mysql":
        connit_type += "+pymysql"

    connit = connit_type + '://' + connit_user + ':'
    connit += connit_pass + '@'
    connit += connit_host + ':'
    connit += connit_port + '/'
    connit += connit_db
    if debug_en:
        print(connit)

    sql_engine = create_engine(connit, echo=False)

    try:
        sql_engine.connect()
        if debug_en:
            print("Connected Successfully")
    except Exception as e:
        print("[ERROR] could not connect to installations server!\n\n%s\n" % str(e))

    return sql_engine

# ------------------------------------------------------------------------------------------------------------------
def get_install_unique_id():

    with open('.env', 'r') as f:
        license_data = f.read()
    try:
        unique_id = [x for x in license_data.split('\n') if 'INSTALL_UNIQUE_ID' in x][0].split("'")[1]
    except:
        print('[ERROR] could not fetch INSTALL_UNIQUE_ID data from the license .env file')
        return None

    return unique_id

# ------------------------------------------------------------------------------------------------------------------
def get_installation_data(sql_engine, unique_id, debug_en=False):

    df = pd.DataFrame()

    if not unique_id:
        unique_id = get_install_unique_id()

    if unique_id:

        sql_query = "SELECT distinct * FROM installation__record where unique_id = '%s'" % unique_id

        df = pd.read_sql(sql_query, sql_engine)

        if df.empty:
            if debug_en:
                print('[ERROR] No record found for unique_id=%s' % unique_id)
            return None

        if debug_en:
            print(tabulate(df.head()))

    return df

# ------------------------------------------------------------------------------------------------------------------
def get_installation_attribute(sql_engine, unique_id, attribute, debug_en=False):

    if not unique_id:
        unique_id = get_install_unique_id()

    if unique_id:

        df = get_installation_data(sql_engine, unique_id, debug_en)
        if not df.empty:
            if attribute in df.columns:
                return df[attribute].values[0]
            else:
                if debug_en:
                    print('[ERROR] No such attribute: %s' % attribute)
                return None

    return None

# ------------------------------------------------------------------------------------------------------------------
def is_valid_user(sql_engine, unique_id, debug_en=False):

    is_valid = False

    if not unique_id:
        unique_id = get_install_unique_id()

    if unique_id:

        sql_query = "SELECT distinct * FROM installation__record where deleted = 0"

        df_all = pd.read_sql(sql_query, sql_engine)
        df = df_all[df_all['unique_id'] == unique_id]

        if df.empty:
            if debug_en:
                print('[ERROR] No record found for unique_id=%s' % unique_id)
            return False

        if debug_en:
            print(tabulate(df.head()))

        mac = ':'.join(("%012X" % getnode())[i:i+2] for i in range(0, 12, 2))
        installation_limit = df['installation_limit'].values[0]
        installation_counter = df['installation_counter'].values[0]
        installation_macs = df['installation_macs'].values[0].split(';')

        mac_cnt = list(df_all['installation_macs'].values).count(mac)
        mac_whitelist = get_mac_whitelist(sql_engine, debug_en)
        mac_in_unique_id = mac in installation_macs
        mac_cnt_ok = (mac_cnt == 1) or (mac in mac_whitelist)
        intallation_limit_ok = (installation_counter <= installation_limit)

        is_valid = mac_in_unique_id and mac_cnt_ok and intallation_limit_ok

        if debug_en:
            print('mac: %s' % mac)
            print('mac_cnt: %d' % mac_cnt)
            print('mac_whitelist: %s' % str(mac_whitelist))
            print('mac_in_unique_id: %d' % int(mac_in_unique_id))
            print('mac_cnt_ok: %d' % int(mac_cnt_ok))
            print('intallation_limit_ok: %d' % int(intallation_limit_ok))

    return is_valid

# ------------------------------------------------------------------------------------------------------------------
def check_installation_license(sql_engine, unique_id, debug_en=False):

    if not unique_id:
        unique_id = get_install_unique_id()

    if unique_id:
        return is_valid_user(sql_engine, unique_id, debug_en)

    return False

# ------------------------------------------------------------------------------------------------------------------
def update_db(sql_engine, unique_id, debug_en=False):

    df = pd.DataFrame()

    if not unique_id:
        unique_id = get_install_unique_id()

    if unique_id:

        sql_query = "SELECT distinct * FROM installation__record"
        df_all = pd.read_sql(sql_query, sql_engine)
        df = df_all[df_all['unique_id'] == unique_id]

        if df.empty:
            if debug_en:
                print('[ERROR] No record found for unique_id=%s' % unique_id)
            return pd.DataFrame()

        if debug_en:
            print(tabulate(df.head()))

        mac = ':'.join(("%012X" % getnode())[i:i+2] for i in range(0, 12, 2))
        installation_limit = df['installation_limit'].values[0]
        installation_counter = df['installation_counter'].values[0]
        installation_macs = df['installation_macs'].values[0].split(';')

        if mac not in installation_macs and (installation_counter < installation_limit):

            pd.options.mode.chained_assignment = None

            installation_macs_str = ';'.join(installation_macs) + ";" + mac
            if installation_macs_str[0] == ';':
                installation_macs_str = installation_macs_str[1:]
            df['installation_macs'] = installation_macs_str

            installation_dates = df['installation_dates'].values[0]
            installation_dates_str = installation_dates + ";" + datetime.now().strftime("%m%d%y_%H%M%S")
            if installation_dates_str[0] == ';':
                installation_dates_str = installation_dates_str[1:]
            df['installation_dates'] = installation_dates_str

            df['installation_counter'] += installation_counter + 1

            dtype_dict = {'installation_key': sql_types.LargeBinary,
                          'license_file': sql_types.LargeBinary}

            df_all[df_all['unique_id'] == unique_id] = df

            df_all.to_sql(name='installation__record',
                          con=sql_engine,
                          if_exists='replace',
                          dtype=dtype_dict,
                          index=False)

        elif debug_en:
            print('[ERROR] MAC already exists in database (%s), and/or Limit exceeded (%d < %d)' %
                  (mac, installation_counter, installation_limit))

    return df

# ------------------------------------------------------------------------------------------------------------------
def generate_license(sql_engine, unique_id, outfile, debug_en=False):

    if not unique_id:
        unique_id = get_install_unique_id()

    if not unique_id:
        return False

    sql_query = "SELECT distinct * FROM installation__record where unique_id = '%s'" % unique_id

    df = pd.read_sql(sql_query, sql_engine)

    if df.empty:
        if debug_en:
            print('[ERROR] No record found for unique_id=%s' % unique_id)
        return False

    if debug_en:
        print(tabulate(df.head()))

    mac = ':'.join(("%012X" % getnode())[i:i+2] for i in range(0, 12, 2))
    installation_limit = df['installation_limit'].values[0]
    installation_counter = df['installation_counter'].values[0]
    installation_macs = df['installation_macs'].values[0].split(';')

    if mac in installation_macs and (installation_counter <= installation_limit):

        installation_key = bytes(df['installation_key'].values[0])
        license_file_enc = bytes(df['license_file'].values[0])

        f = Fernet(installation_key)
        license_file_str = f.decrypt(license_file_enc).decode('latin-1')

        if path.exists(outfile):
            rename(outfile, outfile + '.old')

        with open(outfile, "w") as license_file:
            license_file.write(license_file_str)
            print('License file (%s) has been generated successfully' % outfile)

    else:
        if debug_en:
            print('[ERROR] Cannot generate license, invalid user detected')
        return False

    return True

# ------------------------------------------------------------------------------------------------------------------
def generate_heroku_netrc():

    if not path.exists('.env'):
        print('[ERROR] could not find a local license .env file')

    with open('.env', 'r') as f:
        license_data = f.readlines()

    try:
        heroku_login = [x for x in license_data if 'INIT_HEROKU_LOGIN' in x][0].split("=")[1].strip().replace("'", "")
        heroku_token = [x for x in license_data if 'INIT_HEROKU_TOKEN' in x][0].split("=")[1].strip().replace("'", "")

        with open(path.join(path.expanduser("~"), '.netrcc'), 'w') as f:
            f.write('machine api.heroku.com\n')
            f.write('  login %s\n' % heroku_login)
            f.write('  password %s\n' % heroku_token)
            f.write('machine git.heroku.com\n')
            f.write('  login %s\n' % heroku_login)
            f.write('  password %s\n' % heroku_token)
    except:
        print('[WARNING] could not generate .netrc file with Heroku credentials')
        return False

    return True

# ------------------------------------------------------------------------------------------------------------------
def register_user(sql_engine, debug_en=False):

    if not path.exists('.env'):
        print('[ERROR] could not find a local license .env file')

    with open('.env', 'r') as f:
        license_data = f.read()

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    sql_query = "SELECT distinct * FROM installation__record"
    df = pd.read_sql(sql_query, sql_engine)

    installation_record_id = 0 if df.empty else df['id'].max() + 1

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    timeout = 10
    installation_record_unique_id = None

    try:
        installation_record_unique_id = [x for x in license_data.split('\n') if 'INSTALL_UNIQUE_ID' in x][0].split("'")[1]

    except:
        while timeout > 0:
            installation_record_unique_id = str(uuid4())
            if installation_record_unique_id not in df['unique_id']:
                break
        if not installation_record_unique_id:
            print('[ERROR] could not generate a unique ID for the new user')
            return False

        with open('.env', 'a') as f:
            f.write("\n")
            f.write("INSTALL_UNIQUE_ID='%s'" % installation_record_unique_id)
            f.write("\n")

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    installation_record_client_name = getuser()

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    try:
        installation_record_cloud_url = "'%s'" % [x for x in license_data.split('\n') if 'GUI_CLOUD_URL' in x][0].split("'")[1]

    except:
        print('[ERROR] could not fetch CLOUD_URL data from the license .env file')
        return False

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    installation_record_key = Fernet.generate_key()
    f = Fernet(installation_record_key)
    installation_record_license_file = f.encrypt(license_data.encode('utf-8'))

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    created_updated = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(pytz.timezone('Israel'))

    # -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

    new_df = pd.DataFrame(index = [df.index.max()+1],
                          data={'id': installation_record_id,
                                'unique_id': installation_record_unique_id,
                                'client_name': installation_record_client_name,
                                'cloud_url': installation_record_cloud_url,
                                'admin_username': 'admin',
                                'admin_password': 'admin',
                                'installation_key': installation_record_key,
                                'installation_counter': 0,
                                'installation_limit': 1,
                                'license_file': installation_record_license_file,
                                'installation_dates': "",
                                'installation_macs': "",
                                'created': created_updated,
                                'updated': created_updated,
                                'deleted': 0})

    new_df.to_sql(name='installation__record',
                  con=sql_engine,
                  if_exists='append',
                  index=False)

    res = update_db(sql_engine,
                    installation_record_unique_id,
                    debug_en)
    if res.empty:
        print('[ERROR] Database update failed')
        return False

    if debug_en:
        print('Added record:')
        print(tabulate(new_df))

    return True

# ------------------------------------------------------------------------------------------------------------------
def get_mac_whitelist(sql_engine, debug_en=False):

    res = []

    sql_query = "SELECT distinct * FROM mac_whitelist__record"
    df = pd.read_sql(sql_query, sql_engine)

    if not df.empty:
        res = df['mac'].to_list()

    if debug_en:
        print('Added record:')
        print(tabulate(df))

    return res

# ------------------------------------------------------------------------------------------------------------------
def is_in_mac_whitelist(sql_engine, debug_en=False):

    mac = ':'.join(("%012X" % getnode())[i:i+2] for i in range(0, 12, 2))
    mac_whitelist = get_mac_whitelist(sql_engine, debug_en)
    res = mac in mac_whitelist

    if debug_en:
        print('MAC: %s' % mac)

    return res

# ==================================================================================================================


if __name__ == "__main__":

    # User args:
    parser = argparse.ArgumentParser(description='Installation Data Getter')
    parser.add_argument('--connit_type', default='postgres', dest='connit_type')
    parser.add_argument('--connit_user', default='aaahzugfmsfsrf', dest='connit_user')
    parser.add_argument('--connit_pass', default='06e6887a7eb80c95eb9019d33f0b67fabb5465394cd2a2966932b76bc12d8251', dest='connit_pass')
    parser.add_argument('--connit_host', default='ec2-52-72-190-41.compute-1.amazonaws.com', dest='connit_host')
    parser.add_argument('--connit_port', default='5432', dest='connit_port')
    parser.add_argument('--connit_db', default='dbf4vbs54sonec', dest='connit_db')
    parser.add_argument('--unique_id', dest='unique_id')
    parser.add_argument('--cmd', default='get_data', dest='cmd')
    parser.add_argument('--license_file', default='.env', dest='license_file')
    parser.add_argument('--attribute', default='client_name', dest='attribute')
    parser.add_argument('--debug', dest='debug_en', action='store_true')
    parser.set_defaults(debug_en=False)
    args = parser.parse_args()

    sql_engine = connect_to_db(args.connit_type,
                               args.connit_user,
                               args.connit_pass,
                               args.connit_host,
                               args.connit_port,
                               args.connit_db,
                               args.debug_en)

    if args.cmd == 'is_valid_user':

        res = is_valid_user(sql_engine,
                            args.unique_id,
                            args.debug_en)

    elif args.cmd == 'get_install_unique_id':

        res = get_install_unique_id()

    elif args.cmd == 'check_installation_license':

        res = check_installation_license(sql_engine,
                                         None,
                                         args.debug_en)

    elif args.cmd == 'get_data':

        res = get_installation_data(sql_engine,
                                    args.unique_id,
                                    args.debug_en)

    elif args.cmd == 'get_attribute':

        res = get_installation_attribute(sql_engine,
                                         args.unique_id,
                                         args.attribute,
                                         args.debug_en)

    elif args.cmd == 'update_db':

        res = update_db(sql_engine,
                        args.unique_id,
                        args.debug_en)

    elif args.cmd == 'generate_license':

        res = generate_license(sql_engine,
                               args.unique_id,
                               args.license_file,
                               args.debug_en)

    elif args.cmd == 'register_user':

        res = register_user(sql_engine,
                            args.debug_en)

    elif args.cmd == 'generate_heroku_netrc':

        res = generate_heroku_netrc()

    elif args.cmd == 'get_mac_whitelist':

        res = get_mac_whitelist(sql_engine, args.debug_en)

    elif args.cmd == 'is_in_mac_whitelist':

        res = is_in_mac_whitelist(sql_engine, args.debug_en)

    else:
        print('[ERROR] Invalid command: %s' % args.cmd)
        res = None

    if args.debug_en:
        print(res)

    if isinstance(res, pd.DataFrame) or isinstance(res, pd.Series):
        exit(int(res.empty))
    else:
        exit(int(not bool(res)))

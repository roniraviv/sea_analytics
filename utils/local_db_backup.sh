#!/bin/bash

# Created by Danit Gino at January 2021
# All rights reserved

Usage() {

  printf "\n"
  printf "Usage: $0 --mode=<backup|restore|gen|list> [-h|--help]\n"
  printf "\n"
  printf "Example: $0 --mode=backup"
  printf "\n"
  exit 0
}

mode=""
while getopts h-: option
do
 case "${option}"
 in
 h) Usage;;
 -) LONG_OPTARG="${OPTARG#*=}"
    case $OPTARG in
      mode=?* )  mode="$LONG_OPTARG";;
      help    )  Usage;;
      ''      )  break;; # "--" terminates argument processing
      *       )  echo "Illegal option --$OPTARG" >&2; exit 2;;
    esac ;;
 \? ) exit 2 ;;  # getopts already reported the illegal option
 esac
done

if which gpg > /dev/null; then

  if [[ "${mode}" == "backup" ]]; then
    if gpg --list-keys > /dev/null; then
      python manage.py dbbackup --encrypt
    else
      python manage.py dbbackup
    fi
    echo "Backup completed"

  elif [[ "${mode}" == "restore" ]]; then
    if gpg --list-keys > /dev/null; then
      python manage.py dbrestore --decrypt
    else
      python manage.py dbrestore
    fi
    echo "Restore completed"

  elif [[ "${mode}" == "gen" ]]; then
    gpg --gen-key

  elif [[ "${mode}" == "list" ]]; then
    gpg --list-keys
  fi

else
  echo "GPG is not installed!"
fi
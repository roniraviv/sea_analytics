#!/bin/bash

# Created by Danit Gino at November 2020
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

Usage() {

  printf "\n"
  printf "Usage: $0 --env_file=<.env> --only_show [--debug] [-h|--help]\n"
  printf "\n"
  printf "Examples: $0 --env_file=.env\n"
  printf "          $0 --env_file=.env --debug\n"
  printf "          $0 --only_show'\n"
  printf "\n\n"
  exit 0
}

Set() {
  
  cmd=$(echo "heroku config:set ${1}" | sed "s/'//g")
  if [ "${debug}" = true ]; then
      echo ${cmd}
  else
      ${cmd}
      errs+=$? 
  fi
}

# ------------------------------------------------------------------------------------------------------------------

errs=0
env_file=""
only_show=false
debug=false
while getopts h-: option
do
 case "${option}"
 in
 h) Usage;;
 -) LONG_OPTARG="${OPTARG#*=}"
    case $OPTARG in
      env_file=?*         )  env_file="$LONG_OPTARG";;
      only_show           )  only_show=true;;
      debug               )  debug=true;;
      help                )  Usage;;
      ''                  )  break;; # "--" terminates argument processing
      *                   )  echo "Illegal option --$OPTARG" >&2; exit 2;;
    esac ;;
 \? ) exit 2 ;;  # getopts already reported the illegal option
 esac
done

# ------------------------------------------------------------------------------------------------------------------

if [ "${only_show}" = true ]; then
    heroku config
    errs+=$?
    echo "errs=${errs}"

else

    if [ -z "${env_file}" ]; then
        echo "Please provide .env file"
        Usage
    fi

    for line in $(grep -v -e '^$' ${env_file} | grep -v "^#" | grep -v GUI_); do
        Set "${line}"
    done
fi

Set "STORAGE_TYPE=AWS"

echo -n "$0 Completed "
if [ "${errs}" -eq "0" ]; then
    echo "Successfully"
else
    echo "with ERRORs"
fi
exit "${errs}"

#!/bin/bash

# Created by Shahar Gino at September 2020
# All rights reserved

# OSX:    brew install ccrypt
# Linux:  sudo apt-get install ccrypt

#-----------------------------------------------------------------------
Usage() {
  printf "\n"
  printf "Usage: $0 --encrypt --key=<KEY>\n"
  printf "       $0 --decrypt --key=<KEY>\n"
  printf "       $0 --recrypt --key=<KEY>\n"
  printf "\n"
  exit 0
}  

#-----------------------------------------------------------------------
# User Arguments:
mode=""
key=""
while getopts h-: option
do
 case "${option}"
 in
 h) Usage;;
 -) LONG_OPTARG="${OPTARG#*=}"
    case $OPTARG in
      encrypt  )  mode="encrypt";;      
      decrypt  )  mode="decrypt";;
      recrypt  )  mode="recrypt";;      
      key=?*   )  key=("$LONG_OPTARG");;
      ''       )  break;; # "--" terminates argument processing
      *        )  echo "Illegal option --$OPTARG" >&2; exit 2;;
    esac ;;
 \? ) exit 2 ;;  # getopts already reported the illegal option
 esac
done

if [ -z "${key}" ]; then
    printf "[ERROR] Undefined Key"
    Usage
fi

if [ -z "${mode}" ]; then
    printf "[ERROR] Undefined Mode"
    Usage
fi

installation_db_cli_key=$(echo 'c2VhQW5hbHl0aWNzMTIzIQo=' | base64 --decode)

#-----------------------------------------------------------------------

code_paths=('catalog' 'sea_analytics' 'utils')

for code_path in ${code_paths[@]}; do
        
    if [ "${mode}" == "decrypt" ] || [ "${mode}" == "recrypt" ]; then
        for code_dir in $(find ${code_path} -name "*.py.cpt" | rev | cut -d"/" -f2- | rev | sort | uniq); do
            printf "Decrypting dir: ${code_dir}\n"
            cd ${code_dir}
            rm -f *.pyc
            ccrypt -d -K "${key}" -f *.py.cpt
            cd -
        done
        ccrypt -d -K "${installation_db_cli_key}" -f utils/installation_db_cli.py.cpt
    fi
    
    if [ "${mode}" == "encrypt" ] || [ "${mode}" == "recrypt" ]; then
        for code_dir in $(find ${code_path} -name "*.py" | rev | cut -d"/" -f2- | rev | sort | uniq | grep -v migrations); do
            printf "Encrypting dir: ${code_dir}\n"
            cd ${code_dir}
            python -m compileall -b .
            ccrypt -e -K "${key}" -f *.py
            cd -
            cd utils/gopro2gpx
            ln -s gopro2gpx.pyc gopro2gpx.py
            cd -
        done
        python -m compileall -b utils/installation_db_cli.py
        ccrypt -e -K "${installation_db_cli_key}" -f utils/installation_db_cli.py
    fi
done

echo "Done!"


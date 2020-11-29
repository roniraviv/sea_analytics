#!/bin/bash

# Created by Danit Gino at September 2020
# All rights reserved

# OSX:    brew install ccrypt
# Linux:  sudo apt-get install ccrypt

#-----------------------------------------------------------------------
Usage() {
  printf "\n"
  printf "Usage: $0 --encrypt --key=<KEY>\n"
  printf "       $0 --decrypt --key=<KEY>\n"
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

#-----------------------------------------------------------------------

code_paths=('catalog' 'sea_analytics' 'utils')

for code_path in ${code_paths[@]}; do
        
    if [ "${mode}" == "encrypt" ]; then
        for code_dir in $(find ${code_path} -name "*.py" | rev | cut -d"/" -f2- | rev | sort | uniq); do
            printf "Encrypting dir: ${code_dir}\n"
            cd ${code_dir}
            python -m compileall -b .
            ccrypt -e -K "${key}" -f *.py
            cd -
            cd utils/gopro2gpx
            ln -s gopro2gpx.pyc gopro2gpx.py
            cd -
        done
        
    elif [ "${mode}" == "decrypt" ]; then
        for code_dir in $(find ${code_path} -name "*.py.cpt" | rev | cut -d"/" -f2- | rev | sort | uniq); do
            printf "Decrypting dir: ${code_dir}\n"
            cd ${code_dir}
            rm -f *.pyc
            ccrypt -d -K "${key}" -f *.py.cpt
            cd -
        done
        
    else
        printf "[ERROR] Unsupported mode: ${mode}\n"
    fi
done

echo "Done!"


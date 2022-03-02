#!/bin/bash

# Created by Shahar Gino at June 2020
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

Usage() {

  printf "\n"
  printf "Usage: $0 --video_in=<input_video> --marks=<start1_relative1_duration1,start2_relative2_duration2,...> --video_out_prefix=<prefix> [--debug] [-h|--help]\n"
  printf "\n"
  printf "Example: $0 --video_in='./media/GH020005.mp4' --marks='14:05:21_00:01:24_00:00:30,14:06:27_00:02:30_00:00:20' --video_out_prefix='./media/ptv_2019-12-06' [-h|--help]\n"
  printf "\n"
  printf "\t That will create 2 trimmed video clips, corresponds to 14:05:21-14:05:51 and 14:06:27-14:06:47.\n"
  printf "\t The resulted videos will be named ptv_2019-12-06_14.05.21.mp4 and ptv_2019-12-06_14.06.27.mp4, respectively."
  printf "\n\n"
  exit 0
}

# ------------------------------------------------------------------------------------------------------------------

Trim() {

  video_in=${1}
  start_time=${2}
  duration=${3}
  video_out=${4}
  log=${5}
  debug=${6:-false}
	
	res=0

  video_in=$(echo "${video_in}")
  video_out=$(echo "${video_out}" | sed 's/\.MP4/.mp4/' | sed "s/\.mp4/_${duration}.mp4/" | sed 's/:/./g')

	if [[ "$OSTYPE" == "msys" ]]; then
		cmd="ffmpeg -ss ${start_time} -i tmp_in.mp4	-t ${duration} -vcodec copy -acodec copy -y tmp_out.mp4"
    else
		cmd="ffmpeg -ss ${start_time} -i ${video_in} -t ${duration} -vcodec copy -acodec copy -y ${video_out}"
	fi

	if [ "${debug}" = false ]; then
		echo "Trimming (source, start, duration): ${video_in}, ${start_time}, ${duration}"
		if [[ "$OSTYPE" == "msys" ]]; then
			ln -s "${video_in}" tmp_in.mp4
			eval "${cmd}" 2>> "${log}"
			if [ -n "tmp_out.mp4" ]; then
				mv tmp_out.mp4 "${video_out}"
				rm tmp_in.mp4
			else
				echo "ERROR trimming ${video_in}" >> ${log}
			fi
		else		   
			eval "${cmd}" 2>> "${log}"
			if [ "$?" -eq "0" ]; then
				printf " - Succeed\n"
			else
				printf " - Failed\n"
				res=1
			fi
		fi
    else
        printf "${cmd}\n"
  fi
	
	return "${res}"
}

# ------------------------------------------------------------------------------------------------------------------

video_in=""
marks_arr=""
video_out_prefix=""
debug=false
while getopts h-: option
do
  case "${option}"
  in
  h) Usage;;
  -) LONG_OPTARG="${OPTARG#*=}"
    case $OPTARG in
      video_in=?*         )  video_in="$LONG_OPTARG";;
      marks=?*            )  marks_arr=("$LONG_OPTARG");;
      video_out_prefix=?* )  video_out_prefix="$LONG_OPTARG";;
      debug               )  debug=true;;
      help                )  Usage;;
      ''                  )  break;; # "--" terminates argument processing
      *                   )  echo "Illegal option --$OPTARG" >&2; exit 2;;
    esac ;;
  \? ) exit 2 ;;  # getopts already reported the illegal option
  esac
done

marks_arr=(${marks_arr//,/ })

# ------------------------------------------------------------------------------------------------------------------

if [[ "$OSTYPE" == "msys" ]]; then
	log=$(echo ${video_out_prefix} | sed -E 's/(.*\\).*/\1video_trim.log/')
else
	log=$(echo ${video_out_prefix} | sed -E 's/(.*\/).*/\1video_trim.log/')
fi
touch ${log}
if [ "${debug}" = false ]; then
  echo "video_in: ${video_in}" >> "${log}"
fi

k="0"
errs="0"
for mark in "${marks_arr[@]}"; do

  start_duration=(${mark//_/ })
  video_out="${video_out_prefix}_${start_duration[0]}.mp4"

  Trim "${video_in}" "${start_duration[1]}" "${start_duration[2]}" "${video_out}" "${log}" "${debug}"
	echo "err=$?"
	if [[ "${$?}" == "1" ]]; then
	  errs=1
	fi
    
  let k+="1"
done

echo "$0 Completed!"
exit "${errs}"

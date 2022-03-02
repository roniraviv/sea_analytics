#!/bin/bash

# Created by Shahar Gino at March 2022
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

Usage() {

  printf "\n"
  printf "Usage: $0 --in=<input folder> --watermark=<watermark file path> --suffix=<video suffix, default='mp4'> [--debug] [-h|--help]\n"
  printf "\n"
  printf "Example: $0 --video_in='./media/GH020005.mp4' --marks='14:05:21_00:01:24_00:00:30,14:06:27_00:02:30_00:00:20' --video_out_prefix='./media/ptv_2019-12-06' [-h|--help]\n"
  printf "\n"
  printf "\t Adds a watermark to all video files in a given folder, in-place, at the top-left corner, 10% of the frame size\n\n"
  exit 0
}

# ------------------------------------------------------------------------------------------------------------------

Watermark() {

  video_in=${1}
  watermark=${2}
  debug=${3:-false}
	
	res=0

  video_in=$(echo "${video_in}")
  video_out="tmp_video.mp4"

  cmd="ffmpeg -i ${video_in} -i ${watermark} -filter_complex '[1][0]scale2ref=w=oh*mdar:h=ih*0.1[logo][video];[video][logo]overlay=15:10[outv]' -map [outv] -map 0:a -c:a copy -c:v libx264 -crf 22 -preset veryfast ${video_out}"

  if [ "${debug}" = false ]; then
    eval "${cmd}" 2>> "${log}"

    if [ "$?" -eq "0" ]; then
      printf "${video_in} - Succeed\n"
    else
      printf "${video_in} - Failed\n"
      res=1
    fi

    if [ -n "${video_out}" ]; then
      cp -f "${video_out}" "${video_in}"
      rm -f "${video_out}"
    else
      echo "ERROR watermarking ${video_in}" >> ${log}
    fi
  else
    printf "${cmd}\n"
  fi
	
	return "${res}"
}

# ------------------------------------------------------------------------------------------------------------------

in=""
suffix="mp4"
watermark=""
debug=false
while getopts h-: option
do
  case "${option}"
  in
  h) Usage;;
  -) LONG_OPTARG="${OPTARG#*=}"
    case $OPTARG in
      in=?*        )  in="$LONG_OPTARG";;
      suffix=?*    )  suffix="$LONG_OPTARG";;
      watermark=?* )  watermark="$LONG_OPTARG";;
      debug        )  debug=true;;
      help         )  Usage;;
      ''           )  break;; # "--" terminates argument processing
      *            )  echo "Illegal option --$OPTARG" >&2; exit 2;;
    esac ;;
  \? ) exit 2 ;;  # getopts already reported the illegal option
  esac
done

# ------------------------------------------------------------------------------------------------------------------

log='watermark.log'
touch ${log}
if [ "${debug}" = false ]; then
  echo "in: ${in}" >> "${log}"
fi

errs="0"
for video_file in $(find ${in} -name "*.${suffix}"); do
  Watermark "${video_file}" "${watermark}" "${debug}"
  echo "err=$?"
	if [[ "${$?}" == "1" ]]; then
	  errs=1
	fi
done

echo "$0 Completed!"
exit "${errs}"

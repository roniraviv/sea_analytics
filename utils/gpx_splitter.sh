#!/bin/bash

# Created by Shahar Gino at June 2022
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

Usage() {

  printf "\n"
  printf "Usage: $0 --gpx_in=<gpx> --gpx_out=<output path> --split_time=<split_time> --mode=<head|tail|both> [--debug] [-h|--help]\n"
  printf "\n"
  printf "Example: $0 --gpx_in='in/input.gpx' --gpx_out='out/output.gpx' --split_time=2022-03-05T09:35:18Z --mode=both\n"
  printf "\n"
  printf "That will end up with 2 new generated files: out/output.1.gpx and out/output.2.gpx\n"
  printf "\n\n"
  exit 0
}

# ------------------------------------------------------------------------------------------------------------------

gpx_in=""
gpx_out=""
mode="both"
split_time=""
debug=false
while getopts h-: option
do
 case "${option}"
 in
 h) Usage;;
 -) LONG_OPTARG="${OPTARG#*=}"
    case $OPTARG in
      gpx_in=?*     )  gpx_in="$LONG_OPTARG";;
      gpx_out=?*    )  gpx_out="$LONG_OPTARG";;
      split_time=?* )  split_time="$LONG_OPTARG";;
      mode=?*       )  mode="$LONG_OPTARG";;
      debug         )  debug=true;;
      help          )  Usage;;
      ''            )  break;; # "--" terminates argument processing
      *             )  echo "Illegal option --$OPTARG" >&2; exit 2;;
    esac ;;
 \? ) exit 2 ;;  # getopts already reported the illegal option
 esac
done

if [ "${mode}" != "both" ] && [ "${mode}" != "head" ] && [ "${mode}" != "tail" ]; then
  echo "Illegal mode option: ${mode}"
  exit 2
fi

# ------------------------------------------------------------------------------------------------------------------

# Main Course:
split_line=$(grep -n "${split_time}" ${gpx_in} | cut -d":" -f1)

if [ -n "${split_line}" ]; then

  # Find sibling trkpt sections:
  marker1=-1
  marker2=-1
  prev=-1
  for trkpt_line in $(grep -n "<trkpt" ${gpx_in} | cut -d":" -f1); do
    if [ "${trkpt_line}" -gt "${split_line}" ]; then
      marker1=$((prev-1))
      marker2=$((trkpt_line-1))
      break
    fi
    prev=${trkpt_line}
  done

  # Generate 1st split portion:
  if [ "${mode}" != "tail" ]; then
    if [ "${mode}" == "both" ]; then
      gpx_out1=$(echo ${gpx_out} | sed 's/\.gpx/.1.gpx/')
    else
      gpx_out1=${gpx_out}
    fi
    head -${marker1} ${gpx_in} > ${gpx_out1}
    echo "</trkseg>" >> ${gpx_out1}
    echo "    </trk>" >> ${gpx_out1}
    echo "</gpx>" >> ${gpx_out1}
  fi

  # Generate 2nd split portion:
  if [ "${mode}" != "head" ]; then
    if [ "${mode}" == "both" ]; then
      gpx_out2=$(echo ${gpx_out} | sed 's/\.gpx/.2.gpx/')
    else
      gpx_out2=${gpx_out}
    fi
    marker0=$(grep -n "<trkseg>" ${gpx_in} | head -1 | cut -d":" -f1)
    gpx_lines_num=$(wc -l < ${gpx_in})
    marker3=$((gpx_lines_num-marker2))
    head -${marker0} ${gpx_in} > ${gpx_out2}
    tail -${marker3} ${gpx_in} >> ${gpx_out2}
  fi

  echo "$0 Completed Successfully!"

else

  echo "Could not find split delimiter (${split_time}) in given GPX file"
fi

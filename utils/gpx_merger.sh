#!/bin/bash

# Created by Danit Gino at June 2020
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

Usage() {

  printf "\n"
  printf "Usage: $0 --gpx_in=<gpx1,gpx2,...> --gpx_out=<output path> [--mode=<different_tracks|same_track>] [--color=<color>] [--meta_desc=<offset_hours>] [--debug] [-h|--help]\n"
  printf "\n"
  printf "Example: $0 --gpx_in='media/samples/trainee_0/gh020006_1_gps5.gpx,media/samples/trainee_1/gh030006_1_gps5.gpx' --gpx_out='media/samples/gpx_merged.gpx'\n"
  printf "\n\n"
  exit 0
}

# ------------------------------------------------------------------------------------------------------------------

gpx_in_arr=""
gpx_out=""
mode="same_track"
color=""
meta_desc=""
debug=false
while getopts h-: option
do
 case "${option}"
 in
 h) Usage;;
 -) LONG_OPTARG="${OPTARG#*=}"
    case $OPTARG in
      gpx_in=?*    )  gpx_in_arr=("$LONG_OPTARG");;
      gpx_out=?*   )  gpx_out="$LONG_OPTARG";;
      mode=?*      )  mode="$LONG_OPTARG";;
      color=?*     )  color="$LONG_OPTARG";;
      meta_desc=?* )  meta_desc="$LONG_OPTARG";;
      debug        )  debug=true;;
      help         )  Usage;;
      ''           )  break;; # "--" terminates argument processing
      *            )  echo "Illegal option --$OPTARG" >&2; exit 2;;
    esac ;;
 \? ) exit 2 ;;  # getopts already reported the illegal option
 esac
done

gpx_in_arr=(${gpx_in_arr//,/ })

# ------------------------------------------------------------------------------------------------------------------

# Prolog:
grep "xml version" ${gpx_in_arr[0]} > "${gpx_out}"
grep "gpx xmlns" ${gpx_in_arr[0]} >> "${gpx_out}"
if [ -n "${meta_desc}" ]; then
  echo "<metadata>" >> "${gpx_out}"
  echo "  <desc>offset_hours=${meta_desc}</desc>" >> "${gpx_out}"
  echo "</metadata>" >> "${gpx_out}"
fi
if [ "${mode}" == "same_track" ]; then
    echo '    <trk>' >> "${gpx_out}"

    if [ -n "${color}" ]; then
        echo '        <name>gopro7-track</name>' >> "${gpx_out}"
        echo '        <extensions>' >> "${gpx_out}"
        echo '            <gpxx:TrackExtension>' >> "${gpx_out}"
        echo '                <gpxx:DisplayColor>'"${color}"'</gpxx:DisplayColor>' >> "${gpx_out}"
        echo '            </gpxx:TrackExtension>' >> "${gpx_out}"
        echo '        </extensions>' >> "${gpx_out}"
    fi
fi

# Main Body:
idx=0
for gpx_in in "${gpx_in_arr[@]}"; do

    marker1=$(grep -n "<trk>" ${gpx_in} | cut -d":" -f1)
    marker2=$(grep -n "</trk>" ${gpx_in} | cut -d":" -f1)

    if [ "${mode}" = "same_track" ]; then
        ((marker1+=2))
        ((marker2--))
    fi

    echo -n "Merging ${gpx_in} (${marker1}:${marker2}) into ${gpx_out} ... "
    
    if [ "${debug}" = false ]; then
        sed -n "${marker1},${marker2}p" ${gpx_in} >> "${gpx_out}"
    fi

    echo "Done"
    ((idx++))
done

# Epilog:
if [ "${mode}" = "same_track" ]; then
    echo '    </trk>' >> "${gpx_out}"
fi
echo '</gpx>'     >> "${gpx_out}"

echo "$0 Completed Successfully!"


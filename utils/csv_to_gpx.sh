#!/bin/bash

# Created by Danit Gino at July 2022
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

in_csv=${1}
out_gpx=${2}

if [ $# -ne 2 ]; then
    echo "[Usage] ${0} <csv input> <gpx output>"
    exit 1
fi

time_shaping () {
    echo "$(echo ${1} | cut -d'.' -f1 | sed 's/"//g' | sed 's/ /T/' | sed 's/+00:00//')Z"
}

csv_header=$(head -1 ${in_csv} | sed 's/.$/,/')

k=0
for csv_header_term in $(echo ${csv_header} | sed 's/,/ /g')
do
    if [ "${csv_header_term}" == "latitude" ]; then
        idx_lat=${k} 
    elif [ "${csv_header_term}" == "longitude" ]; then
        idx_lon=${k} 
    elif [ "${csv_header_term}" == "altitude" ]; then
        idx_ele=${k} 
    elif [ "${csv_header_term}" == "time" ]; then
        idx_time=${k} 
    elif [ "${csv_header_term}" = "speed" ] || [ "${csv_header_term}" = "sog" ]; then
        idx_ext_speed=${k} 
    elif [ "${csv_header_term}" = '"HDT - Heading True"' ] || [ "${csv_header_term}" = "mag_heading" ]; then
        idx_ext_direction=${k} 
    elif [ "${csv_header_term}" == '"SOG - Speed over Ground"' ]; then
        idx_ext_sog=${k} 
    elif [ "${csv_header_term}" = '"COG - Course over Ground"' ] || [ "${csv_header_term}" = "cog" ]; then
        idx_ext_cog=${k} 
    elif [ "${csv_header_term}" = "Heel" ] || [ "${csv_header_term}" = "heel" ]; then
        idx_ext_heel=${k} 
    elif [ "${csv_header_term}" = '"Trim Fore / Aft"' ] || [ "${csv_header_term}" = "pitch" ]; then
        idx_ext_pitch=${k} 
    elif [ "${csv_header_term}" == "q1" ]; then
        idx_ext_vtk_q1=${k} 
    elif [ "${csv_header_term}" == "q2" ]; then
        idx_ext_vtk_q2=${k} 
    elif [ "${csv_header_term}" == "q3" ]; then
        idx_ext_vtk_q3=${k} 
    elif [ "${csv_header_term}" == "q4" ]; then
        idx_ext_vtk_q4=${k} 
    elif [ "${csv_header_term}" == '"Time to Gun"' ]; then
        idx_ext_sm_timetogun=${k} 
    elif [ "${csv_header_term}" == '"GPS Satellites"' ]; then
        idx_ext_sm_gp5sats=${k} 
    elif [ "${csv_header_term}" == '"GPS HAcc"' ]; then
        idx_ext_sm_gp5hacc=${k} 
    elif [ "${csv_header_term}" == '"TWA - True Wind Angle""' ]; then
        idx_ext_sm_twa=${k} 
    elif [ "${csv_header_term}" == '"TWD - True Wind Direction"' ]; then
        idx_ext_sm_twd=${k} 
    fi
    ((k++))
done

echo '<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:wptx1="http://www.garmin.com/xmlschemas/WaypointExtension/v1" xmlns:gpxtrx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v2" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:trp="http://www.garmin.com/xmlschemas/TripExtensions/v1" xmlns:adv="http://www.garmin.com/xmlschemas/AdventuresExtensions/v1" xmlns:prs="http://www.garmin.com/xmlschemas/PressureExtension/v1" xmlns:tmd="http://www.garmin.com/xmlschemas/TripMetaDataExtensions/v1" xmlns:vptm="http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensions/v1" xmlns:ctx="http://www.garmin.com/xmlschemas/CreationTimeExtension/v1" xmlns:gpxacc="http://www.garmin.com/xmlschemas/AccelerationExtension/v1" xmlns:gpxpx="http://www.garmin.com/xmlschemas/PowerExtension/v1" xmlns:vidx1="http://www.garmin.com/xmlschemas/VideoExtension/v1" creator="Garmin Desktop App" version="1.1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www8.garmin.com/xmlschemas/WaypointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v2 http://www.garmin.com/xmlschemas/TrackPointExtensionv2.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/ActivityExtension/v1 http://www8.garmin.com/xmlschemas/ActivityExtensionv1.xsd http://www.garmin.com/xmlschemas/AdventuresExtensions/v1 http://www8.garmin.com/xmlschemas/AdventuresExtensionv1.xsd http://www.garmin.com/xmlschemas/PressureExtension/v1 http://www.garmin.com/xmlschemas/PressureExtensionv1.xsd http://www.garmin.com/xmlschemas/TripExtensions/v1 http://www.garmin.com/xmlschemas/TripExtensionsv1.xsd http://www.garmin.com/xmlschemas/TripMetaDataExtensions/v1 http://www.garmin.com/xmlschemas/TripMetaDataExtensionsv1.xsd http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensions/v1 http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensionsv1.xsd http://www.garmin.com/xmlschemas/CreationTimeExtension/v1 http://www.garmin.com/xmlschemas/CreationTimeExtensionsv1.xsd http://www.garmin.com/xmlschemas/AccelerationExtension/v1 http://www.garmin.com/xmlschemas/AccelerationExtensionv1.xsd http://www.garmin.com/xmlschemas/PowerExtension/v1 http://www.garmin.com/xmlschemas/PowerExtensionv1.xsd http://www.garmin.com/xmlschemas/VideoExtension/v1 http://www.garmin.com/xmlschemas/VideoExtensionv1.xsd">' > ${out_gpx}

csv_training_start=$(time_shaping "$(head -2 ${in_csv} | tail -1)")
echo "<metadata>" >> ${out_gpx}
echo "  <time>${csv_training_start}</time>" >> ${out_gpx}
echo "</metadata>" >> ${out_gpx}

echo "<trk>" >> ${out_gpx}
echo "  <name>gopro7-track</name>" >> ${out_gpx}
echo "<trkseg>" >> ${out_gpx}

first_line=true
prev_time=""
cat ${in_csv} | while read line 
do
    if [ "${first_line}" = true ] ; then
        first_line=false
        continue;
    fi
    
    IFS=',' read -r -a line_array <<< "${line}"
    
    curr_time=$(time_shaping "${line_array[${idx_time}]}")
    if [ "${curr_time}" == "${prev_time}" ]; then
        continue;
    fi
    
    echo "  <trkpt lat=\"${line_array[${idx_lat}]}\" lon=\"${line_array[${idx_lon}]}\">" >> ${out_gpx}
    if [ -n "${idx_ele}" ]; then 
    echo "      <ele>${line_array[${idx_ele}]}</ele>" >> ${out_gpx}
    fi
    echo "      <time>${curr_time}</time>" >> ${out_gpx}
    echo "      <extensions>" >> ${out_gpx}
    echo "      <gpxtpx:TrackPointExtension>" >> ${out_gpx}
    echo "          <gpxtpx:hr>0</gpxtpx:hr>" >> ${out_gpx}
    echo "          <gpxtpx:cad>0</gpxtpx:cad>" >> ${out_gpx}
    if [ -n "${idx_ext_speed}" ]; then 
        echo "          <gpxtpx:speed>${line_array[${idx_ext_speed}]}</gpxtpx:speed>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_direction}" ]; then 
        echo "          <gpxtpx:direction>${line_array[${idx_ext_direction}]}</gpxtpx:direction>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_sog}" ]; then 
        echo "          <gpxtpx:sogl>${line_array[${idx_ext_sog}]}</gpxtpx:sog>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_cog}" ]; then 
        echo "          <gpxtpx:cog>${line_array[${idx_ext_cog}]}</gpxtpx:cog>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_heel}" ]; then 
        echo "          <gpxtpx:heel>${line_array[${idx_ext_heel}]}</gpxtpx:heel>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_pitch}" ]; then 
        echo "          <gpxtpx:pitch>${line_array[${idx_ext_pitch}]}</gpxtpx:pitch>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_vtk_q1}" ]; then 
        echo "          <gpxtpx:q1>${line_array[${idx_ext_vtk_q1}]}</gpxtpx:q1>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_vtk_q2}" ]; then 
        echo "          <gpxtpx:q2>${line_array[${idx_ext_vtk_q2}]}</gpxtpx:q2>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_vtk_q3}" ]; then 
        echo "          <gpxtpx:q3>${line_array[${idx_ext_vtk_q3}]}</gpxtpx:q3>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_vtk_q4}" ]; then 
        echo "          <gpxtpx:q4>${line_array[${idx_ext_vtk_q4}]}</gpxtpx:q4>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_sm_timetogun}" ]; then 
        echo "          <gpxtpx:timetogun>"$(time_shaping "${line_array[${idx_ext_sm_timetogun}]}")"</gpxtpx:timetogun>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_sm_gp5sats}" ]; then 
        echo "          <gpxtpx:gp5sats>"$(time_shaping "${line_array[${idx_ext_sm_gp5sats}]}")"</gpxtpx:gp5sats>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_sm_gp5hacc}" ]; then 
        echo "          <gpxtpx:gp5hacc>"$(time_shaping "${line_array[${idx_ext_sm_gp5hacc}]}")"</gpxtpx:gp5hacc>" >> ${out_gpx}
    fi
    if [ -n "${idx_ext_sm_twa}" ]; then 
        echo "          <gpxtpx:twa>"$(time_shaping "${line_array[${idx_ext_sm_twa}]}")"</gpxtpx:twa>" >> ${out_gpx}
    fi
    echo "          <gpxtpx:fix>3</gpxtpx:fix>" >> ${out_gpx}
    echo "      </gpxtpx:TrackPointExtension>" >> ${out_gpx}
    echo "      <gpxx:TrackPointExtension/>" >> ${out_gpx}
    echo "      </extensions>" >> ${out_gpx}
    echo "  </trkpt>" >> ${out_gpx}
    
    prev_time=$(time_shaping "${line_array[${idx_time}]}")
done

echo "</trkseg>" >> ${out_gpx}
echo "</trk>" >> ${out_gpx}
echo "</gpx>" >> ${out_gpx}


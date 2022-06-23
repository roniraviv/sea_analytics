#!/bin/bash

# Created by Shahar Gino at June 2022
# All rights reserved

# ------------------------------------------------------------------------------------------------------------------

cond1=$(head -n 50 "$1" | grep "<gpx xmlns.*xmlns:gpxtpx=")
if [ -z "${cond1}" ]; then
    tmp="./tmp.gpx"
    touch ${tmp}
    cond2=$(head -n 1 "$1" | grep "xml version")
    if [ -n "${cond2}" ]; then
        head -1 "$1" >> ${tmp} 
    fi
    echo '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:vtk="https://www.velocitek.com/VelocitekGPX/v1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v2" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ns3="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" creator="Garmin Desktop App" version="1.1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/WaypointExtension/v1 http://www8.garmin.com/xmlschemas/WaypointExtensionv1.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v2 http://www.garmin.com/xmlschemas/TrackPointExtensionv2.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/ActivityExtension/v1 http://www8.garmin.com/xmlschemas/ActivityExtensionv1.xsd http://www.garmin.com/xmlschemas/AdventuresExtensions/v1 http://www8.garmin.com/xmlschemas/AdventuresExtensionv1.xsd http://www.garmin.com/xmlschemas/PressureExtension/v1 http://www.garmin.com/xmlschemas/PressureExtensionv1.xsd http://www.garmin.com/xmlschemas/TripExtensions/v1 http://www.garmin.com/xmlschemas/TripExtensionsv1.xsd http://www.garmin.com/xmlschemas/TripMetaDataExtensions/v1 http://www.garmin.com/xmlschemas/TripMetaDataExtensionsv1.xsd http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensions/v1 http://www.garmin.com/xmlschemas/ViaPointTransportationModeExtensionsv1.xsd http://www.garmin.com/xmlschemas/CreationTimeExtension/v1 http://www.garmin.com/xmlschemas/CreationTimeExtensionsv1.xsd http://www.garmin.com/xmlschemas/AccelerationExtension/v1 http://www.garmin.com/xmlschemas/AccelerationExtensionv1.xsd http://www.garmin.com/xmlschemas/PowerExtension/v1 http://www.garmin.com/xmlschemas/PowerExtensionv1.xsd http://www.garmin.com/xmlschemas/VideoExtension/v1 http://www.garmin.com/xmlschemas/VideoExtensionv1.xsd">' >> ${tmp}
    marker=$(head -n 50 "$1" | grep -n "<metadata>" | cut -d":" -f1)
    tail -n +${marker} "$1" >> ${tmp}
    mv ${tmp} $1
    cond3=$(head -n 50 "$1" | grep -e "<trkseg>")
    if [ -z "${cond3}" ]; then
        sed -i.tmp 's/<trk>/<trk><trkseg>/' $1
        rm -f $1.tmp
    fi

    # Vilocitek adjustment:
    sed -i.tmp 's/<extensions><vtk:sog>/<extensions><gpxtpx:TrackPointExtension><vtk:sog>/g' $1
    sed -i.tmp 's/<\/vtk:pitch><\/extensions>/<\/vtk:pitch><\/gpxtpx:TrackPointExtension><\/extensions>/g' $1
    sed -i.tmp 's/vtk:/gpxtpx:/g' $1
    sed -i.tmp 's/gpxtpx:sog>/gpxtpx:speed>/g' $1
    sed -i.tmp 's/gpxtpx:cog>/gpxtpx:direction>/g' $1
    sed -i.tmp 's/gpxtpx:sog>/gpxtpx:speed>/g' $1
    awk '!(/Z<\/time>/ && !/.000Z<\/time>/)' $1 > $1.tmp && mv $1.tmp $1
    rm -f $1.tmp
fi


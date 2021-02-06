/**
 * @file Contains the logic and all functions used for making of Custom Video Player
 * @author Jay Kapoor <jatinkapoor995@gmail.com>
 * @version 0.0.1
 * All rights reserved to Danit Gino, June 2020
 */

const showDebugData = true;                         // Show Debug Information for checking timing and overlapping
const showGpxOnHover = true;                        // Show GPX parameters on annotated bar hover
const showInfoWindow = false;                       // Show GPX parameters on annotated bar hover
const highlightGpxRoute = true;                     // Show GPX highlighting
const highlightGpxRouteOnPlay = true;               // Show GPX highlighting while video playing
let showRoutesMarkers = true                        // Show Routes Markers
const showRoutesMarkersOnClick = false              // Show router markers on click
const playAutoOnStart = true;                       // Play media on page loaded or start next
const playAutoOnEnded = false;                      // Play next media when previous has ended
const centerEventOnMap = true;                      // Center and Zoom Map on Start
const zoomEventOnMap = true;                        // Center and Zoom Map on Start
const timeLineHeight = 50;                          // TimeLine inner height
const pointerHeight = 25;                           // Pointer height wrapper
const pointerWidth = 24;                            // Pointer width
const pointerShift = pointerWidth / 2;              // Make pointer centered according to it width
const leftMargin = 70;                              // Left margin for control elements
const rightMargin = 70;                             // Right margin for control elements
const secondsInHour = 3600;                         // Seconds in Hour
const minZoomInValue = +min_zoom_level;             // Minimum seconds for Zoom In
const zoomStep = 1200;                              // Zoom In/Out step in seconds
const shiftStep = 1200;                             // Shift Step Left/Right in seconds
let secFrame = secondsInHour;                       // Current 'seconds' in the TimeLine according to Zoom level
const markerStyles = {                              // Default marker styles on the google map
    icon: {
        scale: parseFloat(gpx_marker_scale),
        fillColor: "#F00",
        fillOpacity: 0.4,
        strokeWeight: 0.4
    }
}
const globalProperties = {                           // Global Properties like colors, zoom, bg, e.t.c.
    hoverColor: "#808080",
    activeRouteColor: "#909090",
    metaBackground: "#EEEEEE",
    zoom: 16,
    marker: {
        normal: {
            fillColor: "#F00",
            fillOpacity: 0.4
        },
        selected: {
            fillColor: "3C3C3C",
            fillOpacity: 0.5
        },
    }
}
const routeLine = {                                   // Settings for highlighted route like length before start abd length after start time
    before: parseInt(gpx_route_before),
    after: parseInt(gpx_route_after)
}

const parametersUnits = {                             // Units of speed and direction (Heading another words)
    speed: "Kn",
    direction: " °"
}

// Get elements:
const myVideoPlayer = document.getElementById("video_player");
const mp4source = document.getElementById("mp4source");

// Get marker/slider variables:
overall_duration = get_seconds(overall_duration);
let secStart = get_seconds(marker_position);
let xScale = ($("#my_inner_bar").width()) / secFrame;
let secEnd = parseInt(secFrame) + parseInt(secStart);

// Elements settings
$("#my_bar").height(timeLineHeight);
$("#meta").css('background', globalProperties.metaBackground);
$("#speed_val").text("Speed: --");
$("#direction").text("Heading: --");
$("#arrow_left").append(arrowLeft);
$("#arrow_right").append(arrowRight);
$("#zoom_out").addClass("glyphicon glyphicon-zoom-out")
$("#zoom_in").addClass("glyphicon glyphicon-zoom-in")
// --------------------------------------------------------------------------------------------------------
let gpxData = null;                                 // GPX data from server
let srcMap = [];                                    // Sources Array with suitable format
let srcBoundsMarkers = [];                          // Array with mapped properties
let srcBounds = [];                                 // Array with empty spans between annotated bars
let activeVideo = 0;                                // Active Video/Audio
let activeStep = 0;                                 // Active Shift value
let sourceData = [];                                // Mapped sources data to more suitable array format // Mapped gpxData
let trainSection =
    trainee_sel !== '' && trainee_sel !== 'None' ?
        trainee_sel : 0;                            // Train section
let markers = {};                                   // Array of markers that was received from google map context
let gpxContext = {};                                // Current GPX class context (loadgpx.js)
let overlap = 0;                                    // Overlapping value of an events
let margin = 0;                                     // Margin value of an events
let fix = 0;                                        // Fix Pointer position if it's on the bounds
let polyline;                                       // Current Polyline object from google maps
let timeOffset = 3 * secondsInHour;                 // Current Time Offset for GPX
const trainingID = train_id;                        // Selected (current) train ID
if (trainSection === 0 || trainSection === 'None') {
    showRoutesMarkers = false
}                                                   // If train ID doesn't specified, 1 by default
let currentState = JSON.stringify({            // Current state of important values that saved on localStorage
    secFrame, secStart, secEnd, xScale, activeStep, activeVideo
});
const traineeColor =
    getColorByIndex(`(${trainSection})`);  // Current trainee color
let playingState = false;

// Async callback function that executes in the training_details.html to get data from gpxviever/loadgpx.js
async function setGpxData(ctx, func) {
    gpxContext = ctx;
    gpxData = await func.call(ctx);
    if (gpxContext.timeOffset) {
        timeOffset = gpxContext.timeOffset * secondsInHour;
    }
    playAutoOnStart && videoPlay(activeVideo);
    polyLineInit();
    addRouteMarker();
    hoverParametersDisplay();
}

function polyLineInit() {
    polyline = new google.maps.Polyline({
        path: [],
        strokeWeight: 5,
        map: gpxContext.map
    });
}

function addRouteMarker() {
    if (!showRoutesMarkers) return;
    srcMap.forEach(el => {
        const coordinates = getGpxData(el.time.time_start).position
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(coordinates?.lat, coordinates?.lon),
            map: gpxContext.map,
            data: el.uid,
            icon: {
                ...markerStyles.icon,
                path: google.maps.SymbolPath.CIRCLE
            }
        });

        const infoBlock = new google.maps.InfoWindow({
            content: `
            <div class="infoBlock">
                <div>Start Time: ${el.time.start}</div>
                <div>End Time: ${el.time.end}</div>
                <div>Time: ${el.time.time_start}</div>
            </div>`
        });
        google.maps.event.addListener(marker, "click", function () {
            zoomEventOnMap && gpxContext.map.setZoom(globalProperties.zoom);
            centerEventOnMap && gpxContext.map.setCenter(marker.getPosition());
            activeVideo = marker.data;
            videoPlay(activeVideo);
        });
        marker.addListener('mouseover', () => {
            showInfoWindow && infoBlock.open(map, marker)
            marker.setOptions({
                icon: {
                    ...marker.icon,
                    strokeWeight: 1.4
                },
            })
        })
        marker.addListener('mouseout', () => {
            showInfoWindow && infoBlock.close();
            marker.setOptions({
                icon: {
                    ...marker.icon,
                    strokeWeight: 0.4
                },
            })
        })
        markers[el.uid] = marker
    })
}

function updateRouteMarker(uid) {
    if (!showRoutesMarkers) {
        return;
    }
    for (let prop in markers) {
        if (markers.hasOwnProperty(prop) && prop !== uid)
            markers[prop].setOptions({
                icon: {
                    ...markers[prop].icon,
                    fillOpacity: globalProperties.marker.normal.fillOpacity,
                    fillColor: globalProperties.marker.normal.fillColor
                },
            })
    }
    const selectedMarker = markers[+uid]

    if (selectedMarker) {
        selectedMarker?.setOptions({
            icon: {
                ...markers[uid].icon,
                fillOpacity: globalProperties.marker.selected.fillOpacity,
                fillColor: globalProperties.marker.selected.fillColor
            },
        });

        if (zoomEventOnMap) {
            setTimeout(() => {
                gpxContext.map?.setZoom(globalProperties.zoom);
            }, 500)
        }
        if (centerEventOnMap) {
            setTimeout(() => {
                gpxContext.map?.setCenter(selectedMarker.getPosition());
            }, 500)
        }
    }


}

function highlightRoute(time, color = traineeColor) {
    if (!highlightGpxRoute) {
        return;
    }

    const convertedTime = get_seconds(gpxTimeConverter(time));
    const arr = []
    for (let i = -routeLine.before; i < routeLine.after; i++) {
        const push = gpxData[secondsToHms(convertedTime + i)]?.position
        push && arr.push(gpxData[secondsToHms(convertedTime + i)]?.position);
    }
    polyline.setOptions({
        zIndex: 999.9,
        path: arr.map(el => new google.maps.LatLng(el.lat, el.lon)),
        strokeColor: color,
        strokeWeight: 5,
        map: gpxContext.map
    });

}

let overTheBar = false;

// Checking if no localStorage data exist
if (!localStorage.getItem("currentState")) {
    localStorage.setItem("currentState", currentState);
} else {
    // populate updated values to localStorage
    const storage = getStorageState()
    secStart = storage?.secStart || 0;
    secEnd = storage?.secEnd || 3600;
    secFrame = storage?.secFrame || 3600;
    xScale = storage?.xScale;
    activeStep = storage?.activeStep || 0;
    activeVideo = storage?.activeVideo || 0;
}

// Write updated values to html elements like current left/right bounds in seconds
function updateBoundTimes(sStart = '', sEnd = '') {
    sStart !== '' && $("#my_prepend").text(secondsToHms(sStart));
    sEnd !== '' && $("#my_append").text(secondsToHms(sEnd));
}

updateBoundTimes(secStart, secEnd);

$("#slider_block").css("grid-template-columns", `${leftMargin}px auto ${rightMargin}px`);
activeVideo === 0 && $(".arrow.left").css("opacity", 0.5).attr("disabled", true);

function xScaleRefresh() {
    xScale = ($("#my_inner_bar").width()) / secFrame;
    updateStorage({xScale})
}

const timeStringToPixels = (t) => get_seconds(t) * xScale;
const secondsToPixels = (t) => t * xScale;

// Mapping source object to suitable array format with all needed properties
srcMap = Object.values(sources).map((t, i) => {
    const srcArray = t.name.substring(1).split("/");
    const file = srcArray[srcArray.length - 1];
    const extension = file.split(/[#?]/)[0].split(".").pop().trim();
    const fileName = file.substring(0, file.lastIndexOf("."));
    const fileNameArray = fileName.split("_");
    const fileStringSeparated = {
        filename: fileName,
        extension: extension,
        folder_main: srcArray[0],
        train_id: srcArray[1],
        person_type: srcArray[2],
        date: fileNameArray[fileNameArray.length - 3],
        start: fileNameArray[fileNameArray.length - 2],
        duration: fileNameArray[fileNameArray.length - 1]
    }
    const time_start = fileStringSeparated.start.replace(/\./g, ":");
    const duration = fileStringSeparated.duration.replace(/\./g, ":");

    return {
        uid: i,
        src: t.name,
        file: {
            extension: fileStringSeparated.extension,
            fileName: fileStringSeparated.filename,
        },
        time: {
            start: t.start,
            end: t.end,
            time_start,
            duration
        },
        seconds: {
            start: get_seconds(t.start),
            end: get_seconds(t.end),
            time_start: get_seconds(time_start),
            duration: get_seconds(duration),
        },
        colors: t.tooltip.match(/(\(\d+\))+/g).map(getColorByIndex),
        tooltip: t.tooltip,
        additional: t.additional || null,
    }
});

// --------------------------------------------------------------------------------------------------------
function updated_annotated_myBar(uid = 0, fix = 0) {
    $("#my_bar").empty();
    $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
    xScaleRefresh();
    srcBounds = [];

    let srcData = srcMap.filter(el => el.seconds.end >= secStart && el.seconds.start <= secEnd);
    srcData.forEach((el, i) => {
        const start = secondsToPixels(el.seconds.start) + activeStep * xScale;
        const end = secondsToPixels(el.seconds.end) + activeStep * xScale;
        const prev = srcData[i - 1 >= 0 ? i - 1 : 0];
        const next = srcData[srcData.length - i - 1 > 0 ? i + 1 : srcData.length - 1];
        const prevStart = secondsToPixels(prev.seconds.start) + activeStep * xScale;
        const prevEnd = secondsToPixels(prev.seconds.end) + activeStep * xScale;
        let width = end - start;
        const additional = el.additional || null;
        const colors = el.colors
        const time = {
            time_start: el.time.time_start,
            start: el.time.start,
            end: el.time.end,
            duration: el.time.duration,
            prev: {
                time_start: prev.time.time_start,
                start: prev.time.start,
                end: prev.time.end,
                duration: prev.time.duration,
            },
            next: {
                time_start: next.time.time_start,
                start: next.time.start,
                end: next.time.end,
                duration: next.time.duration,
            }
        };
        let caseVal = '--';
        const defaultObj = {
            uid: el.uid,
            src: el.src,
            start,
            prevStart,
            end,
            prevEnd,
            width,
            overlap,
            time,
            colors,
            additional,
            tooltip: el.tooltip,
            cond: caseVal
        };

        (get_seconds(time.start) < secStart && get_seconds(time.end) > secStart) && (caseVal = '5_1');
        (get_seconds(time.start) < secEnd && get_seconds(time.end) > secEnd) && (caseVal = '5_2');
        const isBound = caseVal === '5_1' || caseVal === '5_2';

        if (!isBound) {
            start < prevStart && end < prevEnd && (caseVal = '1_1');
            start < prevStart && end > prevEnd && (caseVal = '1_2');
            start < prevStart && end === prevEnd && (caseVal = '1_3');

            start === prevStart && end < prevEnd && (caseVal = '2_1');
            start === prevStart && end > prevEnd && (caseVal = '2_2');
            start === prevStart && end === prevEnd && (caseVal = '2_3');

            start > prevStart && end < prevEnd && (caseVal = '3_1');
            start > prevStart && end > prevEnd && (caseVal = '3_2');
            start > prevStart && end === prevEnd && (caseVal = '3_3');

            start >= prevEnd && end === prevEnd && (caseVal = '4_1');
            start === prevEnd && end > prevEnd && (caseVal = '4_2');

            start > prevEnd && (caseVal = '6');


        }

        switch (caseVal) {
            case '1_1':
                margin = prevEnd - start;
                overlap = prevEnd - end;
                break;
            case '1_2':
                margin = width;
                break;
            case '1_3':
                margin = width;
                break;
            case '2_1':
                margin = prevEnd - prevStart;
                break;
            case '2_2':
                margin = prevEnd - start;
                break;
            case '2_3':
                margin = 0;
                +el.uid === 0 && srcBounds.push({...defaultObj, type: 0, width: start})
                break;
            case '3_1':
                margin = prevEnd - start;
                break;
            case '3_2':
                margin = prevEnd - start;
                break;
            case '3_3':
                margin = width;
                break;
            case '4_1':
                overlap = 0;
                margin = 0;
                break;
            case '4_2':
                overlap = 0;
                margin = 0;
                break;
            case '5_1':
                margin = 0;
                width = secondsToPixels(get_seconds(time.end) - secStart);
                break;
            case '5_2':
                margin = 0;
                srcBounds.push({...defaultObj, type: 0, width: start - prevEnd});
                width = secondsToPixels(secEnd - get_seconds(time.start));
                break;
            case '6':
                width = end - start;
                srcBounds.push({...defaultObj, type: 0, width: start - prevEnd - overlap});
                overlap = 0;
                margin = 0;
                break;
            default:
                break;
        }
        const obj = {
            ...defaultObj,
            type: 1,
            colors,
            width,
            overlap,
            margin,
            cond: caseVal,
            id: i
        };
        srcBounds.push(obj);
    });

    srcBounds.forEach((el, i) => {
        let style = `width:${el.width}px`;
        if (el?.type !== 0) {
            if (i > 0 && srcBounds[i].cond === '5_1') {
                el.margin = srcBounds[i - 1].width
            }
            const typeBgBar = `repeating-linear-gradient(45deg, ${el.colors[1]
            || "Black"}, ${el.colors[1]
            || "Black"} 10px, ${el.colors[0]} 10px, ${el.colors[0]} 20px)`;
            style = `${style}; margin-left: ${-el.margin}px; background: ${el.colors.length > 1 ? typeBgBar : el.colors[0]}`;
            $("#my_bar").append(
                `<span data-id="${el?.uid}" class="type_${el.type}" style="${style}" onclick="videoPlay(${el?.uid})"></span><span class="separator"></span>`
            );
            $(`span[data-id="${el?.uid}"]`).append('<span>');
        } else {
            style = `${style}`;
            $("#my_bar").append(`<span data-empty-id="${el?.uid}" class="type_${el.type}" style="${style}"></span>`);
        }
    });

    srcBoundsMarkers = srcBounds?.filter((it) => it.type === 1);
    showPointer(activeVideo, fix);
    updateStorage({activeVideo});
    debugTiming();
    showTimer(srcMap[activeVideo]?.time?.start)
}

function debugTiming() {
    if (!showDebugData) {
        return;
    }
    $("#debug").empty().append(`
        <div>Width: ${$("#my_inner_bar").width()}px | Seconds In Time Frame: ${secFrame} | ZoomLevel: ${secFrame / zoomStep}</div>
        <div class="deb_header">
            <div>uid</div>
            <div>p_start</div>
            <div>p_end</div>
            <div>start</div>
            <div>end</div>
            <div>width</div>
            <div>span_w</div>
            <div>overlap</div>      
            <div>case</div>      
        </div>`)

    srcBounds.forEach(el => {
        $("#debug").append(`
            <div class='deb_values' onclick="videoPlay(${el.uid})" style="font-weight: ${el.uid === activeVideo ? 'bold' : 'normal'}">
                <div>${el.uid}</br></div>
                <div>
                    <div>${el.type !== 0 ? el.prevStart.toFixed(3) : '---'}</div>
                    <div>${el.type !== 0 ? el.time.prev.start : '---'}</div>
                </div>
                <div>
                    <div>${el.type !== 0 ? el.prevEnd.toFixed(3) : '---'}</div>
                    <div>${el.type !== 0 ? el.time.prev.end : '---'}</div>
                 </div>
                <div>
                    <div>${el.type !== 0 ? el.start.toFixed(3) : '---'}</div>
                    <div>${el.type !== 0 ? el.time.start : '---'}</div>
                </div>
                <div>
                    <div>${el.type !== 0 ? el.end.toFixed(3) : '---'}</div>
                    <div>${el.type !== 0 ? el.time.end : '---'}</div>
                </div>
                <div>
                    <div>${el.type !== 0 ? el.width.toFixed(3) : '---'}</div>
                    <div>${el.type !== 0 ? Math.round(pixelToSecondDiff(el.width)) + ' sec' : '---'}</div>
                </div>
                <div>${el.type === 0 ? el.width.toFixed(3) : '---'}</div>
                <div>${el.overlap.toFixed(3)}</div>
                <div>${el.cond}</div>
            </div>
            `);
        $('.deb_values').hover(
            function () {
                $(this).css('cursor', 'pointer').css('background', '#DDD')
            },
            function () {
                $(this).css('background', 'transparent')
            }
        )
    });
    $("#debug").append(`
    <p></p>
    <hr>
    <div>case 1_1: start < prevStart && end < prevEnd</div>
    <div>case 1_3: start < prevStart && end === prevEnd</div>
    <div>case 2_1: start === prevStart && end < prevEnd</div>
    <div>case 2_2: start === prevStart && end > prevEnd</div>
    <div>case 2_3: start === prevStart && end === prevEnd</div>
    <div>case 3_1: start > prevStart && end < prevEnd</div>
    <div>case 3_2: start > prevStart && end > prevEnd</div>
    <div>case 3_3: start > prevStart && end === prevEnd</div>
    <div>case 4_1: start >= prevEnd && end === prevEnd</div>
    <div>case 4_2: start === prevEnd && end > prevEnd</div>
    <div>case 5_1: (get_seconds(time.start) < secStart && get_seconds(time.end) > secStart)</div>
    <div>case 5_2: (get_seconds(time.start) < secEnd && get_seconds(time.end) > secEnd)</div>
    <div>case 6: start > prevEnd</div>
    `)
}

function checkIsOverBound(uid) {
    const isLeftOver = uid === 0;
    const isRightOver = uid === srcMap.length - 1;
    $(".arrow.right").css("opacity", 1).attr("disabled", false);
    $(".arrow.left").css("opacity", 1).attr("disabled", false);

    if (isLeftOver) {
        // console.log('isLeftOver')
        $(".arrow.left").css("opacity", 0.5).attr("disabled", true);
    }
    if (isRightOver) {
        // console.log('isRightOver')
        $(".arrow.right").css("opacity", 0.5).attr("disabled", true);
    }
}

function displayGpxParameters(time) {
    $("#speed_val").text(`Speed: ${getGpxData(time)?.speed || 0} ${parametersUnits.speed}`);
    $("#direction").text(`Heading: ${getGpxData(time)?.direction || 0} ${parametersUnits.direction}`);
    $("#time").text(`${time || ''}`);
}

function updateParameters(uid) {
    if (gpxData) {
        let gpx_index = srcMap[uid]?.time.time_start;
        displayGpxParameters(gpx_index);
    }
}

function findIndexByUid(uid) {
    return srcBoundsMarkers.findIndex(el => el.uid === uid) || 0;
}

function showPointer(uid, fix) {
    $(`span[data-id="${uid}"] span`)
        .height(pointerHeight)
        .append(pointerSvg)
        .css({position: 'absolute', display: 'block', zIndex: 999, top: '50px', left: `${-(fix + pointerShift)}px`})
    $(`span[data-id="${uid}"] span`).append('<div id="timer">')
}

function videoPlay(uid) {
    if (!srcMap[uid]) {
        return;
    }
    activeVideo = uid;
    checkIsOverBound(uid);
    pointToEvent(uid);
    updateRouteMarker(uid);
    updateParameters(uid);
    updated_annotated_myBar(uid);
    myVideoPlayer.autoplay = playAutoOnStart;
    myVideoPlayer.src = srcMap[uid]?.src;
    $("#additional_overlay_video").remove();
    if (srcMap[uid]?.additional) {
        secondaryMedia(uid);
    }
    changeRouteColor(globalProperties.activeRouteColor);
}

function gpxTimeConverter(time) {
    const timeInSec = get_seconds(time);
    const currentDate = new Date()
    const timeZoneOffset = currentDate.getTimezoneOffset() * 60;
    return secondsToHms(timeInSec - (timeZoneOffset + timeOffset))
}

function getGpxData(time) {
    const timeWithOffset = gpxTimeConverter(time)
    // approximation for gpx times
    if (gpxData[timeWithOffset]) {
        return gpxData[timeWithOffset]
            ?? gpxData[secondsToHms(get_seconds(timeWithOffset) - 1)]
            ?? gpxData[secondsToHms(get_seconds(timeWithOffset) + 1)]
    } else {
        return {
            speed: "--",
            direction: "--",
            time: "00:00:00"
        }
    }
}

function secondaryMedia(uid, pause = false) {
    if (srcMap[uid].additional !== null) {
        let e = document.createElement("video");
        e.id = "additional_overlay_video";
        e.setAttribute("controlsList", "nodownload");
        e.setAttribute("controls", "");
        e.setAttribute("disablepictureinpicture", "");
        e.src = srcMap[uid].additional;
        e.autoplay = playAutoOnStart;
        e.controls = true;
        $("#additional_video").append(e);
        pause && e.pause();
    }
}

// 'NEXT' button click handler:
document.querySelector(".next").addEventListener("click", function () {
    fix = 0;
    videoPlay(++activeVideo);
});

// 'PREVIOUS' button click handler:
document.querySelector(".previous").addEventListener("click", function () {
    fix = 0;
    videoPlay(--activeVideo);
});

// --- Zoom Out Handler ----- //
$("#zoom_out")
    .hover(
        function () {
            secFrame !== overall_duration
                ? $(this).css({cursor: "pointer", color: "green"})
                : $(this).css({cursor: "not-allowed", color: "silver"});
        },
        function () {
            $(this).css({cursor: "pointer", color: globalProperties.hoverColor});
        }
    )
    .on("click", () => {
        if (secFrame < overall_duration) {
            xScaleRefresh();
            if (secStart >= 0 && secEnd < overall_duration) {
                secEnd = secEnd + zoomStep;
                secFrame = secFrame + zoomStep;
                updateBoundTimes('', secEnd);
                updated_annotated_myBar(activeVideo);
                updateStorage({secEnd, secFrame, xScale});
            } else if (secStart >= 0 && secEnd === overall_duration) {
                secStart = secStart - zoomStep < 0 ? 0 : secStart - zoomStep;
                secFrame = secFrame + zoomStep;
                secStart === 0 && (activeStep = 0);
                updateBoundTimes(secStart, '');
                updated_annotated_myBar(activeVideo);
                updateStorage({secStart, secFrame, xScale})
            } else {
                $("#zoom_out").css({cursor: "not-allowed", color: "silver"});
            }
        } else {
            $("#zoom_out").css({cursor: "not-allowed", color: "silver"});
        }
    });

// ---- Zoom In Handler ----- //
$("#zoom_in")
    .hover(
        function () {
            secFrame > minZoomInValue
                ? $(this).css({cursor: "pointer", color: "green"})
                : $(this).css({cursor: "not-allowed", color: "silver"});
        },
        function () {
            $(this).css({cursor: "pointer", color: globalProperties.hoverColor});
        }
    )
    .on("click", () => {
        if (secFrame > minZoomInValue) {
            xScaleRefresh();
            secEnd = secEnd - zoomStep < minZoomInValue ? minZoomInValue : secEnd - zoomStep;
            secFrame = secFrame - zoomStep;
            $("#my_append").text(secondsToHms(secEnd));
            updated_annotated_myBar(activeVideo);
            updateStorage({secEnd, secFrame, xScale});
        } else {
            $("#zoom_in").css({cursor: "not-allowed", color: "silver"});
        }
    });

//  ---- Time Shift Left Handler ---- //

function shiftLeft(multiplier = 1) {
    if (secStart > 0) {
        const shift = shiftStep * multiplier
        secStart = secStart > shift ? secStart - shift : 0;
        secEnd = secEnd > minZoomInValue + shift ? secEnd - shift : minZoomInValue;
        activeStep = secStart === 0 ? 0 : activeStep + shift;
        updateBoundTimes(secStart, secEnd);
        updated_annotated_myBar(activeVideo);
        $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
        updateStorage({secEnd, secStart, activeStep});
    } else {
        $("#arrow_left").css({cursor: "not-allowed"});
        $("#arrow_left svg path").css({fill: "url(#normal_left)"});
    }
}

$("#arrow_left")
    .hover(
        function () {
            if (secStart === 0) {
                $(this).css({cursor: "not-allowed", fill: "red"});
                $("#arrow_left svg path").css("fill", "url(#normal_left)")
            } else {
                $(this).css({cursor: "pointer"})
                $("#arrow_left svg path").css("fill", "green")
            }
        },
        function () {
            $(this).css({cursor: "pointer", color: globalProperties.hoverColor});
            $("#arrow_left svg path").css("fill", "url(#normal_left)")
        }
    )
    .on("click", () => {
        shiftLeft()
    });

//  ---- Time Shift Right Handler ---- //

function shiftRight(multiplier = 1) {
    if (secEnd <= overall_duration - shiftStep) {
        const shift = shiftStep * multiplier;
        secStart = secStart <= overall_duration - minZoomInValue ? secStart + shift : 0;
        secEnd = secEnd + shift;
        activeStep = activeStep - shift;
        updateBoundTimes(secStart, secEnd);
        updated_annotated_myBar(activeVideo);
        $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
        updateStorage({secEnd, secStart, activeStep});
    } else {
        $("#arrow_right").css({cursor: "not-allowed"});
        $("#arrow_right svg path").css({fill: "url(#normal_right)"});
    }
}

$("#arrow_right")
    .hover(
        function () {
            if (secEnd >= overall_duration) {
                $(this).css({cursor: "not-allowed", fill: "red"});
                $("#arrow_right svg path").css("fill", "url(#normal_right)")
            } else {
                $(this).css({cursor: "pointer"})
                $("#arrow_right svg path").css("fill", "green")
            }
        },
        function () {
            $(this).css({cursor: "pointer", color: globalProperties.hoverColor});
            $("#arrow_right svg path").css({fill: "url(#normal_right)"});
        }
    )
    .on("click", () => {
        shiftRight();
    });

// Media-Ended event-listener:
myVideoPlayer.addEventListener("ended", function (e) {
    this.autoplay = playAutoOnEnded;
    playAutoOnEnded && videoPlay(++activeVideo);
});

myVideoPlayer.addEventListener("pause", function () {
    playingState = false;
})

myVideoPlayer.addEventListener("play", function () {
    playingState = true;
})
// 'TimeUpdate' event listener (invoked whenever the playing position of an audio/video has changed):
myVideoPlayer.addEventListener("timeupdate", function () {
    if (myVideoPlayer.currentTime) {
        const currentSec = srcMap[activeVideo].seconds.start + myVideoPlayer.currentTime
        const time = secondsToHms(srcMap[activeVideo].seconds.start + myVideoPlayer.currentTime);
        showTimer(time);
        const timeStart = srcMap[activeVideo]?.seconds.time_start
        const diffStart = currentSec - secStart;
        const diffEnd = currentSec - secEnd;
        if (srcBoundsMarkers[findIndexByUid(activeVideo)] && diffEnd > 0) {
            fix = srcBoundsMarkers[findIndexByUid(activeVideo)]?.width;
            srcBoundsMarkers[findIndexByUid(activeVideo)].cond === '5_2' && shiftRight(1);
        }
        if (srcBoundsMarkers[findIndexByUid(activeVideo)] && diffStart < 0) {
            fix = 0;
            srcBoundsMarkers[findIndexByUid(activeVideo)].cond === '5_1' && shiftLeft(1);
        }
        $(`span[data-id="${activeVideo}"] span`).css('left', secondsToPixels(myVideoPlayer.currentTime) - pointerShift - fix)
        if (!overTheBar && srcMap[activeVideo]) {
            const gpx = secToHours(timeStart + myVideoPlayer.currentTime);
            if (getGpxData(gpx)) {
                highlightGpxRouteOnPlay && highlightRoute(gpx, traineeColor);
                displayGpxParameters(gpx);
            }
        }
    }
});

// =============== 'HoverTooltip' ================= //
$(document).on("mouseenter", "span[data-id]", function (e) {
    const index = +$(this).attr("data-id");
    const src = srcMap[index].src;
    const time = `(${srcMap[index].time.start}, ${srcMap[index].time.end})`;
    const tooltip = srcMap[index].tooltip;
    const realtime = srcMap[index].time.duration

    const hoverContent =
        "<div style='text-align:center; '>ID: " + index + "</div>" +
        "<ul><li>" + src + "</li>" + "<li>RealTime=" + realtime + "</li>" + "<li>Time=" + time + "</li>" +
        "<li>ToolTip=" + tooltip + "</li>" + "</ul>";

    $("#hoverData").html(hoverContent).show();
});

// ====== Hide hover on mouse out ========= //
$(document).on("mouseleave", "span[data-id]", function () {
    $("#hoverData").html("").hide();
});

// Video Player Integration:
videojs("video_player", {
    controlBar: {
        fullscreenToggle: !1,
    },
});
const Button = videojs.getComponent("Button");
const MyButton = videojs.extend(Button, {
    constructor: function () {
        Button.apply(this, arguments);
        this.addClass("vjs-fullscreen-control");
        this.addClass("fullscreen-control");
    },
    handleClick: function () {
    },
});
videojs.registerComponent("MyButton", MyButton);
const player = videojs("video_player");
player.getChild("controlBar").addChild("myButton", {})
player.ready(function () {
    player.tech_.off("dblclick");
});

// ==========  Enter to Fullscreen of main video player  ========== //
$(document).on("click", ".fullscreen-control", function () {
    player.fluid(true);
    $(".video_container").addClass("fullscreen-mode")
    $("#meta")
        .animate({width: $("#slider_block").width()}, {duration: 300, easing: 'swing'});
    $(this).addClass("exitfullscreen-control");
    $(this).removeClass("fullscreen-control");
    $(".media_container").css("grid-template-columns", "100% 1fr");
    $("#map").hide();
});

// ==========  Exit from Fullscreen of main video player  ========== //
$(document).on("click", ".exitfullscreen-control", function () {
    player.fluid(false);
    $(".video_container").removeClass("fullscreen-mode");
    $("#meta")
        .animate({width: "640px"}, {duration: 300, easing: 'swing'});
    $(this).removeClass("exitfullscreen-control");
    $(this).addClass("fullscreen-control");
    $(".media_container").css("grid-template-columns", "auto 1fr");
    $("#map").show();
});

function pixelToSecond(offset) {
    const timeLineWidth = $("#my_inner_bar").width();
    const time = secFrame * offset / timeLineWidth;
    return time + secStart;
}

function pixelToSecondDiff(pix) {
    const timeLineWidth = $("#my_inner_bar").width();
    return secFrame * pix / timeLineWidth
}

// ==========  Resize Event Listener  ========== //

window.addEventListener("resize", debounce(updated_annotated_myBar, 150));

function pointToEvent(uid) {
    if (secStart > srcMap[uid]?.seconds?.start) {
        const multiStep = Math.trunc(secStart / shiftStep) -
            Math.trunc(srcMap[uid].seconds.start / shiftStep)
        shiftLeft(multiStep)
    }
    if (secEnd < srcMap[uid]?.seconds?.start) {
        const multiStep =
            Math.trunc(srcMap[uid].seconds.start / shiftStep) -
            Math.trunc(secStart / shiftStep)
        shiftRight(multiStep)
    }
}

$(document).ready(() => {
    updated_annotated_myBar()
    sleep(500).then(() => {
        if (srcBoundsMarkers[0]) {
            activeVideo = +srcBoundsMarkers[0]?.uid;
            updateStorage({activeVideo})
        } else {
            activeVideo = 0;
            updateStorage({activeVideo})
        }
        updateRouteMarker(activeVideo);
    })
});

function showTimer(time) {
    const rightBound = $("#right_control").offset()?.left - $("#timer").offset()?.left;
    $("#timer").text(time);
    if (rightBound && rightBound < 60) {
        $("#timer").css('left', '-40px')
    }
}

console.log("trainSection", trainSection)

function changeRouteColor(color) {
    if (trainSection === '0' || trainSection === 'None' || !highlightGpxRoute) {
        return;
    }
    try {
        gpxContext?.polyLineArray?.forEach(el => el.setOptions({
            strokeColor: color,
            strokeWeight: 5,
            map: gpxContext.map
        }));
    } catch (e) {
    }

}

const hoverParametersDisplay = () => {
    if (!showGpxOnHover) return;
    $(document).on("mousemove", '#my_inner_bar', cursorMove)
    $(document).on("mouseenter", '#my_inner_bar', function () {
        overTheBar = true;
        $("#sep").remove()
        $("#sep_time").remove()
        $(this).append(`<span id="sep" style="left: ${leftMargin + 20}px"></span>`)
        $(this).append(`<span id="sep_time" style="left: ${leftMargin + 20}px"></span>`)
    })
    $(document).on("mouseleave", '#my_inner_bar', function () {
        $("#sep").remove()
        $("#sep_time").remove()
        overTheBar = false;
    })
}

function cursorMove(e) {
    let offset = e.clientX - $("#my_inner_bar").offset().left;
    offset = 0 > offset ? 0 : offset >= $("#my_inner_bar").width() ? $("#my_inner_bar").width() : offset;
    const offsetInTime = secondsToHms(pixelToSecond(offset))
    const p2sec = pixelToSecond(offset) + srcMap[0]?.seconds?.time_start - srcMap[0]?.seconds.start;
    const p2secInHours = secToHours(p2sec)
    if ($("#sep")) {
        $("#sep").css('left', offset + leftMargin + 7);
        $("#sep_time").css({left: offset + leftMargin + 7, whiteSpace: 'nowrap'});
        $("#sep_time").text(offsetInTime + " | " + p2secInHours);
        displayGpxParameters(p2secInHours)
    }
    highlightRoute(p2secInHours);
}
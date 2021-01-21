/**
 * @file Contains the logic and all functions used for making of Custom Video Player
 * @author Jay Kapoor <jatinkapoor995@gmail.com>
 * @version 0.0.1
 * All rights reserved to Danit Gino, June 2020
 */

const showDebugData = true;
const showGpxOnHover = false;
const playAutoOnStart = true;                      // Play media on page loaded or start next
const playAutoOnEnded = false;                      // Play next media when previous has ended
const timeLineHeight = 50;                          // TimeLine inner height
const pointerHeight = 60;                           // Pointer height wrapper
const pointerWidth = 24;                            // Pointer width
const pointerShift = pointerWidth / 2;          // Make pointer centered according to it width
const leftMargin = 90;                              // Left margin for control elements
const rightMargin = 90;                             // Right margin for control elements
const secondsInHour = 3600;                         // Seconds in Hour
const minZoomInValue = +min_zoom_level;             // Minimum seconds for Zoom In
const zoomStep = 1200;                              // Zoom In/Out step in seconds
const shiftStep = 1200;                             // Shift Step Left/Right in seconds
const secondsFindShift = 5;                         // Aproximation for searching GPX data in seconds
let secFrame = secondsInHour;       // Current 'seconds' in the TimeLine according to Zoom level

// Get elements:
const myVideoPlayer = document.getElementById("video_player");
const mp4source = document.getElementById("mp4source");

// Get marker/slider variables:
overall_duration = get_seconds(overall_duration); // defined in HTML
let secStart = get_seconds(marker_position); // defined in HTML
let xPointer = leftMargin;
let xScale = ($("#my_inner_bar").width()) / secFrame;
let secEnd = parseInt(secFrame) + parseInt(secStart);
// Elements settings
$("#my_bar").height(timeLineHeight);
$("#pointer").height(pointerHeight).append(pointerSvg).css({left: leftMargin})
$("#meta").css('background', '#EEEEEE');
$("#speed_val").text('Speed: 0 Kn');
$("#direction").text('Heading: 0 deg');
$("#arrow_left").append(arrowLeft);
$("#arrow_right").append(arrowRight);
$("#zoom_out").addClass("glyphicon glyphicon-zoom-out")
$("#zoom_in").addClass("glyphicon glyphicon-zoom-in")
// --------------------------------------------------------------------------------------------------------
let gpxData = null;                                 // GPX data
let sourcesMap = [];                                // sources Array with suitable format
let srcBoundsMarkers = [];                          // Array with mapped properties
let srcBounds = [];                                 // Array with empty spans between annonated bars
let activeVideo = 0;                                // Active Video/Audio
let activeStep = 0;                                 // Active Shift value
let sourceData = [];                                // Mapped sources data to more suitable array format // Mapped gpxData
let trainSection = trainee_sel || 0;                // Train section
let currentState = JSON.stringify({           // Current state of important values that saved on localStorage
    overall_duration, secFrame, secStart, secEnd, xPointer, xScale, activeStep, gpxData, activeVideo
});
let overTheBar = false;

// Checking if no localStorage data exist
if (!localStorage.getItem("currentState")) {
    localStorage.setItem("currentState", currentState);
} else {
    // populate updated values to localStorage
    overall_duration = getStorageState().overall_duration;
    secStart = getStorageState().secStart;
    secEnd = getStorageState().secEnd;
    xPointer = getStorageState().xPointer;
    secFrame = getStorageState().secFrame;
    xScale = getStorageState().xScale;
    activeStep = getStorageState().activeStep;
}

if (getStorageState()?.sources && !getStorageState()?.sources.hasOwnProperty(trainSection)) {
    const sourcesUp = getStorageState()?.sources;
    sourcesUp[trainSection] = sources
    updateStorage({sources: sourcesUp})
}

// Write updated values to html elements like current left/right bounds in seconds
$("#my_prepend").text(secondsToHms(secStart));
$("#my_append").text(secondsToHms(secEnd));
$("#slider_block").css("grid-template-columns", `${leftMargin}px auto ${rightMargin}px`);
activeVideo === 0 && $(".arrow.left").css("opacity", 0.5).attr("disabled", true);

// Async callback function that executes in the training_details.html to get data from gpxviever/loadgpx.js
async function setGpxData(context, func) {
    if (!getStorageState()?.gpxData) {
        gpxData = await func.call(context);
        console.log('new gpx data')
    } else {
        gpxData = getStorageState().gpxData
        // console.log('gpx data from cache')
    }
    if (gpxData) {
        updateStorage({gpxData})
        showGpxOnHover && hoverParametersDisplay();
    }
}

const xScaleRefresh = () => {
    xScale = ($("#my_inner_bar").width()) / secFrame;
};

const secondsToPixels = (t) => get_seconds(t) * xScale;

// Mapping source object to suitable array format with all needed properties
sourcesMap = Object.values(sources).map((t, i) => {
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

    return {
        src: t.name,
        extension: fileStringSeparated.extension,
        fileName: fileStringSeparated.filename,
        time: "(" + t.start + "," + t.end + ")",
        timeStart: fileStringSeparated.start.replace(/\./g, ":"),
        duration: fileStringSeparated.duration.replace(/\./g, ":"),
        uid: i,
        tooltip: t.tooltip,
        start: t.start,
        end: t.end,
        additional: t.additional || null,
    }
});

let overlap = 0;

// --------------------------------------------------------------------------------------------------------
function updated_annotated_myBar() {
    $("#my_bar").empty();
    $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
    xScaleRefresh();
    srcBounds = [];

    let sourcesData = sourcesMap.filter(el => get_seconds(el.end) >= secStart && get_seconds(el.start) <= secEnd);
    sourcesData.forEach((el, i) => {
        const start = secondsToPixels(el.start) + activeStep * xScale;
        const end = secondsToPixels(el.end) + activeStep * xScale;
        let width = end - start;
        const prev = sourcesData[i - 1 >= 0 ? i - 1 : 0];
        const prevEnd = secondsToPixels(prev.end) + activeStep * xScale;
        const prevStart = secondsToPixels(prev.start) + activeStep * xScale;
        const additional = el.additional || null;
        const colors = el.tooltip.match(/(\(\d+\))+/g).map(getColorByIndex);
        const time = {
            time_start: el.timeStart,
            start: el.start,
            end: el.end,
            duration: el.duration,
            prev: {
                time_start: prev.timeStart,
                start: prev.start,
                end: prev.end,
                duration: prev.duration,
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
            tooltip:
            el.tooltip,
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
                width = 0;
                overlap = prevEnd - end;
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '1_2':
                width = end - prevEnd;
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '1_3':
                width = 0;
                break;

            case '2_1':
                width = 0
                overlap = prevEnd - end
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '2_2':
                width = end - prevEnd
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '2_3':
                srcBounds.push({...defaultObj, type: 0, width: start});
                break;

            case '3_1':
                width = 0;
                overlap = prevEnd - end;
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '3_2':
                width = end - prevEnd;
                overlap = 0;
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '3_3':
                width = 0;
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '4_1':
                width = 0;
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '4_2':
                srcBounds.push({...defaultObj, type: 0, width: start - prevEnd});
                break;

            case '5_1':
                overlap = 0;
                width = (get_seconds(time.end) - secStart) * xScale
                srcBounds.push({...defaultObj, type: 0, width: 0});
                break;

            case '5_2':
                width = (secEnd - get_seconds(time.start)) * xScale;
                srcBounds.push({...defaultObj, type: 0, width: start - prevEnd});
                break;

            case '6':
                width = end - start;
                srcBounds.push({...defaultObj, type: 0, width: start - prevEnd - overlap});
                overlap = 0;
                break;

            default:
                console.log('default')
                break;
        }

        const obj = {
            ...defaultObj,
            type: 1,
            colors,
            width,
            overlap,
            cond: caseVal,
            id: i
        };
        srcBounds.push(obj);
    });

    srcBounds.forEach((el) => {
        let style = `width:${el.width}px`;
        if (el?.type !== 0) {
            const typeBgBar = `repeating-linear-gradient(45deg, ${el.colors[1]
            || "Black"}, ${el.colors[1]
            || "Black"} 10px, ${el.colors[0]} 10px, ${el.colors[0]} 20px)`;
            style = `${style}; background: ${el.colors.length > 1 ? typeBgBar : el.colors[0]}`;
            $("#my_bar").append(
                `<span data-id="${el?.uid}" class="type_${el.type}" style="${style}" onclick="videoPlay(${el?.uid})"></span><span class="separator"></span>`
            );
        } else {
            style = `${style}`;
            $("#my_bar").append(`<span data-empty-id="${el?.uid}" class="type_${el.type}" style="${style}"></span>`);
        }
    });

    srcBoundsMarkers = srcBounds?.filter((it) => it.type === 1);
    if (srcBoundsMarkers[findIndexByUid(activeVideo)]) {
        xPointer =
            (srcBoundsMarkers[findIndexByUid(activeVideo)].start ? srcBoundsMarkers[findIndexByUid(activeVideo)].start + leftMargin : srcBoundsMarkers[0].start + leftMargin);
        $("#timer").text(secondsToHms(get_seconds(srcBoundsMarkers[findIndexByUid(activeVideo)].time.start) + myVideoPlayer.currentTime));
    }

    if (findIndexByUid(activeVideo) > -1) {
        const timer = get_seconds(srcBoundsMarkers[findIndexByUid(activeVideo)].time.start) + myVideoPlayer.currentTime;
        if (xPointer > leftMargin) {
            $("#pointer").css("left", xPointer - pointerShift).show();
        }
        $("#timer").text(secondsToHms(timer));
    } else {
        $("#pointer").hide();
        $("#timer").text('');
    }
    updateStorage({xPointer});
    showDebugData && debugTiming()
    console.debug("srcBoundsMarkers", srcBoundsMarkers);
}

function debugTiming() {
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
    })
}

function videoPlay(uid) {

    if (uid < sourcesMap.length - 1) {
        $(".arrow.right").css("opacity", 1).attr("disabled", false);
    } else {
        $(".arrow.right").css("opacity", 0.5).attr("disabled", false);
    }
    if (uid > 0) {
        $(".arrow.left").css("opacity", 0.5).attr("disabled", true);
    }

    let index = srcBoundsMarkers.findIndex((el) => +el.uid === +uid);
    if(srcBoundsMarkers[index].cond === '5_1') {
        shiftLeft(1);
        updated_annotated_myBar();
    }
    index = index === -1 ? 0 : index;
    if (gpxData) {
        const gpx_index = sourcesMap[index]?.timeStart;
        $("#speed_val").text(`Speed: ${getGpxData(gpx_index)?.speed} Kn`);
        $("#direction").text(`Heading: ${getGpxData(gpx_index)?.direction} deg`);
    }
    xPointer = leftMargin + srcBoundsMarkers[index]?.start;
    activeVideo = uid;
    updated_annotated_myBar();
    activeVideo !== 0 && $(".arrow.left").css("opacity", 1).attr("disabled", false);

    if (sourcesMap[index]) {
        myVideoPlayer.autoplay = playAutoOnStart;
        myVideoPlayer.src = sourcesMap[index].src;
        $("#additional_overlay_video").remove();
        if (sourcesMap[index].additional !== null) {
            secondaryMedia(activeVideo);
        }
    }

}

function findIndexByUid(uid) {
    return srcBoundsMarkers.findIndex(el => el.uid === uid) || 0;
}

function getGpxData(time) {
    if (!gpxData || !gpxData[time]) {
        return {
                speed: "0",
                direction: "0",
                time: ""
        }
    } else {
        return gpxData[time];
    }
}

function secondaryMedia(activeVideo, pause = false) {
    if (sourcesMap[activeVideo].additional !== null) {
        let e = document.createElement("video");
        e.id = "additional_overlay_video";
        e.setAttribute("controlsList", "nodownload");
        e.setAttribute("controls", "");
        e.setAttribute("disablepictureinpicture", "");
        e.src = sourcesMap[activeVideo].additional;
        e.autoplay = playAutoOnStart;
        e.controls = true;
        $("#additional_video").append(e);
        pause && e.pause();
    }
}

// 'NEXT' button click handler:
document.querySelector(".next").addEventListener("click", function () {
    myVideoPlayer.autoplay = playAutoOnStart;
    // Primary Media:
    // Checking if we shift to positions more or less then played video
    if (secStart > get_seconds(sourcesMap[activeVideo].start)) {
        const multiStep =
            Math.trunc(secStart / shiftStep) -
            Math.trunc(get_seconds(sourcesMap[activeVideo].start) / shiftStep)
        shiftLeft(multiStep)
    }
    if (secEnd < get_seconds(sourcesMap[activeVideo].start)) {
        const multiStep =
            Math.trunc(get_seconds(sourcesMap[activeVideo].start) / shiftStep) -
            Math.trunc(secStart / shiftStep)
        shiftRight(multiStep)
    }
    const isEnd = activeVideo >= sourcesMap.length - 1;
    const isEndFrame = activeVideo >= srcBoundsMarkers[srcBoundsMarkers.length - 1].uid;
    if (!isEnd) {
        $(".arrow.left").css("opacity", 1).attr("disabled", false);
        $(".arrow.right").css("opacity", 1).attr("disabled", false);
        activeVideo = ++activeVideo;
        if (isEndFrame) {
            // console.log('going to the next event start')
            const multiStep =
                Math.trunc(get_seconds(sourcesMap[activeVideo].start) / shiftStep) -
                Math.trunc(get_seconds(sourcesMap[activeVideo - 1].start) / shiftStep)
            shiftRight(multiStep)
        }
    } else {
        $(".arrow.right").css("opacity", 0.5).attr("disabled", true);
    }
    updated_annotated_myBar()
    const index = srcBoundsMarkers.findIndex((el) => el.uid === activeVideo);
    myVideoPlayer.src = srcBoundsMarkers[index].src;

    // Secondary Media:
    $("#additional_overlay_video").remove();

    if (srcBoundsMarkers[index].additional != null) {
        secondaryMedia(index);
    }
    const gpx_index = srcBoundsMarkers[index]?.time?.time_start;

    if (getGpxData(gpx_index)) {
        $("#speed").text(`Speed: ${getGpxData(gpx_index).speed}`);
        $("#direction").text(`Heading: ${getGpxData(gpx_index).direction}`);
    }
    const shift = srcBoundsMarkers[index].start;
    xPointer = shift + leftMargin;
    $("#pointer").css("left", xPointer - pointerShift);
    $("#timer").text(secondsToHms(get_seconds(srcBoundsMarkers[index].time.start) + myVideoPlayer.currentTime));
});

// 'PREVIOUS' button click handler:
document.querySelector(".previous").addEventListener("click", function () {
    // Primary Media:
    // Checking if we shift to positions more or less then played video
    myVideoPlayer.autoplay = playAutoOnStart;
    if (secStart > get_seconds(sourcesMap[activeVideo].start)) {
        const multiStep =
            Math.trunc(secStart / shiftStep) -
            Math.trunc(get_seconds(sourcesMap[activeVideo].start) / shiftStep)
        shiftLeft(multiStep)
    }
    if (secEnd < get_seconds(sourcesMap[activeVideo].start)) {
        const multiStep =
            Math.trunc(get_seconds(sourcesMap[activeVideo].start) / shiftStep) -
            Math.trunc(secStart / shiftStep)
        shiftRight(multiStep)
    }
    const isStart = activeVideo <= 0;
    const isStartFrame = sourcesMap?.findIndex(el => +el.uid < +srcBoundsMarkers[0].uid) > -1;

    if (!isStart) {
        $(".arrow.left").css("opacity", 1).attr("disabled", false);
        activeVideo = --activeVideo;
        if (isStartFrame) {
            // console.log('going to previous event start')
            const multiStep = Math.trunc(get_seconds(sourcesMap[activeVideo + 1].start) / shiftStep) -
                Math.trunc(get_seconds(sourcesMap[activeVideo].start) / shiftStep)
            shiftLeft(multiStep)
            $(".arrow.right").css("opacity", 1).attr("disabled", false);
        }
    } else {
        $(".arrow.left").css("opacity", 0.5).attr("disabled", true);
    }
    updated_annotated_myBar()
    const index = srcBoundsMarkers.findIndex((el) => el.uid === activeVideo);
    myVideoPlayer.src = srcBoundsMarkers[index].src;
    // Secondary Media:
    $("#additional_overlay_video").remove();

    if (srcBoundsMarkers[index].additional != null) {
        secondaryMedia(index);
    }

    const gpx_index = srcBoundsMarkers[index]?.time?.time_start;
    if (getGpxData(gpx_index)) {
        $("#speed_val").text(`Speed: ${getGpxData(gpx_index).speed} Kn`);
        $("#direction").text(`Heading: ${getGpxData(gpx_index).direction} deg`);
    }

    const shift = srcBoundsMarkers[index].start;
    xPointer = shift + leftMargin;
    $("#pointer").css("left", xPointer - pointerShift);
    $("#timer").text(secondsToHms(get_seconds(srcBoundsMarkers[index].time.start) + myVideoPlayer.currentTime));
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
            $(this).css({cursor: "pointer", color: "#808080"});
        }
    )
    .on("click", () => {
        if (secFrame < overall_duration) {
            xScaleRefresh();
            if (secStart >= 0 && secEnd < overall_duration) {
                secEnd = secEnd + zoomStep;
                secFrame = secFrame + zoomStep;
                xPointer = xPointer + zoomStep * xScale;
                $("#my_append").text(secondsToHms(secEnd));
                updated_annotated_myBar();
                updateStorage({secEnd, secFrame, xScale, xPointer});
            } else if (secStart >= 0 && secEnd === overall_duration) {
                secStart = secStart - zoomStep < 0 ? 0 : secStart - zoomStep;
                secFrame = secFrame + zoomStep;
                secStart === 0 && (activeStep = 0);
                xPointer = xPointer + zoomStep * xScale;
                $("#my_prepend").text(secondsToHms(secStart));
                updated_annotated_myBar();
                updateStorage({secStart, secFrame, xScale, xPointer})
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
            $(this).css({cursor: "pointer", color: "#808080"});
        }
    )
    .on("click", () => {
        if (secFrame > minZoomInValue) {
            xScaleRefresh();
            secEnd = secEnd - zoomStep < minZoomInValue ? minZoomInValue : secEnd - zoomStep;
            secFrame = secFrame - zoomStep;
            $("#my_append").text(secondsToHms(secEnd));
            updated_annotated_myBar();
            updateStorage({secEnd, secFrame, xScale, xPointer});
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
        xPointer = xPointer + shift * xScale;

        $("#my_prepend").text(secondsToHms(secStart));
        $("#my_append").text(secondsToHms(secEnd));

        updated_annotated_myBar();
        $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
        updateStorage({secEnd, secStart, xPointer, activeStep});
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
            $(this).css({cursor: "pointer", color: "#808080"});
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
        $("#my_prepend").text(secondsToHms(secStart));
        $("#my_append").text(secondsToHms(secEnd));
        updated_annotated_myBar();
        if(xPointer < leftMargin) {
            $("#pointer").hide();
        }
        $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
        updateStorage({secEnd, secStart, xPointer, activeStep});
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
            $(this).css({cursor: "pointer", color: "#808080"});
            $("#arrow_right svg path").css({fill: "url(#normal_right)"});
        }
    )
    .on("click", () => {
        shiftRight();
    });

// Media-Ended event-listener:
myVideoPlayer.addEventListener("ended", function (e) {
    this.autoplay = playAutoOnEnded;
    $("#additional_overlay_video").remove();
    if (activeVideo < srcBoundsMarkers.length - 1) {
        activeVideo = ++activeVideo;
    } else {
        activeVideo = 0;
    }
    const shift = srcBoundsMarkers[activeVideo].start;
    xPointer = shift + leftMargin;
    $("#pointer").css("left", xPointer - pointerShift);

    myVideoPlayer.src = srcBoundsMarkers[activeVideo].src;

    if (srcBoundsMarkers[activeVideo].additional != null) {
        const t = document.createElement("video");
        t.id = "additional_overlay_video";
        t.setAttribute("controlsList", "nodownload");
        t.setAttribute("controls", "");
        t.setAttribute("disablepictureinpicture", "");
        t.src = srcBoundsMarkers[activeVideo].additional;
        t.autoplay = false;
        t.controls = true;
        $("#additional_video").append(t);
    } else {
        $("#additional_overlay_video").remove();
    }
});

// 'TimeUpdate' event listener (invoked whenever the playing position of an audio/video has changed):
myVideoPlayer.addEventListener("timeupdate", function () {
    let index = '';
    let time;
    if(index === '') {
        index = findIndexByUid(activeVideo)
    }
    if (myVideoPlayer.currentTime > 0 && index > -1) {
        time = secondsToHms(get_seconds(srcBoundsMarkers[index].time.start) + myVideoPlayer.currentTime);
        timeDate = secondsToHms(get_seconds(srcBoundsMarkers[index].time.time_start) + myVideoPlayer.currentTime);
        if (srcBoundsMarkers[index]) {
            index > -1 && $("#timer").text(time);
            $("#pointer").css("left", xPointer + myVideoPlayer.currentTime * xScale - pointerShift);
        }
        const timeStart = get_seconds(sourcesMap[activeVideo]?.timeStart)
        if (!overTheBar && sourcesMap[activeVideo]) {
            const gpx = secToHours(timeStart + myVideoPlayer.currentTime);
            if (getGpxData(gpx)) {
                $("#speed_val").text(`Speed: ${getGpxData(gpx).speed} Kn`);
                $("#direction").text(`Heading: ${getGpxData(gpx).direction} deg`);
                $("#time").text(`${timeDate}`);
            }
        }
    }
});

// =============== 'HoverTooltip' ================= //
$(document).on("mouseenter", "span[data-id]", function (e) {
    const index = +$(this).attr("data-id");
    const selectedSrcId = findIndexByUid(index)
    const src = srcBoundsMarkers[selectedSrcId].src;
    const time = `(${srcBoundsMarkers[selectedSrcId].time.start}, ${srcBoundsMarkers[selectedSrcId].time.end})`;
    const tooltip = srcBoundsMarkers[selectedSrcId].tooltip;
    const realtime = srcBoundsMarkers[selectedSrcId].time.duration

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

window.addEventListener("resize", debounce(updated_annotated_myBar, 180));

$(document).ready(() => {
    updated_annotated_myBar()
    sleep(400).then(() => {
        if (srcBoundsMarkers.length > 0) {
            videoPlay(srcBoundsMarkers[0].uid)
        } else {
            if (secStart > get_seconds(sourcesMap[0].start)) {
                const multiStep = Math.trunc(secStart / shiftStep) -
                    Math.trunc(get_seconds(sourcesMap[0].start) / shiftStep)
                shiftLeft(multiStep)
            }
            if (secEnd < get_seconds(sourcesMap[0].start)) {
                const multiStep =
                    Math.trunc(get_seconds(sourcesMap[activeVideo].start) / shiftStep) -
                    Math.trunc(secStart / shiftStep)
                shiftRight(multiStep)
            }
            videoPlay(0);
        }
    })
});

const hoverParametersDisplay = () => {
    $(document).on("mouseleave", '#my_inner_bar', function () {
        $("#sep").remove()
        $("#sep_time").remove()
        overTheBar = false;
    })
    $(document).on("mousemove", '#my_inner_bar', cursorMove)
    $(document).on("mouseenter", '#my_inner_bar', function () {
        overTheBar = true;
        $("#sep").remove()
        $("#sep_time").remove()
        $(this).append(`<span id="sep" style="left: ${leftMargin}px"></span>`)
        $(this).append(`<span id="sep_time" style="left: ${leftMargin}px"></span>`)
    })
}

function cursorMove(e) {
    let offset = e.clientX - $("#my_inner_bar").offset().left;
    offset = 0 > offset ? 0 : offset >= $("#my_inner_bar").width() ? $("#my_inner_bar").width() : offset;

    const offsetInTime = secondsToHms(pixelToSecond(offset))
    const p2sec = pixelToSecond(offset) + get_seconds(sourcesMap[0]?.timeStart) - get_seconds(sourcesMap[0]?.start);
    const p2secInHours = secToHours(p2sec)
    const gpx = getGpxData(p2secInHours);
    if ($("#sep")) {
        $("#sep").css('left', offset + leftMargin - 6);
        $("#sep_time").css({ left: offset + leftMargin - 6, whiteSpace: 'nowrap' });
        $("#sep_time").text(offsetInTime + " | " + p2secInHours);
        $("#speed_val").text(`Speed: ${gpx?.speed || 0} Kn`);
        $("#time").text(`${p2secInHours}`);
        $("#direction").text(`Heading: ${gpx?.direction || 0} deg`);
    }
}

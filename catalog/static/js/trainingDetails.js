/**
 * @file Contains the logic and all functions used for making of Custom Video Player
 * @author Jay Kapoor <jatinkapoor995@gmail.com>
 * @version 0.0.1
 * All rights reserved to Shahar Gino, June 2020
 */

const isDevMode =
  () =>
    window.location.origin
      .indexOf('127.0.0.1') > -1         // dev mode (127.0.0.1) checking
const updateChartStatsIfZoom = false                // updateChartStats when zooming timeline
const useLastValueOnChartTime = true                // use last active values if gpxData for current time is dropped
const showDistanceLossButton = showDistanceLoss === 'True'
const showDebugData = true;                         // Show Debug Information for checking timing and overlapping
const showGpxOnHover = true;                        // Show GPX parameters on annotated bar hover
const showInfoWindow = false;                       // Show Info window for gps marks
const showInfoMobileWindow = false;                 // Show Info fo Mobile Marks
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
let favoritesBounds = [];                         // Favorite Bounds
let secFrame = secondsInHour;                       // Current 'seconds' in the TimeLine according to Zoom level
const markerStyles = {                              // Default marker styles on the google map
  icon: {
    scale: parseFloat(gpx_marker_scale),
    fillColor: "#F00",
    fillOpacity: 0.4,
    strokeWeight: 0.4
  },
  iconFavorite: {
    text: '⭑',
    color: {
      unselected: 'grey',
      selected: 'yellow'
    },
    fontSize: '28px'
  },
  iconMerged: {
    scale: parseFloat(gpx_marker_scale) * 1.7,
    fillColor: "#950000",
    fillOpacity: 0.4,
    strokeWeight: 0.4
  },
  mobile: {
    icon: {
      scale: parseFloat(gpx_marker_scale),
      fillOpacity: 0.5,
      strokeWeight: 0.4
    }
  }
}
const globalProperties = {                           // Global Properties like colors, zoom, bg, e.t.c.
  hoverColor: "#808080",
  activeRouteColor: "#E6E6E6",
  metaBackground: "#EEEEEE",
  activeRouteWidth: parseFloat(gpx_route_width),
  zoom: 16,
  marker: {
    normal: {
      fillColor: "#F00",
      fillOpacity: 0.4
    },
    selected: {
      fillColor: "#3C3C3C",
      fillOpacity: 0.5
    },
    mobile: {
      defaultFillColor: '#3C3C3C'
    }
  },
  mobileColors: {
    1: gpx_mark_color1,
    2: gpx_mark_color2,
    3: gpx_mark_color3,
    4: gpx_mark_color4,
    5: gpx_mark_color5
  },
  video: {
    main: {
      maxHeightFullScreen: window.outerHeight - 40,
      maxWidth: '100%',
      maxHeight: 500,
      muted: false,
      volume: 1,
      defaultViewSettings: ''
    },
    additional: {
      aspectRatio: false,
      maxHeight: 150,
      maxWidth: 200,
      muted: false,
      volume: 0.25,
      containment: false,
      defaultViewSettings: ''
    }
  },
  map: {
    width: 200,
    height: 150
  }
}
const routeLine = {                                   // Settings for highlighted route like length before start abd length after start time
  before: parseInt(gpx_route_before),
  after: parseInt(gpx_route_after)
}
const parametersUnits = {                             // Units of speed and direction (Heading another words)
  speed: "Kn",
  direction: " °",
  heel: " °"
}
const secondsInDay = 24 * 3600;
let showOnlyFavorite = false;

// Get elements:
const myVideoPlayer = document.getElementById("video_player");
const mp4source = document.getElementById("mp4source");

// Get marker/slider variables:
overall_duration = get_seconds(overall_duration);
let secStart = get_seconds(marker_position);
let xScale = ($("#my_inner_bar").width()) / secFrame;
let secEnd = parseInt(secFrame.toString()) + parseInt(secStart);

// Elements settings
// $(".video_player-dimensions").height(globalProperties.video.main.maxHeight);
// $("#video_player").height(globalProperties.video.main.maxHeight);
$("#my_bar").height(timeLineHeight);
$("#speed_val").text("Speed: --");
$("#direction").text("Heading: --");
$("#heel").text("Heel: --");
$("#arrow_left").append(arrowLeft);
$("#arrow_right").append(arrowRight);
$("#zoom_out").addClass("glyphicon glyphicon-zoom-out")
$("#zoom_in").addClass("glyphicon glyphicon-zoom-in");

if (!showDistanceLossButton) {
  $("#distance_loss").remove();
} else {
  $("#meta").css("grid-template-columns", "2fr 2fr 2fr 60px 1fr");
}
// Swapping comments block if comments text chars length > 45
//toggleComments();


// --------------------------------------------------------------------------------------------------------
let gpxData = null;                                 // GPX data from server
let srcMap = [];                                    // Sources Array with suitable format
let srcBoundsMarkers = [];                          // Array with mapped properties
let srcBounds = [];                                 // Array with empty spans between annotated bars
let activeVideo = 0;                                // Active Video/Audio
let activeStep = 0;                                 // Active Shift value
let sourceData = [];                                // Mapped sources data to more suitable array format // Mapped gpxData
let trainSection = trainee_sel;                     // Train section
let markers = {};                                   // Array of markers that was received from google map context
let gpxContext = {};                                // Current GPX class context (loadgpx.js)
let overlap = 0;                                    // Overlapping value of an events
let margin = 0;                                     // Margin value of an events
let fix = 0;                                        // Fix Pointer position if it's on the bounds
let polyline = [];                                  // Current Polyline object from google maps
let timeOffset = 3 * secondsInHour;                 // Current Time Offset for GPX
const trainingID = train_id;                        // Selected (current) train ID
if (trainSection === 'None') {
  showRoutesMarkers = false
}                                                   // If train ID doesn't specified, 1 by default
const traineeMode = trainSection !== '0' && trainSection !== 'None'
let currentState = JSON.stringify({            // Current state of important values that saved on localStorage
  secFrame, secStart, secEnd, xScale, activeStep, activeVideo
});
const traineeColor =
  getColorByIndex(`(${trainSection})`);  // Current trainee color
let playingState = false;
let currentView = '';
let rotationMain = 0;
let rotationAdditional = 0;
let panningMain;
let panningAdditional;
let zoomMain = 1;
let zoomAdditional = 1;
let fsMapActive = false;
let distanceLossUrl = "";
let selectedGpxIndex = 0;

// Async callback function that executes in the training_details.html to get data from gpxviewer/loadgpx.js
async function setGpxData(ctx, func, trainerOnlyMode = false) {
  if (!trainerOnlyMode) {
    gpxContext = ctx;
    gpxData = await func.call(ctx);
    if (trainSection !== '0' && trainSection !== 'None') {
      gpxData = gpxData[0];
    }
    if (gpxContext.timeOffset) {
      timeOffset = gpxContext.timeOffset * secondsInHour;
    }

    changeRouteColor(globalProperties.activeRouteColor, globalProperties.activeRouteWidth);
    videJsPrimary();
    videoPlay();
    interactiveInit('#alt_view_wrapper');
    polyLineInit();
    addRouteMarker();
    addMobileRouteMarks();
    hoverParametersDisplay();
    loadCharts(!traineeMode ? gpxData[selectedGpxIndex] : gpxData);
  } else {
    videJsPrimary();
    videoPlay();
  }
  zoomPanLoad();
}

let pl = [];

function polyLineInit() {
  polyline = new google.maps.Polyline({
    path: [],
    strokeWeight: 5,
    map: gpxContext.map
  });
  for (let i = 0; i < gpxContext.trkColors.length; i++) {
    pl[i] = new google.maps.Polyline({
      path: [],
      strokeWeight: 5,
      map: gpxContext.map
    });
  }
}

const tempMap = srcMap.slice();

function filterEvents(favoriteOnly = false) {
  showOnlyFavorite = favoriteOnly;
  checkIsOverBound(activeVideo);
  // favoriteMap();
  updated_annotated_myBar(activeVideo);
  addRouteMarker();
}

function clearAllMarkers() {
  for (let i = 0; i < markers?.length; i++) {
    markers[i]?.setMap(null);
  }
  markers = [];
}

function addRouteMarker() {
  if (!showRoutesMarkers) {
    return;
  }
  clearAllMarkers();
  srcMap.filter(el => {
    if (showOnlyFavorite) {
      return el.isFavorite === 'True'
    }
    return true
  }).forEach(el => {
    const timeForMarker = secondsToHms(get_seconds(el.time.time_start) + 0.5 * get_seconds(el.time.duration));
    const coordinates = getGpxData(timeForMarker).position
    const isFavorite = el?.isFavorite === 'True'
    const isMerged = el?.isMerged === 'True'
    const favoriteMark = {
      text: markerStyles.iconFavorite.text,
      fontSize: '16px',
      color: 'yellow',
      labelStyle: {
        margin: '-2px 0 0'
      }
    }
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(coordinates?.lat, coordinates?.lon),
      map: gpxContext.map,
      data: el.uid,
      label: isFavorite ? favoriteMark : null,
      icon: {
        ...markerStyles.icon,
        scale: isMerged ? markerStyles.iconMerged.scale : markerStyles.icon.scale,
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
      if (centerEventOnMap) {
        setTimeout(() => {
          try {
            const isNaNPosition = Number.isNaN(marker.position.lat());
            if (!isNaNPosition) {
              gpxContext.map?.setCenter(marker?.getPosition() || {});
            }
          } catch (e) {
            console.error('setCenterError', e);
          }
        }, 500)
      }
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

function addMobileRouteMarks() {

  for (let keyVal in gpxContext.mobileMarks) {
    if (!gpxContext.mobileMarks.hasOwnProperty(keyVal)) {
      return;
    }
    const {color, time, position} = gpxContext.mobileMarks[keyVal]
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(position?.lat, position?.lon),
      map: gpxContext.map,
      icon: {
        ...markerStyles.mobile.icon,
        fillColor: globalProperties.mobileColors[color]
          ? globalProperties.mobileColors[color]
          : globalProperties.marker.mobile.defaultFillColor,
        path: google.maps.SymbolPath.CIRCLE,
      }
    });
    const infoBlock = new google.maps.InfoWindow({
      content: `
                    <div class="infoBlock">
                        <div>Time: ${time}</div>
                    </div>`
    });
    marker.addListener('mouseover', () => {
      if (showInfoMobileWindow) {
        infoBlock.open(map, marker)
        marker.setOptions({
          icon: {
            ...marker.icon,
            strokeWeight: 1.4
          },
        })
      }
    })
    marker.addListener('mouseout', () => {
      if (showInfoMobileWindow) {
        infoBlock.close();
        marker.setOptions({
          icon: {
            ...marker.icon,
            strokeWeight: 0.4
          },
        })
      }
    })
  }
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
        try {
          const isNaNPosition = Number.isNaN(selectedMarker.position.lat());
          if (!isNaNPosition) {
            gpxContext.map?.setCenter(selectedMarker?.getPosition() || {});
          }
        } catch (e) {
          console.error('setCenterError', e);
        }
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
  if (trainSection === '0' || trainSection === 'None') {
    for (let j = 0; j < gpxData?.length; j++) {
      const convertedTime = get_seconds(gpxTimeConverter(time));
      const arr = []
      for (let i = -routeLine.before; i < routeLine.after; i++) {
        const push = gpxData[j][secondsToHms(convertedTime + i)]?.position
        push && arr.push(gpxData[j][secondsToHms(convertedTime + i)]?.position);
      }
      pl[j].setOptions({
        zIndex: 999.9,
        path: arr.map(el => new google.maps.LatLng(el.lat, el.lon)),
        strokeColor: colourNameToHex(gpxContext.trkColors[j]),
        strokeWeight: 5,
        map: gpxContext.map
      });
    }
  } else {
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
    isFavorite: t.is_favored,
    isMerged: t.is_merged,
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
      tz_offset: get_seconds(t.time) - get_seconds(time_start)
    },
    distanceLoss: {
      url: t.distanceLoss
    },
    colors: t.tooltip.match(/(\(\d+\))+/g).map(getColorByIndex),
    tooltip: t.tooltip,
    additional: t.additional || null,
  }
});

function markFavorite(uid) {
  const srcBoundsMarkersIndex = srcMap.findIndex(el => el.uid === uid);
  if (srcBoundsMarkersIndex > -1) {
    const item = srcMap[srcBoundsMarkersIndex];
    if (item.isFavorite === 'True') {
      item.isFavorite = 'False'
      unset_media(item.src, 'unfavor', false);
    } else {
      item.isFavorite = 'True'
      set_media(item.src, 'favor', false);
    }
  }
  updated_annotated_myBar(activeVideo);
  addRouteMarker();
}

// --------------------------------------------------------------------------------------------------------
function updated_annotated_myBar(uid = 0, fix = 0) {
  updateAltViewPosition();
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
    const distanceLoss = el.distanceLoss;
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
      distanceLoss,
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
      isFavorite: el.isFavorite,
      isMerged: el.isMerged,
      id: i
    };
    srcBounds.push(obj);
  });

  srcBounds.forEach((el, i) => {
    const isFavorite = el?.isFavorite === 'True';
    let isOnlyFavorite = `visibility: ${showOnlyFavorite ? isFavorite ? 'visible' : 'hidden' : 'visible'};`
    let style = `width:${el.width}px; ${isOnlyFavorite}`;
    let favoriteStyle = `text-shadow: 0px 1px black; color: ${markerStyles.iconFavorite.color.unselected}; font-size: ${markerStyles.iconFavorite.fontSize}; position: absolute; cursor: pointer; right: ${el.width / 2 - 11}px; top: ${+activeVideo === +el.uid ? 0 : 38}px`;
    let favorite = '';
    let favoriteStyleSelected = '';
    if (el?.type !== 0) {

      if (i > 0 && srcBounds[i].cond === '5_1') {
        el.margin = srcBounds[i - 1].width
      }

      const typeBgBar = `repeating-linear-gradient(45deg, ${el.colors[1] || "Black"}, ${el.colors[1] || "Black"} 10px, ${el.colors[0]} 10px, ${el.colors[0]} 20px)`;
      style = `${style}; margin-left: ${-el.margin}px; background: ${el.colors.length > 1 ? typeBgBar : el.colors[0]}`;
      if (el.isFavorite === "True") {
        favoriteStyleSelected = `${favoriteStyle}; color: ${markerStyles.iconFavorite.color.selected};`;
      } else {
        favoriteStyleSelected = `${favoriteStyle}; ${isOnlyFavorite}`
      }
      favorite = `<div style="${favoriteStyleSelected}" onClick="markFavorite(${el?.uid})">${markerStyles.iconFavorite.text}</div>`;
      $("#my_bar").append(
        `<span data-id="${el?.uid}" class="type_${el.type}" style="${style}" onclick="videoPlay(${el?.uid})"></span><span class="separator">${favorite}</span>`
      );
      $(`span[data-id="${el?.uid}"]`).append(`<span>`);
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

function checkDistanceLoss(uid) {
  distanceLossUrl = srcMap[uid].distanceLoss.url;
  if (distanceLossUrl && distanceLossUrl !== "NA") {
    $("#distance_loss_icon").css("opacity", "1")
    $("#distance_loss_img").show()
    $("#distance_loss_error").hide();
    $("#distance_loss_modal_label").text(`Distance Loss for ID: ${uid}`);
    $("#distance_loss_img").attr("src", distanceLossUrl);
  } else {
    $("#distance_loss_icon").css("opacity", "0.5")
    $("#distance_loss_img").hide();
    $("#distance_loss_error").show();
    $("#distance_loss_error").text('Maneuver analyzer angle limit is exceeded')
  }
}

function checkIsOverBound(uid) {
  if (showOnlyFavorite) {
    return;
  }
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
  const time_sec = get_seconds(time)
  const tz_offset = srcMap[0]?.seconds.tz_offset;
  const time_disp = secToHours(time_sec + tz_offset);
  $("#speed_val").text(`Speed: ${getGpxData(time)?.speed || 0} ${parametersUnits.speed}`);
  $("#direction").text(`Heading: ${getGpxData(time)?.direction || 0} ${parametersUnits.direction}`);
  $("#heel").text(`Heel: ${getGpxData(time)?.heel || 0} ${parametersUnits.heel}`);
  $("#time").text(`${time_disp || ''}`);
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
    .css({position: 'absolute', display: 'block', zIndex: 140, top: '50px', left: `${-(fix + pointerShift)}px`})
  $(`span[data-id="${uid}"] span`).append('<div id="timer">')
}

function videoPlay(uid) {
  activeVideo = uid || 0;
  if (!srcMap[activeVideo]) {
    return;
  }
  favoriteMap();
  checkDistanceLoss(activeVideo);
  checkIsOverBound(activeVideo);
  pointToEvent(activeVideo).then();
  updateRouteMarker(activeVideo);
  updateParameters(activeVideo);
  updated_annotated_myBar(activeVideo);
  primaryMediaReload(activeVideo);
  secondaryMedia(activeVideo);
  resetZoomRotate();
}

// https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
// Fixed player interruption
function playPromise(videoJS) {
  const playPromise = videoJS.play();

  if (playPromise !== undefined) {
    playPromise
      .then(_ => {
        setTimeout(() => videoJS.play(),100)
      })
      .catch(error => {
        console.log('Video Player Promise Error', error)
      });
  }
}

function primaryMediaReload(uid) {
  videojs('video_player').src(srcMap[uid]?.src);
  videojs('video_player').load();
  if (!srcMap[uid]?.additional) {
    playPromise(videojs('video_player'));
  }
}


function secondaryMedia(uid, pause = false) {
  if (srcMap[uid]?.additional) {
    videoJsSecondary(uid, pause);
  } else {
    $('#additional_video video').length > 0 && videojs('additional_video video').pause();
    altView(false);
  }
}

function videJsPrimary() {
  videojs("video_player", {
    controls: true,
    controlBar: {
      fullscreenToggle: !1,
      volumePanel: {inline: false}
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
      const videoContainer = document.getElementById('video_container');
      openFullscreen(videoContainer);
      $("#alt_view_wrapper").css({top: '10px', left: 'auto', right: '10px'});
    },
  })
  const rotateBtn = `<div onclick="rotateMainVideo('video_player_html5_api')" class="glyphicon glyphicon-refresh" aria-hidden="true"></div>`;
  const zoomInBtn = `<div onclick="zoomInMain(mainVid)" class="glyphicon glyphicon-zoom-in" aria-hidden="true"></div>`;
  const zoomOutBtn = `<div onclick="zoomOutMain(mainVid)" class="glyphicon glyphicon-zoom-out" aria-hidden="true"></div>`;
  $('#video_player .vjs-control-bar').append(zoomInBtn)
  $('#video_player .vjs-control-bar').append(zoomOutBtn)
  $('#video_player .vjs-control-bar').append(rotateBtn)
  videojs.registerComponent("MyButton", MyButton);
  const player = videojs("video_player");
  player.getChild("controlBar").addChild("myButton", {})
  player.ready(function () {
    player.volume(globalProperties.video.main.volume)
    player.tech_.off("dblclick");
  });
}


function videoJsSecondary(uid, pause) {
  if ($('#additional_overlay_video').length === 0) {
    const e = document.createElement("video");
    e.id = "additional_overlay_video";
    e.setAttribute("controlsList", "nodownload");
    e.setAttribute("controls", "");
    e.setAttribute("disablepictureinpicture", "");
    e.src = srcMap[uid]?.additional;
    e.autoplay = playAutoOnStart;
    e.muted = globalProperties.video.additional.muted;
    e.controls = true;
    $("#additional_video").append(e);
    $("#additional_video video").addClass('video-js vjs-default-skin');
    pause && e.pause();

    videojs("additional_overlay_video", {
      autoplay: playAutoOnStart,
      preload: 'auto',
      controlBar: {
        fullscreenToggle: !1,
        volumePanel: {inline: false}
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
        const videoContainer = document.getElementById('video_container');
        openFullscreen(videoContainer);
        $("#alt_view_wrapper").css({top: '10px', left: 'auto', right: '10px'});
      },
    })
    videojs.registerComponent("MyButton", MyButton);

    const player2 = videojs('additional_overlay_video');
    const rotateBtn = `<div onclick="rotateAdditionalVideo('additional_overlay_video_html5_api')" class="glyphicon glyphicon-refresh" aria-hidden="true"></div>`;
    const zoomInBtn = `<div onclick="zoomInMain(altVid)" class="glyphicon glyphicon-zoom-in" aria-hidden="true"></div>`;
    const zoomOutBtn = `<div onclick="zoomOutMain(altVid)" class="glyphicon glyphicon-zoom-out" aria-hidden="true"></div>`;
    $('#additional_video .vjs-control-bar').append(zoomInBtn)
    $('#additional_video .vjs-control-bar').append(zoomOutBtn)
    $('#additional_video .vjs-control-bar').append(rotateBtn)
    player2.getChild("controlBar").addChild("myButton", {})
    player2.ready(function () {
      altView(true);
      playPromise(player2);
      player2.volume(globalProperties.video.additional.volume)
      player2.tech_.off("dblclick");
    });
    isSecondaryVideoReady();
  } else {
    const currentPlayer = videojs('additional_overlay_video');
    currentPlayer.src(srcMap[uid]?.additional);
    altView(true);
    isSecondaryVideoReady();
  }
}


function altView(isSecondaryExists) {
  if (!gpxData) {
    return;
  }
  if (!isSecondaryExists) {
    !document.fullscreenElement && $('#alt_view_wrapper').hide();
  } else {
    $('#alt_view_wrapper').show();
  }
  if ($('#main_view_wrapper #additional_video').length) {
    swapNodes('#additional_video', '#video_player');
  }
  $('#alt_view_wrapper #alt_options_opened_view').css('visibility', 'visible');
  if (document.fullscreenElement) {
    const first = $('#alt_view_wrapper #alt_view').children()[0];
    if ($('#additional_video video').length === 0) {
      $('#map').show();
      $(first).show();
      $('.glyphicon.glyphicon-random').hide();
    } else {
      $('.glyphicon.glyphicon-random').show();
      //$(first).hide();
    }
  } else {
    $('#additional_video').show();
  }
  addCustomFullScreen();
}

function gpxTimeConverter(time) {
  const timeInSec = get_seconds(time);
  const diff = timeInSec - timeOffset
  return secondsToHms(diff <= 0 ? 24 * 3600 + diff : diff)
}

function updateCharts(time) {
  let gpxDataValue = gpxData;
  if (!traineeMode) {
    gpxDataValue = gpxData[0]
  }
  // chartSetObjects comes from chartStats.js
  for (const chart in chartSetObjects) {
    if (chartSetObjects.hasOwnProperty(chart)) {
      if (gpxDataValue[time]) {
        !!chartSetObjects[chart] && chartSetObjects[chart].setSelection([{row: gpxDataValue[time].index, column: 1}]);
      } else {
        !!chartSetObjects[chart] && chartSetObjects[chart].setSelection([]);
      }
    }
  }
}

function getGpxData(time) {
  const timeWithOffset = gpxTimeConverter(time);
  if (trainSection !== '0' && trainSection !== 'None') {
    // approximation for gpx times
    if (gpxData && gpxData[timeWithOffset]) {
      if (time !== "00:00:00") {
        updateCharts(timeWithOffset);
      }
      return gpxData[timeWithOffset]
        ?? gpxData[secondsToHms(get_seconds(timeWithOffset) - 1)]
        ?? gpxData[secondsToHms(get_seconds(timeWithOffset) + 1)]
    } else {
      return {
        speed: "--",
        direction: "--",
        heel: "--",
        time: "00:00:00"
      }
    }
  } else {
    // approximation for gpx times
    if (gpxData && gpxData[gpxData.length - 1][timeWithOffset]) {
      if (time !== "00:00:00") {
        updateCharts(timeWithOffset);
      }
      return gpxData[gpxData.length - 1][timeWithOffset]
        ?? gpxData[gpxData.length - 1][secondsToHms(get_seconds(timeWithOffset) - 1)]
        ?? gpxData[gpxData.length - 1][secondsToHms(get_seconds(timeWithOffset) + 1)]
    } else {
      return {
        speed: "--",
        direction: "--",
        time: "00:00:00"
      }
    }
  }
}

function favoriteMap() {
  const fav = srcMap
    .filter(el => el.isFavorite === 'True')
    .map(el => el.uid)
  const index = fav.findIndex(el => el === activeVideo);
  if (index <= 0) {
    $(".arrow.left").css("opacity", 0.5).attr("disabled", true);
    $(".arrow.right").css("opacity", 1).attr("disabled", false);
  } else if (index >= fav.length - 1) {
    $(".arrow.left").css("opacity", 1).attr("disabled", false);
    $(".arrow.right").css("opacity", 0.5).attr("disabled", true);
  } else {
    $(".arrow.left").css("opacity", 1).attr("disabled", false);
    $(".arrow.right").css("opacity", 1).attr("disabled", false);
  }
  favoritesBounds = [index, fav];
}

// 'NEXT' button click handler:
document.querySelector(".next").addEventListener("click", function () {
  fix = 0;
  if (showOnlyFavorite) {
    const [index, fav] = favoritesBounds
    if (index === -1 && activeVideo > fav[fav.length - 1]) {
      videoPlay(fav[index - 1]);
    } else {
      videoPlay(fav[index + 1]);
    }
  } else {
    videoPlay(++activeVideo);
  }

});

// 'PREVIOUS' button click handler:
document.querySelector(".previous").addEventListener("click", function () {
  fix = 0;
  if (showOnlyFavorite) {
    const [index, fav] = favoritesBounds
    if (index === -1 && activeVideo > fav[fav.length - 1]) {
      videoPlay(fav[fav.length - 1]);
    } else {
      videoPlay(fav[index - 1]);
    }
  } else {
    videoPlay(--activeVideo);
  }
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
  .on("click", async () => {
    if (secFrame < overall_duration) {
      xScaleRefresh();
      if (secStart >= 0 && secEnd < overall_duration) {
        secEnd = secEnd + zoomStep;
        secFrame = secFrame + zoomStep;
        updateBoundTimes('', secEnd);
        updated_annotated_myBar(activeVideo);
        updateStorage({secEnd, secFrame, xScale});
        await filterDataRange()
      } else if (secStart >= 0 && secEnd === overall_duration) {
        secStart = secStart - zoomStep < 0 ? 0 : secStart - zoomStep;
        secFrame = secFrame + zoomStep;
        secStart === 0 && (activeStep = 0);
        updateBoundTimes(secStart, '');
        updated_annotated_myBar(activeVideo);
        updateStorage({secStart, secFrame, xScale})
        await filterDataRange()
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
  .on("click", async () => {
    if (secFrame > minZoomInValue) {
      xScaleRefresh();
      secEnd = secEnd - zoomStep < minZoomInValue ? minZoomInValue : secEnd - zoomStep;
      secFrame = secFrame - zoomStep;
      $("#my_append").text(secondsToHms(secEnd));
      updateBoundTimes('', secEnd);
      updated_annotated_myBar(activeVideo);
      updateStorage({secEnd, secFrame, xScale});
      await filterDataRange()
    } else {
      $("#zoom_in").css({cursor: "not-allowed", color: "silver"});
    }
  });

//  ---- Time Shift Left Handler ---- //

async function shiftLeft(multiplier = 1) {
  if (secStart > 0) {
    const shift = shiftStep * multiplier
    secStart = secStart > shift ? secStart - shift : 0;
    secEnd = secEnd > minZoomInValue + shift ? secEnd - shift : minZoomInValue;
    activeStep = secStart === 0 ? 0 : activeStep + shift;
    updateBoundTimes(secStart, secEnd);
    updated_annotated_myBar(activeVideo);
    $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
    updateStorage({secEnd, secStart, activeStep});
    await filterDataRange()
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

async function shiftRight(multiplier = 1) {
  if (secEnd <= overall_duration - shiftStep) {
    const shift = shiftStep * multiplier;
    secStart = secStart <= overall_duration - minZoomInValue ? secStart + shift : 0;
    secEnd = secEnd + shift;
    activeStep = activeStep - shift;
    updateBoundTimes(secStart, secEnd);
    updated_annotated_myBar(activeVideo);
    $("#my_inner_bar").css("transform", `translateX: (${activeStep * xScale})`);
    updateStorage({secEnd, secStart, activeStep});
    await filterDataRange()
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
  .on("click", async () => {
    await shiftRight();
  });

// Media-Ended event-listener:
myVideoPlayer.addEventListener("ended", function () {
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
myVideoPlayer.addEventListener("timeupdate", async function () {
  if (myVideoPlayer.currentTime) {
    const currentSec = srcMap[activeVideo].seconds.start + myVideoPlayer.currentTime
    const time = secondsToHms(srcMap[activeVideo].seconds.start + myVideoPlayer.currentTime);
    showTimer(time);
    const timeStart = srcMap[activeVideo]?.seconds.time_start
    const diffStart = currentSec - secStart;
    const diffEnd = currentSec - secEnd;
    if (srcBoundsMarkers[findIndexByUid(activeVideo)] && diffEnd > 0) {
      fix = srcBoundsMarkers[findIndexByUid(activeVideo)]?.width;
      srcBoundsMarkers[findIndexByUid(activeVideo)].cond === '5_2' && await shiftRight(1);
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
$(document).on("mouseenter", "span[data-id]", function () {
  const index = +$(this).attr("data-id");
  const src = srcMap[index].src;
  const time = `(${srcMap[index].time.start}, ${srcMap[index].time.end})`;
  const tooltip = srcMap[index].tooltip;
  const realtime = srcMap[index].time.duration
  const isFavorite = srcMap[index].isFavorite

  const hoverContent =
    "<div style='text-align:center; '>ID: " + eval(index + 1) + "</div>" +
    "<ul><li>" + src + "</li>" + "<li>RealTime=" + realtime + "</li>" + "<li>Time=" + time + "</li>" +
    "<li>ToolTip=" + tooltip + "</li>" +
    "<li>Is Favorite=" + isFavorite + "</li>" + "</ul>";

  $("#hoverData").html(hoverContent).show();
});

// ====== Hide hover on mouse out ========= //
$(document).on("mouseleave", "span[data-id]", function () {
  $("#hoverData").html("").hide();
});

// ==========  Enter to Fullscreen of main video player  ========== //
$(document).on("click", ".fullscreen-control", function () {
  $(".video_container").addClass("fullscreen-mode")
  $(this).addClass("exitfullscreen-control");
  $(this).removeClass("fullscreen-control");
  $('#fs_switch').addClass('glyphicon-resize-small');
});

$(document).on("click", "#fs_switch", function () {
  $(".video_container").addClass("fullscreen-mode")
  $(this).addClass("exitfullscreen-control");
  $(this).removeClass("fullscreen-control");
  $('#fs_switch').addClass('glyphicon-resize-small');
});

// ==========  Exit from Fullscreen of main video player  ========== //
$(document).on("click", ".vjs-fullscreen-control.exitfullscreen-control", function () {
  closeFullscreen();
});

// Firing full screen change events due that standard ESC event doesn't work as expected
if (document.addEventListener) {
  document.addEventListener('fullscreenchange', exitHandler);
  document.addEventListener('webkitfullscreenchange', exitHandler);
  document.addEventListener('mozfullscreenchange', exitHandler);
  document.addEventListener('MSFullscreenChange', exitHandler);
}

// ============ //
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

window.addEventListener("resize", debounce(updated_annotated_myBar, 250));

async function pointToEvent(uid) {
  if (secStart > srcMap[uid]?.seconds?.start) {
    const multiStep = Math.trunc(secStart / shiftStep) -
      Math.trunc(srcMap[uid].seconds.start / shiftStep)
    shiftLeft(multiStep)
  }
  if (secEnd < srcMap[uid]?.seconds?.start) {
    const multiStep =
      Math.trunc(srcMap[uid].seconds.start / shiftStep) -
      Math.trunc(secStart / shiftStep)
    await shiftRight(multiStep)
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
})


function interactiveInit(id) {
  let initialWidth = $(id).width();
  if ($(id)) {
    $.noConflict(true);

    $(id).resizable({
      handles: "n, s, w, e, sw, se, nw, ne",
      aspectRatio: globalProperties.video.additional.aspectRatio,
      minHeight: 150,
      containment: globalProperties.video.additional.containment ? "#main_view_wrapper" : '',
      minWidth: 207,
      start: (_) => {
        $('#alt_view').css("border", "1px white dotted");
        $('#alt_view .vjs-tech').css("position", "relative");
      },
      resize: (_, ui) => {
        initialWidth = ui.size.width;
        if ($('#alt_view #map').is(":hidden")) {
          $('#alt_view video').height(ui.size.height);
          $('#alt_view video').width(ui.size.width);
        } else {
          $('#alt_view #map').height(ui.size.height);
          $('#alt_view #map').width(ui.size.width);
        }
      },
      stop: (_) => {
        $('#alt_view').css("border", "0");
      }
    });

    $(id).draggable({
      containment: globalProperties.video.additional.containment ? "#main_view_wrapper" : '',
      start: () => {
        $(id).width(initialWidth);
        $(id).css('cursor', 'move');
      },
    });
  }
}

function showTimer(time) {
  const rightBound = $("#right_control").offset()?.left - $("#timer").offset()?.left;
  $("#timer").text(time);
  if (rightBound && rightBound < 60) {
    $("#timer").css('left', '-40px')
  }
}

function changeRouteColor(color) {
  if (!highlightGpxRoute) {
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
    $("#sep").remove();
    $("#sep_time").remove();
    overTheBar = false;
    // hide selection on the graphs
    updateCharts('');
  })
}

function cursorMove(e) {
  let offset = e.clientX - $("#my_inner_bar").offset().left;
  offset = 0 > offset ? 0 : offset >= $("#my_inner_bar").width() ? $("#my_inner_bar").width() : offset;
  const offsetInTime = secondsToHms(pixelToSecond(offset))
  const p2sec = pixelToSecond(offset) + srcMap[0]?.seconds?.time_start - srcMap[0]?.seconds.start;
  const p2secInHours = secToHours(p2sec)
  const p2secInHours_disp = secToHours(p2sec + srcMap[0]?.seconds.tz_offset)
  if ($("#sep")) {
    $("#sep").css('left', offset + leftMargin + 7);
    $("#sep_time").css({left: offset + leftMargin + 7, whiteSpace: 'nowrap'});
    $("#sep_time").text(offsetInTime + " | " + p2secInHours_disp);
    displayGpxParameters(p2secInHours)
  }
  highlightRoute(p2secInHours);
}


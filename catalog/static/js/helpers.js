function getColorByIndex(indexString) {
    let color;
    switch (indexString) {
        case "(1)":
            color = "DarkRed";
            break;
        case "(2)":
            color = "DarkGreen";
            break;
        case "(3)":
            color = "DarkBlue";
            break;
        case "(4)":
            color = "DarkMagenta";
            break;
        case "(5)":
            color = "DarkCyan";
            break;
        case "(6)":
            color = "LightGray";
            break;
        case "(7)":
            color = "DarkGray";
            break;
        case "(8)":
            color = "Red";
            break;
        case "(9)":
            color = "Green";
            break;
        case "(10)":
            color = "Yellow";
            break;
        case "(11)":
            color = "Blue";
            break;
        case "(12)":
            color = "Magenta";
            break;
        default:
            color = "Black";
            break;
    }
    return color;
}

function get_seconds(e) {
    if (!e) {
        return 0;
    }
    const t = e.split(":");
    return 60 * +t[0] * 60 + 60 * +t[1] + +t[2];
}

function radians_to_degrees(radians) {
    const pi = Math.PI;
    return radians * (180 / pi);
}

function secondsToHms(e) {
    if (!e) {
        return "00:00:00";
    }
    e = Number(e);
    const t = Math.floor(e / 3600),
        a = Math.floor((e % 3600) / 60),
        o = Math.floor((e % 3600) % 60);
    return ("0" + t).slice(-2) + ":" + ("0" + a).slice(-2) + ":" + ("0" + o).slice(-2);
}

function secToHours(str) {
    if (!str) {
        return "00:00:00"
    }
    const sec_num = parseInt(str, 10); // don't forget the second param
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
}

function hmsToSecondsOnly(str) {
    if (!str) {
        return 0;
    }
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}

function getStorageGpxState() {
    const gpx = JSON.parse(localStorage.getItem('GPXState'));
    if (!gpx) {
        localStorage.setItem("GPXState", JSON.stringify(null));
    }
    return JSON.parse(localStorage.getItem('GPXState'));
}

function updateStorageGpxState(objProp) {
    const currentState = getStorageGpxState() || {};
    const newState = {...currentState, ...objProp};
    localStorage.setItem("GPXState", JSON.stringify(newState));
}

function getStorageState() {
    return JSON.parse(localStorage.getItem('currentState'));
}

function updateStorage(objProp) {
    const currentState = getStorageState();
    const newState = {...currentState, ...objProp};
    localStorage.setItem("currentState", JSON.stringify(newState));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function colourNameToHex(colour) {
    const colours = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c",
        "indigo": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgrey": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370d8",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#d87093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "rebeccapurple": "#663399",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32"
    };

    if (typeof colours[colour.toLowerCase()] != 'undefined')
        return colours[colour.toLowerCase()];

    return false;
}

function hexToRGBA(h, a) {
    let r = 0, g = 0, b = 0;

    // 3 digits
    if (h.length === 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

        // 6 digits
    } else if (h.length === 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }

    return `rgba(${r},${g},${b},${a})`;
}

async function cacheUpdate(ctx, func) {
    let gpxCached = getStorageGpxState()?.gpxData
    let newGpxCache = {};
    const isGpxPresentInCache = getStorageGpxState()?.hasOwnProperty('gpxData');
    if (!isGpxPresentInCache) {
        console.log('Call for retrieving GPX data from server')
        gpxData = await func.call(ctx);
        if (trainSection !== 'None') {
            newGpxCache = {
                [trainingID]: {
                    [trainSection]: gpxData
                }
            }
        }
        updateStorageGpxState({gpxData: newGpxCache})
    } else {
        if (trainingID && trainSection) {
            const isID = getStorageGpxState().gpxData.hasOwnProperty(trainingID);
            if (isID && trainingID !== 'None') {
                const isSelId = isID && getStorageGpxState().gpxData[trainingID].hasOwnProperty(trainSection);
                if (!isSelId && trainSection !== 'None') {
                    console.debug(`New Training ID: ${trainingID}, Athlete ID: ${trainSection} has retrieved from SERVER`);
                    gpxData = await func.call(ctx);
                    newGpxCache[trainingID] = {...gpxCached[trainingID], ...{[trainSection]: gpxData}}
                } else {
                    console.debug(`This Athlete ID: ${trainSection} from Train ID: ${trainingID} has retrieved from CACHE`);
                    gpxData = gpxCached[trainingID][trainSection];
                }
            } else {
                if (trainSection !== 'None' && trainingID !== 'None') {
                    console.debug(`No training ID ${trainingID} in the cache, so retrieve new data from SERVER`);
                    gpxData = await func.call(ctx);
                    newGpxCache[trainingID] = {
                        [trainSection]: gpxData
                    }
                }
            }
            updateStorageGpxState({gpxData: {...gpxCached, ...newGpxCache}})
        }
    }
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
}

function throttle(func, timeFrame) {
    var lastTime = 0;
    return function () {
        var now = new Date();
        if (now - lastTime >= timeFrame) {
            func();
            lastTime = now;
        }
    };
}

function isFullscreen(element) {
    return (
        (document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement) === element
    );
}

function requestFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullScreen) {
        element.msRequestFullScreen();
    }
}

function openFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
    sleep(300).then(() => {
        showMetaBarInFullScreen();
        showAltViewFullScreen();
    })
}

function closeFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen()
            .then(() => console.log("Document Exited from Full screen mode"))
            .catch((err) => console.error(err))
    }
    sleep(300).then(() => {
        swapNodes($('#main_view_wrapper').children()[0], $('#alt_view').children()[0]);
        onCloseFullScreen();
    });
}

function onCloseFullScreen() {
    hideAltViewFullScreen();
    hideMetaBarInFullScreen();
    hideTimeLineInFullScreen();
    defaultViewSettings();
}

function showAltViewFullScreen() {
    if (!srcMap[activeVideo]?.additional) {
        $('#alt_view_wrapper').show();
        $('.glyphicon.glyphicon-random').hide();
        swapNodes($('#alt_view').children()[0], $('#map_container').children()[0]);
    } else {
        $('.glyphicon.glyphicon-random').show();
    }
}

function hideAltViewFullScreen() {
    if (!srcMap[activeVideo]?.additional) {
        $('#alt_view_wrapper').hide();
    }
}

function showMetaBarInFullScreen() {
    $('.video_container.fullscreen-mode').append($('#meta'));
}

function showTimeLineInFullScreen() {
    $('#new_slider').appendTo('.video_container.fullscreen-mode');
    updated_annotated_myBar();
}

function hideTimeLineInFullScreen() {
    $('.slider_container #filter_events_block').before($('#new_slider'));
    updated_annotated_myBar();
}

function hideMetaBarInFullScreen() {
    $('.slider_container').prepend($('#meta'));
    $('.video_container').remove('#meta');
}

function defaultViewSettings() {
    if (!srcMap[activeVideo].additional) {
        $('.glyphicon.glyphicon-random').hide();
    } else {
        $('.glyphicon.glyphicon-random').show();
    }
    if ($('#main_view_wrapper #map').length > 0) {
        console.log(1)
        swapNodes($('#main_view_wrapper').children()[0], $('#map_container').children()[0]);
    }
    if ($('#alt_view #map').length > 0) {
        console.log(2)
        swapNodes($('#map_container').children()[0], $('#alt_view').children()[0]);
    }
    if ($('#main_view_wrapper #additional_video video').length > 0) {
        console.log(3)
        swapNodes($('#main_view_wrapper').children()[0], $('#alt_view').children()[0]);
    }
    if ($('#map_container #additional_video video').length) {
        console.log('4')
        swapNodes($('#map_container').children()[0], $('#alt_view').children()[0]);
    }
    // fsMapActive && swapNodes($('#alt_view').children()[0], $('#map_container').children()[0])
    $('.vjs-fullscreen-control').removeClass("exitfullscreen-control");
    $('.vjs-fullscreen-control').addClass("fullscreen-control");
    $('.video_container').removeClass("fullscreen-mode");
    $('#fs_switch').removeClass('glyphicon-resize-small');
    $('#fs_switch').removeClass('exitfullscreen-control');
    $("#alt_view_wrapper").css({top: '10px', left: 'auto', right: '10px'});
}

function exitHandler() {
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
        closeFullscreen();
    }
}

function swapNodes(a, b) {
    a = $(a);
    b = $(b);
    const tmp = $('<span>').hide();
    a.before(tmp);
    b.before(a);
    tmp.replaceWith(b);
}

function visibilityToggle(element) {
    $(element).css('visibility',
        $(element).css('visibility') === 'visible' ? 'hidden' : 'visible');

}

function swapContent() {
    if (srcMap[activeVideo]?.additional !== null
        && $('#alt_view video')?.length !== 0
        && $('#main_view_wrapper video')?.length !== 0
    ) {
        swapVideos();
        alignAltViewWrapper();
    } else {
        fsMapActive = !fsMapActive;
        swapMapAndVideoMainView();
    }
    toggleTimeLineFS();
}

function toggleTimeLineFS() {
    if ($('#main_view_wrapper #map')?.length > 0) {
        showTimeLineInFullScreen();
    } else {
        hideTimeLineInFullScreen();
    }
}

function swapVideos() {
    swapNodes('#additional_video', '#video_player')
}

function swapMapAndNonFullScreen() {
    swapNodes($('#main_view_wrapper').children()[0], $('#map_container').children()[0]);
}

function swapMapAndVideoMainView() {
    swapNodes($('#main_view_wrapper').children()[0], $('#alt_view').children()[0]);
    $('#main_view_wrapper #video_player').show();
    $('#main_view_wrapper #map').show();
    $('#main_view_wrapper #additional_video').show();
}

function swapAltViewContent() {
    if (!$('#additional_video video').length) {
        return;
    }
    const first = $('#alt_view').children()[0];
    const second = $('#map_container').children()[0];
    swapNodes(first, second)
    alignAltViewWrapper();
}

function toggleAltView() {
    $('#alt_view').toggle();
    $('#alt_options_opened_view').toggle();
    visibilityToggle('#alt_options_collapsed_view');
    if (document.fullscreenElement) {
        updateAltViewPosition();
    }
}

function updateAltViewPosition() {
    $("#alt_view_wrapper").css({top: '10px', left: 'auto', right: '10px'});
}

function addCustomFullScreen() {
    const span = `<span id="fs_switch" class="glyphicon glyphicon-resize-full"></span>`
    $('#fs_switch').length === 0 && $('#map').append(span);
    if ($('#additional_video video').length === 0) {
        $('#fs_switch').show();
    }
    $('#fs_switch').on('click', function () {
        if (!document.fullscreenElement) {
            $(this).toggleClass('glyphicon-resize-small');
            $(".video_container").addClass("fullscreen-mode")
            $('.fullscreen-control').addClass("exitfullscreen-control");
            $('.fullscreen-control').removeClass("fullscreen-control");
            openFullscreen(document.getElementById('video_container'));
        } else {
            $(this).toggleClass('glyphicon-resize-small');
            sleep(100).then(() => {
                swapNodes($('#alt_view').children()[0], $('#map_container').children()[0])
            });
            closeFullscreen();
        }

    })
}

function alignAltViewWrapper() {
    $("#alt_view #map").removeAttr("style");
    updateRouteMarker(activeVideo)
}

function rotateMainVideo(id) {
    rotationMain -= 90;
    const vId = videojs(id);
    vId.zoomrotate({
        rotate: rotationMain,
        zoom: 1
    });
}

function isSecondaryVideoReady() {
    const secondaryVideo = videojs('additional_overlay_video');
    secondaryVideo.ready(function () {
        sleep(200).then(() => videojs('video_player').play());
    })
}

function rotateAdditionalVideo(id) {
    rotationAdditional -= 90;
    const vId = videojs(id);
    vId.zoomrotate({
        rotate: rotationAdditional,
        zoom: 1
    });
}

function videoSecondaryReload() {
    videojs('additional_overlay_video').pause();
    videojs('additional_overlay_video').load();
    videojs('additional_overlay_video').play();
}

function toggleMute() {
    videojs("video_player").muted(!videojs("video_player").muted());
    videojs("additional_overlay_video").muted(!videojs("additional_overlay_video").muted());
}

function toggleComments() {
    if ($('.comments_header1 .comments_block')[0].innerText.length > 45) {
        swapNodes(
            $('.training_subheader.comments_header1').children()[2],
            $('.training_subheader.comments_header2').children()[0]
        );
    }
}

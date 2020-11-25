/**
 * @file Contains the logic and all functions used for making of Custom Video Player
 * @author Jay Kapoor <jatinkapoor995@gmail.com>
 * @version 0.0.1
 * All rights reserved to Shahar Gino, June 2020
 */

// Get elements:
var myVideoPlayer = document.getElementById("video_player");
var mp4source = document.getElementById("mp4source");
var progress = document.getElementById("zoom-out-bar");
var zoom_in_progress = document.getElementById("zoom-in-progress");
var style = document.querySelector('[data="slide-width"]');

// Get marker/slider variables:
overall_duartion = get_seconds(overall_duartion);  // defined in HTML
marker_position = get_seconds(marker_position);    // defined in HTML
marker_width = get_seconds(marker_width);          // defined in HTML

var marker_end_position = parseInt(marker_width) + parseInt(marker_position);
var slider_width = Math.floor(marker_width / overall_duartion * 100);
style.innerHTML = ".slider::-webkit-slider-thumb { width: " + slider_width + "% !important; }";

// --------------------------------------------------------------------------------------------------------

// Foreach media source, populate the corresponding Marker variables:
var Total_duration = 0;
var prev_duration = 0;
var vids = [];
var start_count = [];
var end_count = [];
var Src = [];
var ToolTip = [];
var Time = [];
var count = 0;
var sourceDuration = [];
var additionalArray = [];
var prev_end = 0;
var maskedArray = []

for (let [e, t] of Object.entries(sources)) {

    var extension = t.name.split(/[#?]/)[0].split(".").pop().trim();

    if ("mp4" == extension || "ogg" == extension || "m4a" == extension) {

        if (t.start < prev_end) {
            continue;
        }

        var span = document.createElement("span");
        span.classList = "zoom-in-span";
        span.setAttribute("source", t.name);
        
        Time[count] = "(" + t.start + "," + t.end + ")";
        
        var start = get_seconds(t.start);
        var end = get_seconds(t.end);

        start_count[count] = start; 
        end_count[count] = end;
        
        Src[count] = t.name;
        
        ToolTip[count] = t.tooltip;
        
        if (t.additional != null) { 
            additionalArray[t.name] = t.additional;
        }
        
        count++;
        
        Total_duration += end - start;
        sourceDuration.push(end - start);
        vids.push(t.name)

        prev_end = t.end;
    }
}

// --------------------------------------------------------------------------------------------------------

var old_d = 0;

function updated_annotated_bar() {

    // Find first media stream (assume sorted):
    var ac = 0;
    var start_count_length = start_count.length;
    for (var i = 0; i < start_count_length; i++) {
        if (start_count[i] > marker_position) {
            ac = i;
            break;
        }
    }

    // Init annotated bar:
    $("#annotated_bar").replaceWith('<div id="annotated_bar"></div>');
    
    // For each time-index ("count"), create either an active-marker or a gap:
    var active_flag = false;
    var localposition = 0;
    var active_count = -1;
   
    for (var i = marker_position ; i <= marker_end_position; i++) {
    
        if (start_count[ac] == i) {
            active_flag = true;
            active_count++;
        }
        if (active_flag) {
            var color = 'Black';
            var color_idx_arr = ToolTip[ac].match(/(\(\d+\))+/g);
            var color_idx = color_idx_arr[0];
            switch (color_idx) {
                case '(1)':   color = 'DarkRed'; break;
                case '(2)':   color = 'DarkGreen'; break;
                case '(3)':   color = 'DarkBlue'; break;
                case '(4)':   color = 'DarkMagenta'; break;
                case '(5)':   color = 'DarkCyan'; break;
                case '(6)':   color = 'LightGray'; break;
                case '(7)':   color = 'DarkGray'; break;
                case '(8)':   color = 'Red'; break;
                case '(9)':   color = 'Green'; break;
                case '(10)':  color = 'Yellow'; break;
                case '(11)':  color = 'Blue'; break;
                case '(12)':  color = 'Magenta'; break;
            }
            var color_style = 'background: ' + color;
            if (color_idx_arr.length == 2) {
                color_style += '; background-image: linear-gradient(' + color + ',Black);';
            }
            if (maskedArray.includes(active_count.toString())) {
                color_style += '; opacity: 0.5;'
            }
            jQuery("#annotated_bar").append('<span style="' + color_style + '" class="bar marker ' + Src[ac].substring(Src[ac].lastIndexOf("/") + 1).replace(/\./g, "_") +
                                                '" data-src="' + Src[ac] + 
                                                '" data-active-count="' + active_count + 
                                                '" data-position="' + i + 
                                                '" data-local-position="' + localposition + 
                                                '" data-time="' + Time[ac] + 
                                                '" data-tooltip="' + ToolTip[ac] +
                                            '"></span>');
        }
        else {
            jQuery("#annotated_bar").append('<span class="bar gap" data-position="' + i + '"></span>');
        }
        
        if (active_flag && (end_count[ac] == i)) {
            active_flag = false
            ac++;
            if (start_count[ac] == i) {
                active_flag = true;
            }
        }
        if (active_flag) {
            localposition++;
        }
    }
}

updated_annotated_bar();

// --------------------------------------------------------------------------------------------------------

var activeVideo = 0;

// 'NEXT' button click handler:
document.querySelector(".next").addEventListener("click", function() {

    if ($(this).css("opacity") == "0.5") {
        return;
    }

    myVideoPlayer.autoplay = true;

    // Primary Media:
    $(".marker").removeClass("active_index");
    do {
        activeVideo = ++activeVideo % vids.length;
        var htmlCollection = document.getElementsByClassName('bar marker');
        var arr = Array.from(htmlCollection).filter(el => parseInt(el.dataset.activeCount) === activeVideo);
    }
    while (arr[0].style.opacity == "0.5");

    old_d += myVideoPlayer.duration;
    if (activeVideo == 0) {
        old_d = 0;
    }
    myVideoPlayer.src = vids[activeVideo];
    
    // Secondary Media:
    $("#additional_overlay_video").remove();
    if (additionalArray[vids[activeVideo]] != null) {

        var e = document.createElement("video");
        e.id = "additional_overlay_video";
        e.setAttribute("controlsList", "nodownload");
        e.setAttribute("controls", "");
        e.setAttribute("disablepictureinpicture", "");
        e.src = additionalArray[vids[activeVideo]];
        e.autoplay = true;
        e.controls = true;
        $("#additional_video").append(e);
    } 
});

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

// 'PREVIOUS' button click handler:
document.querySelector(".previous").addEventListener("click", function() {

    if ($(this).css("opacity") == "0.5") {
        return;
    }

    myVideoPlayer.autoplay = true;

    // Primary Media:
    $("#additional_overlay_video").remove();
    $(".marker").removeClass("active_index");
    old_d -= myVideoPlayer.duration;
    if (old_d <= 0) {
        old_d = 0;
    }
    do {
        activeVideo = --activeVideo % vids.length;
        var htmlCollection = document.getElementsByClassName('bar marker');
        var arr = Array.from(htmlCollection).filter(el => parseInt(el.dataset.activeCount) === activeVideo);
    }
    while (arr[0].style.opacity == "0.5");

    if (activeVideo < 0) {
        activeVideo = vids.length - 1;
    }
    myVideoPlayer.src = vids[activeVideo];

    // Secondary Media:
    if (additionalArray[vids[activeVideo]] != null) {

        var e = document.createElement("video");
        e.id = "additional_overlay_video";
        e.setAttribute("controlsList", "nodownload");
        e.setAttribute("controls", "");
        e.setAttribute("disablepictureinpicture", "");
        e.src = additionalArray[vids[activeVideo]];
        e.autoplay = true;
        e.controls = true;
        $("#additional_video").append(e);
    }
});

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

// Marker button click handler:
$(document).on("click", "span.marker", function() {

    var $this = $(this);

    // Double click:
    if ($this.hasClass('clicked')){
        $this.removeClass('clicked');

        var e = $(this).data("src");
        var t = e.substring(e.lastIndexOf("/") + 1).replace(/\./g, "_");
        var o = document.getElementsByClassName(t)[0].getAttribute("data-active-count");
        var htmlCollection = document.getElementsByClassName('bar marker');
        var arr = Array.from(htmlCollection).filter(el => el.dataset.activeCount === o);

        if (maskedArray.includes(o)) {
            const index = maskedArray.indexOf(o);
            if (index > -1) {
                maskedArray.splice(index, 1);
            }
        }
        else {
            maskedArray.push(o);
        }

        arr.forEach(function(el) {
            if (el.style.opacity == "0.5") {
                el.style.opacity = "1.0";
            }
            else {
                el.style.opacity = "0.5";
            }
        });
    }

    // Single click:
    else {
        $this.addClass('clicked ');
        setTimeout(function() {
            if ($this.hasClass('clicked')){
                $this.removeClass('clicked');

                if ($this.css("opacity") == "0.5") {
                    return;
                }

                myVideoPlayer.autoplay = true;

                $("#additional_overlay_video").remove();
                $(".marker").removeClass("active_index");
                myVideoPlayer.src = $this.data("src");

                var e = $this.data("src");
                var t = e.substring(e.lastIndexOf("/") + 1).replace(/\./g, "_");
                var a = document.getElementsByClassName(t)[0].getAttribute("data-local-position");
                var o = document.getElementsByClassName(t)[0].getAttribute("data-active-count");

                activeVideo = parseInt(o);
                old_d = a;

                if (additionalArray[e] != null) {

                    var r = document.createElement("video");
                    r.id = "additional_overlay_video";
                    r.setAttribute("controlsList", "nodownload");
                    r.setAttribute("controls", "");
                    r.setAttribute("disablepictureinpicture", "");
                    r.src = additionalArray[e];
                    r.autoplay = true;
                    r.controls = true;
                    $("#additional_video").append(r);
                }
                else {

                    $("#additional_overlay_video").remove();
                }
            }
        }, 300);
    }
});

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

// Media-Ended event-listener:
myVideoPlayer.addEventListener("ended", function(e) {

    if ($(this).css("opacity") == "0.5") {
        return;
    }

    this.autoplay = false;

    $(".marker").removeClass("active_index");
    $("#additional_overlay_video").remove();
    old_d += myVideoPlayer.duration;

    do {
        activeVideo = ++activeVideo % vids.length;
        var htmlCollection = document.getElementsByClassName('bar marker');
        var arr = Array.from(htmlCollection).filter(el => parseInt(el.dataset.activeCount) === activeVideo);
    }
    while (arr[0].style.opacity == "0.5");

    if (activeVideo == 0) {
        old_d = 0;
    }
    myVideoPlayer.src = vids[activeVideo];
    
    if (additionalArray[vids[activeVideo]] != null) {

        var t = document.createElement("video");
        t.id = "additional_overlay_video";
        t.setAttribute("controlsList", "nodownload");
        t.setAttribute("controls", "");
        t.setAttribute("disablepictureinpicture", "");
        t.src = additionalArray[vids[activeVideo]];
        t.autoplay = false;
        t.controls = true;
        $("#additional_video").append(t);
    } 
    else {

        $("#additional_overlay_video").remove();
    }
});

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

var prepend_timeframe_zoom_out = "<span class='timeframe_zoom_out'>00:00:00</span>";
var append_timeframe_zoom_out = "<span class='timeframe_zoom_out'>" + secondsToHms(overall_duartion) + "</span>";
$("div.zoom-out-bar,.slider-outer-container").prepend(prepend_timeframe_zoom_out);
$("div.zoom-out-bar,.slider-outer-container").append(append_timeframe_zoom_out);

// --------------------------------------------------------------------------------------------------------

$(document).ready(function() {

    // Zoom-In click handler:
    $(document).on("click", ".zoom-in-span", function() {

        var e = $(this).attr("source");
        prev_duration = myVideoPlayer.duration;
        myVideoPlayer.pause();
        mp4source.setAttribute("src", e);
        myVideoPlayer.setAttribute("src", e);
        myVideoPlayer.load();
        myVideoPlayer.play();
        myVideoPlayer.addEventListener("loadedmetadata", function() {
            myVideoPlayer.duration;
        })
    })
});

// 'LoadMetaData' event listener:
myVideoPlayer.addEventListener("loadedmetadata", function() {

    progress.setAttribute("max", overall_duartion);
    zoom_in_progress.setAttribute("max", overall_duartion);
    
    if (activeVideo == 0) { $(".arrow.left").css("opacity", "0.5").attr("disabled", true);  }
    else                  { $(".arrow.left").css("opacity",   "1").attr("disabled", false); }
    
    var e = vids.length - 1;
    if (activeVideo == e) { $(".arrow.right").css("opacity", "0.5").attr("disabled", !0); }
    else                  { $(".arrow.right").css("opacity",   "1").attr("disabled", !1); }
}, false);


// --------------------------------------------------------------------------------------------------------

// Globals:
var index = 0;
var marker = "";
var current_video_player_src = myVideoPlayer.src.substring(myVideoPlayer.src.lastIndexOf("/") + 1).replace(/\./g, "_");

// Display Markers:
display_markers(false);

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

// Auxiliary Methods:
function get_seconds(e) {
    var t = e.split(":");
    return 60 * +t[0] * 60 + 60 * +t[1] + +t[2]
}

function secondsToHms(e) {
    e = Number(e);
    var t = Math.floor(e / 3600),
        a = Math.floor(e % 3600 / 60),
        o = Math.floor(e % 3600 % 60);
    return ("0" + t).slice(-2) + ":" + ("0" + a).slice(-2) + ":" + ("0" + o).slice(-2)
}

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

// 'TimeUpdate' event listener (invoked whenever the playing position of an audio/video has changed):
myVideoPlayer.addEventListener("timeupdate", function() {

    current_video_player_src = myVideoPlayer.src.substring(myVideoPlayer.src.lastIndexOf("/") + 1).replace(/\./g, "_");

    var obj = document.getElementsByClassName(current_video_player_src)[0];
    if (obj && obj.style.display == "none") {
        var e = $(".marker:visible").first().data("src");
        myVideoPlayer.src = e;
    }

    var t = myVideoPlayer.src;
    t = t.substring(t.lastIndexOf("/") + 1).replace(/\./g, "_");
    
    index = Math.floor(myVideoPlayer.currentTime);
    
    marker = document.getElementsByClassName(t);
    
    if (marker[index]) {
    
        $("." + t).removeClass("active_index");
        marker[index].classList.add("active_index");

        if (progress.getAttribute("max") === null) {
            progress.setAttribute("max", overall_duartion);
        }
        if (zoom_in_progress.getAttribute("max") === null) {
            zoom_in_progress.setAttribute("max", overall_duartion);
        }
        
        progress.value = $(".active_index").data("position");
        zoom_in_progress.value = $(".active_index").data("position");
            
        //$("div.slider-outer-container .timeframe_zoom_out").first().text(secondsToHms(progress.value));
    }
});

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

// Mouse-Hover on Marker handlers:
$(document).on("mouseenter", "span.bar.marker", function(e) {

    if ($(this).css("opacity") == "0.5") {
        return;
    }

    $src = $(this).data("src");
    $time = $(this).data("time");
    $tooltip = $(this).data("tooltip");

    // RealTime
    var realtime = '00:00:00';
    var base = new String($src).substring($src.lastIndexOf('/') + 1);
    if (base.lastIndexOf(".") != -1) {
        base = base.substring(0, base.lastIndexOf("."));
        realtime = new String(base).substring(base.lastIndexOf('_') + 1).replace(/\./g,':')
    }

    $("#hoverData").html("<ul><li>" + $src + "</li>" +
                             "<li>RealTime=" + realtime + "</li>" +
                             "<li>Time=" + $time + "</li>" +
                             "<li>ToolTip=" + $tooltip + "</li>" + 
                         "</ul>").show();
    /*
    $("#hoverData").css({
        top: e.pageY - 60,
        left: e.pageX + 10
    });
    */
});

$(document).on("mouseleave", "span.bar.marker", function() {

    if ($(this).css("opacity") == "0.5") {
        return;
    }

    $src = $(this).data("src");
    $time = $(this).data("time");
    $tooltip = $(this).data("tooltip");
    $("#hoverData").html("").hide();
});

// --------------------------------------------------------------------------------------------------------

// Video Player Integration:
videojs("video_player", {
    controlBar: {
        fullscreenToggle: !1
    }
});

var Button = videojs.getComponent("Button");

var MyButton = videojs.extend(Button, {
        constructor: function() {
            Button.apply(this, arguments);
            this.addClass("vjs-fullscreen-control");
            this.addClass("fullscreen-control");
        },
        handleClick: function() {}
    });

videojs.registerComponent("MyButton", MyButton);

var player = videojs("video_player");

player.getChild("controlBar").addChild("myButton", {});

player.ready(function() {
    player.tech_.off("dblclick")
}); 

$(document).on("click", ".fullscreen-control", function() {
    player.fluid(true);
    $(".video_container").addClass("fullscreen-mode");
    $(this).addClass("exitfullscreen-control");
    $(this).removeClass("fullscreen-control");
    $("#map").hide();
});

$(document).on("click", ".exitfullscreen-control", function() {
    player.fluid(false);
    $(".video_container").removeClass("fullscreen-mode");
    $(this).removeClass("exitfullscreen-control");
    $(this).addClass("fullscreen-control");
    $("#map").show();
});

// --------------------------------------------------------------------------------------------------------

function update_marker_position(e, t) {
    
    marker_position = e;
    marker_end_position = t;
}

// --------------------------------------------------------------------------------------------------------

// D3Range Slider Integration:
var sliderfg = createD3RangeSlider(0, overall_duartion, "#slider-container");

sliderfg.range(marker_position, marker_end_position);

function display_markers(o) {

    $("span.marker").hide();

    var prepend_timeframe = "<span class='timeframe'>" + secondsToHms(marker_position) + "</span>";
    var append_timeframe = "<span class='timeframe'>" + secondsToHms(marker_end_position) + "</span>";
    $("#annotated_bar .timeframe").eq(0).text(secondsToHms(marker_position));
    $("#annotated_bar .timeframe").eq(1).text(secondsToHms(marker_end_position));
    $("#annotated_bar").prepend(prepend_timeframe);
    $("#annotated_bar").append(append_timeframe);

    for ($i = marker_position; $i <= marker_end_position; $i++) {
        
        var r = $("span[data-position='" + $i + "']").attr("class");
            if (r != null) {
            r = r.replace("bar", "");
            r = r.replace("marker", "");
            r = r.replace("gap", "");
            r = r.trim();
            currentItem = r;
            if (r != "") {
                $("." + r).show();
            }
        }
    }

    if (o) {
        $(".marker").removeClass("active_index");
    }
    var i = $(".marker:visible").first().data("src");
    myVideoPlayer.src = i
}

sliderfg.onChange(function(e) {
    
    update_marker_position(e.begin, e.end);
    updated_annotated_bar();
    display_markers(true);
    d3.select("#range-label").text(secondsToHms(e.begin) + " - " + secondsToHms(e.end));
});


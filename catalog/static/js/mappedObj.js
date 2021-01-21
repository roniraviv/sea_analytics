/*
Object.filter = function( obj, predicate) {
    let result = {}, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key) && !predicate(obj[key])) {
            result[key] = obj[key];
        }
    }
    return result;
};


// ==================== //
let srcData = {}
let count = 0;

function getCurrentWidth() {
    return $("#time_line").width();
}

function getCurrentSecFrame() {
    return $("#time_line").width() / secFrame;
}

function secToPixel (t) {
    return t * getCurrentWidth() / (secEnd - secStart);
}

let prev = []
for (let k in sources) {
    const t = sources[k];
    const srcArray =  t.name.substring(1).split("/");
    const file = srcArray[srcArray.length-1];
    const extension = file.split(/[#?]/)[0].split(".").pop().trim();
    const fileName = file.substring(0, file.lastIndexOf("."));
    const fileNameArray = fileName.split("_");

    const fileStringSeparated = {
        filename: fileName,
        extension: extension,
        folder_main: srcArray[0],
        train_id: srcArray[1],
        person_type: srcArray[2],
        date: fileNameArray[fileNameArray.length-3],
        start: fileNameArray[fileNameArray.length-2],
        duration: fileNameArray[fileNameArray.length-1]
    }
    prev.push(t.end);

    const seconds = {
        time: fileStringSeparated.start.replace(/\./g, ":"),
        start: get_seconds(t.start),
        end: get_seconds(t.end),
        width: get_seconds(fileStringSeparated.duration.replace(/\./g, ":")),
        margin: count > 0 ? get_seconds(t.start) - get_seconds(prev[count-1]) : get_seconds(t.start)
    }

    const pixels = {
        start: secToPixel(seconds.start),
        end: secToPixel(seconds.end),
        width: secToPixel(seconds.width),
        margin: secToPixel(seconds.margin)
    }


    $("#time_line_inner_inner").append(`<div id="block_${count}"></div>`);
    $(`#block_${count}`)
        .width(pixels.width)
        .height(50)
        .css({ background: 'red', display: 'inline-block', 'margin-left': pixels.margin });


    const result = {
        uid: count,
        seconds,
        pixels,
        media: {
            src: t.name,
            extension: fileStringSeparated.extension,
            fileName: fileStringSeparated.filename,
        },
        time: {
            range: "(" + t.start + "," + t.end + ")",
            start: t.start,
            end: t.end,
            start_time: fileStringSeparated.start.replace(/\./g, ":"),
            duration: fileStringSeparated.duration.replace(/\./g, ":"),
        },
        meta: {
            tooltip: t.tooltip,
        },
        additional: t.additional || null,
    }
    srcData[count] = result
    count++;
}

console.log(srcData)
$("#right_shift").on('click', function() {
    activeStep = secToPixel(activeStep + shiftStep)
    $("#time_line_inner_inner").css("transform",`translateX(${activeStep }px)`)
})
$("#left_shift").on('click', function() {
    activeStep = secToPixel(activeStep - shiftStep)
    $("#time_line_inner_inner").css("transform",`translateX(${activeStep}px)`)
})
*/
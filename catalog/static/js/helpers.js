function getColorByIndex(indexString) {
    let color;
    switch (indexString) {
        case "(1)": color = "DarkRed"; break;
        case "(2)": color = "DarkGreen"; break;
        case "(3)": color = "DarkBlue"; break;
        case "(4)": color = "DarkMagenta"; break;
        case "(5)": color = "DarkCyan"; break;
        case "(6)": color = "LightGray"; break;
        case "(7)": color = "DarkGray"; break;
        case "(8)": color = "Red"; break;
        case "(9)": color = "Green"; break;
        case "(10)": color = "Yellow"; break;
        case "(11)": color = "Blue"; break;
        case "(12)": color = "Magenta"; break;
        default: color = "Black"; break;
    }
    return color;
}

function get_seconds(e) {
    const t = e.split(":");
    return 60 * +t[0] * 60 + 60 * +t[1] + +t[2];
}

function radians_to_degrees(radians) {
    const pi = Math.PI;
    return radians * (180 / pi);
}

function secondsToHms(e) {
    e = Number(e);
    const t = Math.floor(e / 3600),
        a = Math.floor((e % 3600) / 60),
        o = Math.floor((e % 3600) % 60);
    return ("0" + t).slice(-2) + ":" + ("0" + a).slice(-2) + ":" + ("0" + o).slice(-2);
}

function secToHours (str) {
    const sec_num = parseInt(str, 10); // don't forget the second param
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function hmsToSecondsOnly(str) {
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}

function getStorageState() {
    return JSON.parse(localStorage.getItem("currentState"));
}

function updateStorage(objProp) {
    const currentState = getStorageState();
    const newState = { ...currentState, ...objProp };
    localStorage.setItem("currentState", JSON.stringify(newState));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

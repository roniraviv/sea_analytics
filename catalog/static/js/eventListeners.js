$(document).keyup(function (e) {
   // console.log(e.which)
    // key: a
    e.which === 65 && toggleAltView()
    // key: i
    e.which === 73 && swapAltViewContent()
    // key: j
    e.which === 74 && swapContent()
    // key: k
    e.which === 75 && swapMapAndNonFullScreen()
    // key l
    e.which === 76 && defaultViewSettings()
    // key m
    e.which === 77 && toggleMute()
});

document.addEventListener('click', onBoundsChanged);

function onBoundsChanged(e) {
    const butt = document.getElementsByClassName('gm-control-active')[0];
    if (butt !== e.target) {
        return;
    }
    swapContent();
}

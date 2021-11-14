function rotateMainVideo(id) {
  rotationMain = rotationMain - 90;
  if (rotationMain <= -360) {
    rotationMain = -(rotationMain + 360)
  }
  if (rotationMain >= 360) {
    rotationMain = rotationMain - 360
  }
  const vId = videojs(id);
  vId.zoomrotate({
    rotate: rotationMain,
    zoom: zoomMain
  });
}

function rotateAdditionalVideo(id) {
  rotationAdditional = rotationAdditional - 90;
  if (rotationAdditional <= -360) {
    rotationAdditional = -(rotationAdditional + 360)
  }
  if (rotationAdditional >= 360) {
    rotationAdditional = rotationAdditional - 360
  }
  const vId = videojs(id);
  vId.zoomrotate({
    rotate: rotationAdditional,
    zoom: zoomAdditional
  });
}

function zoomPanMain(id, className = false) {
  const elem = !className ? document.getElementById(id) : document.getElementsByClassName(id);
  const panzoom = Panzoom(elem, {
    maxScale: 10,
    setTransform: (elem, {scale, x, y}) => {
      let newX;
      let newY;
      switch (rotationMain) {
        case -90:
          newX = -y;
          newY = x;
          break;
        case -180:
          newX = -x;
          newY = -y;
          break;
        case -270:
          newX = y;
          newY = -x;
          break;
        default:
          newX = x;
          newY = y;
          break;
      }
      panzoom.setStyle('transform', `rotate(${rotationMain}deg) scale(${scale}) translate(${newX}px, ${newY}px)`)
    }
  })

  elem.addEventListener('wheel', function (event) {
    if (event.shiftKey) {
      panzoom.zoomWithWheel(event)
      zoomMain = panzoom.getScale();
      panningMain = panzoom.getPan();
    }
  })

  elem.addEventListener('dblclick', function () {
    panzoom.zoom(1, {animate: true})
    panzoom.pan(0, 0, {animate: true})
    zoomMain = panzoom.getScale();
    panningMain = panzoom.getPan();

  })
}

function zoomPanAdditional(id, className = false) {
  const elem = !className ? document.getElementById(id) : document.getElementsByClassName(id)
  const panzoom = Panzoom(elem, {
    maxScale: 10,
    setTransform: (elem, {scale, x, y}) => {
      let newX;
      let newY;
      switch (rotationAdditional) {
        case -90:
          newX = -y;
          newY = x;
          break;
        case -180:
          newX = -x;
          newY = -y;
          break;
        case -270:
          newX = y;
          newY = -x;
          break;
        default:
          newX = x;
          newY = y;
          break;
      }
      panzoom.setStyle('transform', `rotate(${rotationAdditional}deg) scale(${scale}) translate(${newX}px, ${newY}px)`)
    }
  })

  elem.addEventListener('wheel', function (event) {
    if (event.shiftKey) {
      panzoom.zoomWithWheel(event)
      zoomAdditional = panzoom.getScale();
      panningAdditional = panzoom.getPan();
    }
  })

  elem.addEventListener('dblclick', function () {
    panzoom.zoom(1, {animate: true})
    panzoom.pan(0, 0, {animate: true})
    zoomAdditional = panzoom.getScale()
    panningAdditional = panzoom.getPan();
  })
}

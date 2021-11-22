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
    // prevent swapping if no any changes (toggling windows) are made
    if($('#main_view_wrapper #map').length > 0) {
      swapNodes($('#main_view_wrapper').children()[0], $('#alt_view').children()[0]);
    }
    onCloseFullScreen();
  });
}

function onCloseFullScreen() {
  hideAltViewFullScreen();
  hideMetaBarInFullScreen();
  hideTimeLineInFullScreen();
  defaultViewSettings();
  clearCharts();
  drawCharts(dataSet);
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
    console.log(4)
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

function toggleTimeLineFS() {
  if ($('#main_view_wrapper #map')?.length > 0) {
    showTimeLineInFullScreen();
  } else {
    hideTimeLineInFullScreen();
  }
}

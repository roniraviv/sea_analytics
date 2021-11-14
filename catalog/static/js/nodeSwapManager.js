function swapNodes(a, b) {
  a = $(a);
  b = $(b);
  const tmp = $('<span>').hide();
  a.before(tmp);
  b.before(a);
  tmp.replaceWith(b);
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

function visibilityToggle(element) {
  $(element).css('visibility',
    $(element).css('visibility') === 'visible' ? 'hidden' : 'visible');

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

function alignAltViewWrapper() {
  $("#alt_view #map").removeAttr("style");
  updateRouteMarker(activeVideo)
}

function isSecondaryVideoReady() {
  const secondaryVideo = videojs('additional_overlay_video');
  secondaryVideo.ready(function () {
    sleep(200).then(() => videojs('video_player').play());
  })
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

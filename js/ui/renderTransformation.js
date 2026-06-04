(function () {
  "use strict";

  var transformations = window.TransformationSystem;
  var cards = window.SolitaireCards;

  // `transformationState.total` is logic-only. Do not render it as a dashboard
  // tile; the player-facing panel shows individual tracks plus Curse Pressure.
  var DISPLAY_TRACKS = [
    "face",
    "voice",
    "mind",
    "hair",
    "waistHips",
    "genitals",
    "handsArms",
    "legsFeet",
    "breasts",
    "torso",
    "clothing"
  ];

  function renderTransformation(state, elements) {
    var transformationState = state.transformationState || transformations.createTransformationState();
    elements.transformationStats.innerHTML = "";

    DISPLAY_TRACKS.forEach(function (track) {
      var value = transformationState[track];
      var stat = document.createElement("div");
      stat.className = "tf-stat";

      stat.appendChild(createTransformationStatHeader(track, value));
      stat.appendChild(createTransformationSegments(value));
      elements.transformationStats.appendChild(stat);
    });

    var pressure = document.createElement("div");
    pressure.className = "tf-stat tf-stat-curse";
    pressure.innerHTML =
      '<div class="tf-stat-header"><span class="tf-label">Curse Pressure</span><span class="tf-value">' +
      (state.cursePressure || 0) +
      "</span></div>";
    elements.transformationStats.appendChild(pressure);
  }

  function createTransformationStatHeader(track, value) {
    var header = document.createElement("div");
    header.className = "tf-stat-header";

    var label = document.createElement("span");
    label.className = "tf-label";
    label.innerHTML =
      '<span class="tf-suit ' +
      transformations.getSuitForTrack(track) +
      '">' +
      cards.suitSymbol(transformations.getSuitForTrack(track)) +
      "</span>" +
      formatTrackName(track);

    var stage = document.createElement("span");
    stage.className = "tf-value";
    stage.textContent = transformations.getDisplayValue(track, value);

    header.appendChild(label);
    header.appendChild(stage);
    return header;
  }

  function createTransformationSegments(value) {
    var segments = document.createElement("div");
    segments.className = "tf-segments";
    for (var index = 0; index < 5; index += 1) {
      var segment = document.createElement("span");
      segment.className = index < value ? "tf-segment active" : "tf-segment";
      segments.appendChild(segment);
    }
    return segments;
  }

  function formatTrackName(track) {
    return track.replace(/([A-Z])/g, " $1").replace(/^./, function (letter) {
      return letter.toUpperCase();
    });
  }

  window.TransformationRenderer = {
    renderTransformation: renderTransformation
  };
})();

(function () {
  "use strict";

  var TRACKS = [
    "hair",
    "face",
    "voice",
    "mind",
    "breasts",
    "genitals",
    "waistHips",
    "handsArms",
    "legsFeet",
    "torso",
    "clothing"
  ];

  var SUIT_TRACKS = {
    hearts: ["hair", "face", "voice", "mind"],
    diamonds: ["waistHips", "genitals"],
    clubs: ["handsArms", "legsFeet"],
    spades: ["breasts", "torso", "clothing"]
  };

  function createTransformationState() {
    return {
      hair: 0,
      face: 0,
      voice: 0,
      mind: 0,
      breasts: 0,
      genitals: 0,
      waistHips: 0,
      handsArms: 0,
      legsFeet: 0,
      torso: 0,
      clothing: 0,
      total: 0
    };
  }

  function addGameLog(state, message, data) {
    var entry = data || {};
    entry.message = message;
    state.transformationLog = state.transformationLog || [];
    state.transformationLog.push(entry);
    return entry;
  }

  function pickRandomItem(items, random) {
    var nextRandom = random || Math.random;
    return items[Math.floor(nextRandom() * items.length)];
  }

  function canAdvanceTransformationTrack(transformationState, track) {
    return transformationState[track] < 5;
  }

  function pickTransformationTrack(transformationState, suit, random) {
    var tracks = SUIT_TRACKS[suit] || TRACKS;
    var availableTracks = tracks.filter(function (track) {
      return canAdvanceTransformationTrack(transformationState, track);
    });
    return pickRandomItem(availableTracks.length ? availableTracks : tracks, random);
  }

  function formatTransformationStage(track, stage) {
    var namedStages = {
      breasts: ["Flat", "A", "B", "C", "D", "E"],
      genitals: ["Large", "Medium", "Small", "Very small", "Vagina", "Vagina"]
    };
    if (namedStages[track]) {
      return namedStages[track][Math.min(stage, namedStages[track].length - 1)];
    }
    return "stage " + stage;
  }

  function getDisplayValue(track, value) {
    var namedStages = {
      breasts: ["Flat", "A", "B", "C", "D", "E"],
      genitals: ["Large", "Medium", "Small", "Very small", "Vagina", "Vagina"]
    };
    if (namedStages[track]) {
      return namedStages[track][Math.min(value, namedStages[track].length - 1)];
    }
    return value + "/5";
  }

  function getSuitForTrack(track) {
    if (SUIT_TRACKS.hearts.indexOf(track) !== -1) {
      return "hearts";
    }
    if (SUIT_TRACKS.diamonds.indexOf(track) !== -1) {
      return "diamonds";
    }
    if (SUIT_TRACKS.clubs.indexOf(track) !== -1) {
      return "clubs";
    }
    return "spades";
  }

  window.TransformationSystem = {
    TRACKS: TRACKS,
    SUIT_TRACKS: SUIT_TRACKS,
    createTransformationState: createTransformationState,
    addGameLog: addGameLog,
    pickTransformationTrack: pickTransformationTrack,
    canAdvanceTransformationTrack: canAdvanceTransformationTrack,
    formatTransformationStage: formatTransformationStage,
    getDisplayValue: getDisplayValue,
    getSuitForTrack: getSuitForTrack
  };
})();

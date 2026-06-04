(function () {
  "use strict";

  var transformations = window.TransformationSystem;

  function addCursePressure(state, amount, message) {
    state.cursePressure = (state.cursePressure || 0) + amount;
    return transformations.addGameLog(state, message, {
      type: "curse-pressure",
      amount: amount,
      cursePressure: state.cursePressure
    });
  }

  function getCursePressureTickCount(cursePressure) {
    if (cursePressure >= 15) {
      return 6;
    }
    if (cursePressure >= 12) {
      return 5;
    }
    if (cursePressure >= 9) {
      return 4;
    }
    if (cursePressure >= 6) {
      return 3;
    }
    if (cursePressure >= 3) {
      return 2;
    }
    if (cursePressure >= 1) {
      return 1;
    }
    return 0;
  }

  function countSuits(cards) {
    return cards.reduce(function (lookup, card) {
      lookup[card.suit] = (lookup[card.suit] || 0) + 1;
      return lookup;
    }, {});
  }

  function pickWeightedSuit(suitCounts, random) {
    var suits = Object.keys(suitCounts).filter(function (suit) {
      return suitCounts[suit] > 0;
    });
    var total = suits.reduce(function (sum, suit) {
      return sum + suitCounts[suit];
    }, 0);
    var roll = (random || Math.random)() * total;
    for (var index = 0; index < suits.length; index += 1) {
      roll -= suitCounts[suits[index]];
      if (roll <= 0) {
        return suits[index];
      }
    }
    return suits[suits.length - 1];
  }

  function applyRecycleTransformationTick(state, suitCounts) {
    var transformationState = state.transformationState || transformations.createTransformationState();
    state.transformationState = transformationState;
    var suit = pickWeightedSuit(suitCounts, state.random);
    var track = transformations.pickTransformationTrack(transformationState, suit, state.random);
    var previousStage = transformationState[track];
    var nextStage = Math.min(5, previousStage + 1);
    var actualAdded = nextStage - previousStage;
    transformationState[track] = nextStage;
    transformationState.total += actualAdded;
    return transformations.addGameLog(state, actualAdded > 0
      ? "Recycle transformation: " + track + " increased to " + transformations.formatTransformationStage(track, nextStage) + "."
      : "Recycle transformation: " + track + " is already " + transformations.formatTransformationStage(track, nextStage) + ".", {
        type: "recycle-transformation",
        suit: suit,
        track: track,
        amount: actualAdded,
        stage: nextStage
      });
  }

  function applyRecycleTransformations(state, wasteCards) {
    var cursePressure = state.cursePressure || 0;
    var ticks = getCursePressureTickCount(cursePressure);
    var suitCounts = countSuits(wasteCards);
    var events = [];
    events.push(transformations.addGameLog(
      state,
      "Waste recycled. Curse pressure " + cursePressure + " caused " + ticks + " transformation ticks.",
      {
        type: "waste-recycled",
        cursePressure: cursePressure,
        ticks: ticks
      }
    ));
    for (var index = 0; index < ticks; index += 1) {
      events.push(applyRecycleTransformationTick(state, suitCounts));
    }
    state.cursePressure = 0;
    return events;
  }

  window.CursePressure = {
    addCursePressure: addCursePressure,
    getCursePressureTickCount: getCursePressureTickCount,
    countSuits: countSuits,
    pickWeightedSuit: pickWeightedSuit,
    applyRecycleTransformationTick: applyRecycleTransformationTick,
    applyRecycleTransformations: applyRecycleTransformations
  };
})();

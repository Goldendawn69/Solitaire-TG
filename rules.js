(function () {
  "use strict";

  var SUITS = ["spades", "hearts", "diamonds", "clubs"];
  var SUIT_SYMBOLS = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣"
  };
  var RANK_LABELS = {
    1: "A",
    11: "J",
    12: "Q",
    13: "K"
  };
  var HAND_SIZE = 7;
  var TRANSFORMATION_TRACKS = [
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
  var SUIT_TRANSFORMATION_TRACKS = {
    hearts: ["face", "voice", "mind", "hair"],
    diamonds: ["waistHips", "genitals"],
    clubs: ["handsArms", "legsFeet"],
    spades: ["breasts", "torso", "clothing"]
  };

  function createCard(suit, rank) {
    return {
      id: suit + "-" + rank,
      suit: suit,
      rank: rank,
      faceUp: false
    };
  }

  function createDeck() {
    var deck = [];
    SUITS.forEach(function (suit) {
      for (var rank = 1; rank <= 13; rank += 1) {
        deck.push(createCard(suit, rank));
      }
    });
    return deck;
  }

  function shuffleCards(cards, random) {
    var shuffled = cards.slice();
    var nextRandom = random || Math.random;
    for (var index = shuffled.length - 1; index > 0; index -= 1) {
      var swapIndex = Math.floor(nextRandom() * (index + 1));
      var current = shuffled[index];
      shuffled[index] = shuffled[swapIndex];
      shuffled[swapIndex] = current;
    }
    return shuffled;
  }

  function cardLabel(card) {
    return (RANK_LABELS[card.rank] || String(card.rank)) + SUIT_SYMBOLS[card.suit];
  }

  function cardColor(card) {
    return card.suit === "hearts" || card.suit === "diamonds" ? "red" : "black";
  }

  function canPlaceOnFoundation(card, foundation) {
    if (!card) {
      return false;
    }
    if (!foundation.length) {
      return card.rank === 1;
    }
    var top = foundation[foundation.length - 1];
    return top.suit === card.suit && card.rank === top.rank + 1;
  }

  function canPlaceOnTableau(card, targetColumn) {
    if (!card) {
      return false;
    }
    if (!targetColumn.length) {
      return card.rank === 13;
    }
    var top = targetColumn[targetColumn.length - 1];
    return top.faceUp && cardColor(card) !== cardColor(top) && card.rank === top.rank - 1;
  }

  function canMoveTableauStack(stack, targetColumn) {
    return stack.length > 0 && stack.every(function (card) {
      return card.faceUp;
    }) && isDescendingAlternatingStack(stack) && canPlaceOnTableau(stack[0], targetColumn);
  }

  function isDescendingAlternatingStack(stack) {
    for (var index = 0; index < stack.length - 1; index += 1) {
      var current = stack[index];
      var next = stack[index + 1];
      if (cardColor(current) === cardColor(next) || next.rank !== current.rank - 1) {
        return false;
      }
    }
    return true;
  }

  function makeEmptyFoundations() {
    return {
      spades: [],
      hearts: [],
      diamonds: [],
      clubs: []
    };
  }

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

  function applyTransformationEvent(state, cards, severity) {
    var eventCards = (cards || []).filter(Boolean);
    if (!eventCards.length) {
      return null;
    }

    var transformationState = state.transformationState || createTransformationState();
    state.transformationState = transformationState;

    var dominantSuit = pickDominantSuit(eventCards, state.random);
    var track = pickTransformationTrack(transformationState, dominantSuit, state.random);
    var requestedAmount = severity === "major" ? 2 : 1;
    var previousStage = transformationState[track];
    var nextStage = getNextTransformationStage(track, previousStage, requestedAmount);
    var actualAdded = Math.abs(nextStage - previousStage);
    transformationState[track] = nextStage;
    transformationState.total += actualAdded;

    var event = {
      severity: severity === "major" ? "major" : "minor",
      suit: dominantSuit,
      track: track,
      amount: actualAdded,
      stage: nextStage,
      message: formatTransformationMessage(severity, track, nextStage, actualAdded)
    };
    state.transformationLog = state.transformationLog || [];
    state.transformationLog.push(event);
    return event;
  }

  function addGameLog(state, message, data) {
    var entry = data || {};
    entry.message = message;
    state.transformationLog = state.transformationLog || [];
    state.transformationLog.push(entry);
    return entry;
  }

  function pickDominantSuit(cards, random) {
    var counts = cards.reduce(function (lookup, card) {
      lookup[card.suit] = (lookup[card.suit] || 0) + 1;
      return lookup;
    }, {});
    var highestCount = Math.max.apply(null, Object.keys(counts).map(function (suit) {
      return counts[suit];
    }));
    var dominantSuits = Object.keys(counts).filter(function (suit) {
      return counts[suit] === highestCount;
    });
    return pickRandomItem(dominantSuits, random);
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

  function pickTransformationTrack(transformationState, suit, random) {
    var tracks = SUIT_TRANSFORMATION_TRACKS[suit] || TRANSFORMATION_TRACKS;
    var availableTracks = tracks.filter(function (track) {
      return canAdvanceTransformationTrack(transformationState, track);
    });
    return pickRandomItem(availableTracks.length ? availableTracks : tracks, random);
  }

  function canAdvanceTransformationTrack(transformationState, track) {
    return transformationState[track] < 5;
  }

  function getNextTransformationStage(track, previousStage, amount) {
    return Math.min(5, previousStage + amount);
  }

  function pickRandomItem(items, random) {
    var nextRandom = random || Math.random;
    return items[Math.floor(nextRandom() * items.length)];
  }

  function formatTransformationMessage(severity, track, stage, amount) {
    var label = severity === "major" ? "Major" : "Minor";
    if (amount <= 0) {
      return label + " transformation: " + track + " is already stage " + stage + ".";
    }
    return label + " transformation: " + track + " increased to stage " + stage + ".";
  }

  function addCursePressure(state, amount, message) {
    state.cursePressure = (state.cursePressure || 0) + amount;
    return addGameLog(state, message, {
      type: "curse-pressure",
      amount: amount,
      cursePressure: state.cursePressure
    });
  }

  function getCursePressureTickCount(cursePressure) {
    if (cursePressure >= 21) {
      return 4;
    }
    if (cursePressure >= 13) {
      return 3;
    }
    if (cursePressure >= 6) {
      return 2;
    }
    return 1;
  }

  function applyRecycleTransformationTick(state, suitCounts) {
    var transformationState = state.transformationState || createTransformationState();
    state.transformationState = transformationState;

    var suit = pickWeightedSuit(suitCounts, state.random);
    var track = pickTransformationTrack(transformationState, suit, state.random);
    var previousStage = transformationState[track];
    var nextStage = Math.min(5, previousStage + 1);
    var actualAdded = nextStage - previousStage;
    transformationState[track] = nextStage;
    transformationState.total += actualAdded;

    return addGameLog(state, actualAdded > 0
      ? "Recycle transformation: " + track + " increased to stage " + nextStage + "."
      : "Recycle transformation: " + track + " is already stage " + nextStage + ".", {
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

    events.push(addGameLog(
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

  function revealTopCard(column) {
    if (column.length && !column[column.length - 1].faceUp) {
      column[column.length - 1].faceUp = true;
      return true;
    }
    return false;
  }

  function refreshHand(state) {
    var unplayedCount = state.hand.length;
    var pressureEvent = null;
    var recycleEvents = [];
    while (state.hand.length) {
      var wasted = state.hand.shift();
      wasted.faceUp = true;
      state.waste.push(wasted);
    }

    if (unplayedCount > 0) {
      pressureEvent = addCursePressure(
        state,
        unplayedCount,
        "Curse pressure +" + unplayedCount + " from unplayed hand cards."
      );
    }

    if (state.stock.length === 0 && state.waste.length > 0) {
      recycleEvents = applyRecycleTransformations(state, state.waste.slice());
      state.stock = shuffleCards(state.waste.splice(0), state.random).map(function (card) {
        card.faceUp = false;
        return card;
      });
    }

    while (state.hand.length < HAND_SIZE && state.stock.length) {
      var drawn = state.stock.shift();
      drawn.faceUp = true;
      state.hand.push(drawn);
    }

    return {
      pressureEvent: pressureEvent,
      recycleEvents: recycleEvents
    };
  }

  function moveHandCardToFoundation(state, handIndex, foundationSuit) {
    var card = state.hand[handIndex];
    var suit = foundationSuit || (card && card.suit);
    if (!card || card.suit !== suit || !canPlaceOnFoundation(card, state.foundations[suit])) {
      return false;
    }
    state.hand.splice(handIndex, 1);
    state.foundations[suit].push(card);
    return true;
  }

  function moveHandCardToTableau(state, handIndex, columnIndex) {
    var card = state.hand[handIndex];
    var column = state.tableau[columnIndex];
    if (!canPlaceOnTableau(card, column)) {
      return false;
    }
    state.hand.splice(handIndex, 1);
    column.push(card);
    return true;
  }

  function moveTableauCardToFoundation(state, columnIndex, foundationSuit) {
    var column = state.tableau[columnIndex];
    var card = column[column.length - 1];
    var suit = foundationSuit || (card && card.suit);
    if (!card || card.suit !== suit || !card.faceUp || !canPlaceOnFoundation(card, state.foundations[suit])) {
      return false;
    }
    column.pop();
    state.foundations[suit].push(card);
    revealTopCard(column);
    return true;
  }

  function moveTableauStack(state, fromColumnIndex, startIndex, toColumnIndex) {
    if (fromColumnIndex === toColumnIndex) {
      return false;
    }
    var fromColumn = state.tableau[fromColumnIndex];
    var toColumn = state.tableau[toColumnIndex];
    var stack = fromColumn.slice(startIndex);
    if (!canMoveTableauStack(stack, toColumn)) {
      return false;
    }
    Array.prototype.push.apply(toColumn, stack);
    fromColumn.splice(startIndex, stack.length);
    revealTopCard(fromColumn);
    return true;
  }

  function wasteTopTableauCard(state, columnIndex) {
    var column = state.tableau[columnIndex];
    if (!column || !column.length) {
      return null;
    }

    var card = column[column.length - 1];
    if (!card.faceUp) {
      return null;
    }

    column.pop();
    card.faceUp = true;
    state.waste.push(card);
    addCursePressure(state, 2, "Curse pressure +2 from wasting " + cardLabel(card) + ".");
    revealTopCard(column);

    return card;
  }

  function hasWon(state) {
    return SUITS.every(function (suit) {
      return state.foundations[suit].length === 13;
    });
  }

  function buildShuffledGame(seed) {
    var random = seededRandom(seed || Date.now());
    var deck = shuffleCards(createDeck(), random);
    var tableau = dealKlondikeTableau(deck);
    var remaining = deck.slice(28);
    var state = {
      tableau: tableau,
      foundations: makeEmptyFoundations(),
      stock: buildPlayableStock(remaining, random),
      waste: [],
      hand: [],
      random: random,
      cursePressure: 0,
      transformationState: createTransformationState(),
      transformationLog: []
    };
    refreshHand(state);
    return state;
  }

  function dealKlondikeTableau(deck) {
    var cursor = 0;
    return [1, 2, 3, 4, 5, 6, 7].map(function (columnSize) {
      var column = deck.slice(cursor, cursor + columnSize);
      cursor += columnSize;
      column.forEach(function (card, index) {
        card.faceUp = index === column.length - 1;
      });
      return column;
    });
  }

  function buildPlayableStock(cards, random) {
    return shuffleCards(cards, random).map(function (card) {
      card.faceUp = false;
      return card;
    });
  }

  function seededRandom(seed) {
    var value = Math.abs(Math.floor(seed)) || 1;
    return function () {
      value = (value * 1664525 + 1013904223) % 4294967296;
      return value / 4294967296;
    };
  }

  window.SolitaireRules = {
    SUITS: SUITS,
    HAND_SIZE: HAND_SIZE,
    cardLabel: cardLabel,
    cardColor: cardColor,
    createDeck: createDeck,
    shuffleCards: shuffleCards,
    createTransformationState: createTransformationState,
    applyTransformationEvent: applyTransformationEvent,
    addCursePressure: addCursePressure,
    getCursePressureTickCount: getCursePressureTickCount,
    applyRecycleTransformations: applyRecycleTransformations,
    applyRecycleTransformationTick: applyRecycleTransformationTick,
    countSuits: countSuits,
    pickWeightedSuit: pickWeightedSuit,
    pickDominantSuit: pickDominantSuit,
    pickTransformationTrack: pickTransformationTrack,
    canAdvanceTransformationTrack: canAdvanceTransformationTrack,
    getNextTransformationStage: getNextTransformationStage,
    canPlaceOnFoundation: canPlaceOnFoundation,
    canPlaceOnTableau: canPlaceOnTableau,
    canMoveTableauStack: canMoveTableauStack,
    refreshHand: refreshHand,
    moveHandCardToFoundation: moveHandCardToFoundation,
    moveHandCardToTableau: moveHandCardToTableau,
    moveTableauCardToFoundation: moveTableauCardToFoundation,
    moveTableauStack: moveTableauStack,
    wasteTopTableauCard: wasteTopTableauCard,
    hasWon: hasWon,
    buildShuffledGame: buildShuffledGame
  };
})();

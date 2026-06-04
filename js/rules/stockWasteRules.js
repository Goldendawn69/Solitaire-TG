(function () {
  "use strict";

  var HAND_SIZE = 7;
  var cards = window.SolitaireCards;
  var curse = window.CursePressure;

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
      pressureEvent = curse.addCursePressure(
        state,
        unplayedCount,
        "Curse pressure +" + unplayedCount + " from unplayed hand cards."
      );
    }

    if (state.stock.length === 0 && state.waste.length > 0) {
      recycleEvents = curse.applyRecycleTransformations(state, state.waste.slice());
      state.stock = cards.shuffleCards(state.waste.splice(0), state.random).map(function (card) {
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

  window.StockWasteRules = {
    HAND_SIZE: HAND_SIZE,
    refreshHand: refreshHand
  };
})();

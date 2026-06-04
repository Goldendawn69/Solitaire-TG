(function () {
  "use strict";

  var cards = window.SolitaireCards;
  var stockWaste = window.StockWasteRules;
  var transformations = window.TransformationSystem;

  function makeEmptyFoundations() {
    return {
      spades: [],
      hearts: [],
      diamonds: [],
      clubs: []
    };
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

  function buildPlayableStock(cardsToUse, random) {
    return cards.shuffleCards(cardsToUse, random).map(function (card) {
      card.faceUp = false;
      return card;
    });
  }

  function buildShuffledGame(seed) {
    var random = cards.seededRandom(seed || Date.now());
    var deck = cards.shuffleCards(cards.createDeck(), random);
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
      transformationState: transformations.createTransformationState(),
      transformationLog: []
    };
    stockWaste.refreshHand(state);
    return state;
  }

  function hasWon(state) {
    return cards.SUITS.every(function (suit) {
      return state.foundations[suit].length === 13;
    });
  }

  window.GameState = {
    makeEmptyFoundations: makeEmptyFoundations,
    dealKlondikeTableau: dealKlondikeTableau,
    buildPlayableStock: buildPlayableStock,
    buildShuffledGame: buildShuffledGame,
    hasWon: hasWon
  };
})();

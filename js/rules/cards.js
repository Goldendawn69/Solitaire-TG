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

  function seededRandom(seed) {
    var value = Math.abs(Math.floor(seed)) || 1;
    return function () {
      value = (value * 1664525 + 1013904223) % 4294967296;
      return value / 4294967296;
    };
  }

  function cardLabel(card) {
    return (RANK_LABELS[card.rank] || String(card.rank)) + SUIT_SYMBOLS[card.suit];
  }

  function cardColor(card) {
    return card.suit === "hearts" || card.suit === "diamonds" ? "red" : "black";
  }

  function suitSymbol(suit) {
    return SUIT_SYMBOLS[suit] || suit;
  }

  function getCardImagePath(card) {
    return "images/cards/" + getCardImageRank(card) + "_of_" + getCardImageSuit(card) + ".svg";
  }

  function getCardImageRank(card) {
    var rankMap = {
      "1": "ace",
      a: "ace",
      ace: "ace",
      "11": "jack",
      j: "jack",
      jack: "jack",
      "12": "queen",
      q: "queen",
      queen: "queen",
      "13": "king",
      k: "king",
      king: "king"
    };
    var rankKey = String(card.rank).toLowerCase();
    return rankMap[rankKey] || rankKey;
  }

  function getCardImageSuit(card) {
    var suitMap = {
      "♥": "hearts",
      hearts: "hearts",
      heart: "hearts",
      "♦": "diamonds",
      diamonds: "diamonds",
      diamond: "diamonds",
      "♣": "clubs",
      clubs: "clubs",
      club: "clubs",
      "♠": "spades",
      spades: "spades",
      spade: "spades"
    };
    var suitKey = String(card.suit).toLowerCase();
    return suitMap[card.suit] || suitMap[suitKey];
  }

  function getCardImageAlt(card) {
    return getCardImageRank(card) + " of " + getCardImageSuit(card);
  }

  window.SolitaireCards = {
    SUITS: SUITS,
    SUIT_SYMBOLS: SUIT_SYMBOLS,
    RANK_LABELS: RANK_LABELS,
    createDeck: createDeck,
    shuffleCards: shuffleCards,
    seededRandom: seededRandom,
    cardLabel: cardLabel,
    cardColor: cardColor,
    suitSymbol: suitSymbol,
    getCardImagePath: getCardImagePath,
    getCardImageRank: getCardImageRank,
    getCardImageSuit: getCardImageSuit,
    getCardImageAlt: getCardImageAlt
  };
})();

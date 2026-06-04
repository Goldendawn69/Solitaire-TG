(function () {
  "use strict";

  var movement = window.MovementRules;

  function findFoundationMoveInPile(pile, state) {
    for (var index = 0; index < pile.length; index += 1) {
      var card = pile[index];
      if (movement.canPlaceOnFoundation(card, state.foundations[card.suit])) {
        return {
          index: index,
          card: card
        };
      }
    }
    return null;
  }

  function findAutoCompleteMove(state) {
    var handMove = findFoundationMoveInPile(state.hand, state);
    if (handMove) {
      handMove.source = "hand";
      return handMove;
    }

    for (var columnIndex = 0; columnIndex < state.tableau.length; columnIndex += 1) {
      var column = state.tableau[columnIndex];
      var card = column[column.length - 1];
      if (card && card.faceUp && movement.canPlaceOnFoundation(card, state.foundations[card.suit])) {
        return {
          source: "tableau",
          columnIndex: columnIndex,
          card: card
        };
      }
    }

    var stockMove = findFoundationMoveInPile(state.stock, state);
    if (stockMove) {
      stockMove.source = "stock";
      return stockMove;
    }

    var wasteMove = findFoundationMoveInPile(state.waste, state);
    if (wasteMove) {
      wasteMove.source = "waste";
      return wasteMove;
    }

    return null;
  }

  function applyAutoCompleteMove(state, move) {
    if (!move || !movement.canPlaceOnFoundation(move.card, state.foundations[move.card.suit])) {
      return null;
    }

    var card = null;
    if (move.source === "hand") {
      card = state.hand.splice(move.index, 1)[0];
    } else if (move.source === "stock") {
      card = state.stock.splice(move.index, 1)[0];
    } else if (move.source === "waste") {
      card = state.waste.splice(move.index, 1)[0];
    } else if (move.source === "tableau") {
      card = state.tableau[move.columnIndex].pop();
    }

    if (!card) {
      return null;
    }
    card.faceUp = true;
    state.foundations[card.suit].push(card);
    return card;
  }

  function canAutoComplete(state) {
    return movement.isTableauFullyExposed(state) && Boolean(findAutoCompleteMove(state));
  }

  window.AutoCompleteRules = {
    findAutoCompleteMove: findAutoCompleteMove,
    applyAutoCompleteMove: applyAutoCompleteMove,
    canAutoComplete: canAutoComplete
  };
})();

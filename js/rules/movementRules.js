(function () {
  "use strict";

  var cards = window.SolitaireCards;

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
    return top.faceUp && cards.cardColor(card) !== cards.cardColor(top) && card.rank === top.rank - 1;
  }

  function isDescendingAlternatingStack(stack) {
    for (var index = 0; index < stack.length - 1; index += 1) {
      var current = stack[index];
      var next = stack[index + 1];
      if (cards.cardColor(current) === cards.cardColor(next) || next.rank !== current.rank - 1) {
        return false;
      }
    }
    return true;
  }

  function canMoveTableauStack(stack, targetColumn) {
    return stack.length > 0 && stack.every(function (card) {
      return card.faceUp;
    }) && isDescendingAlternatingStack(stack) && canPlaceOnTableau(stack[0], targetColumn);
  }

  function revealTopCard(column) {
    if (column.length && !column[column.length - 1].faceUp) {
      column[column.length - 1].faceUp = true;
      return true;
    }
    return false;
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
    window.CursePressure.addCursePressure(state, 2, "Curse pressure +2 from wasting " + cards.cardLabel(card) + ".");
    revealTopCard(column);
    return card;
  }

  function isTableauFullyExposed(state) {
    return state.tableau.every(function (column) {
      return column.every(function (card) {
        return card.faceUp;
      });
    });
  }

  window.MovementRules = {
    canPlaceOnFoundation: canPlaceOnFoundation,
    canPlaceOnTableau: canPlaceOnTableau,
    canMoveTableauStack: canMoveTableauStack,
    revealTopCard: revealTopCard,
    moveHandCardToFoundation: moveHandCardToFoundation,
    moveHandCardToTableau: moveHandCardToTableau,
    moveTableauCardToFoundation: moveTableauCardToFoundation,
    moveTableauStack: moveTableauStack,
    wasteTopTableauCard: wasteTopTableauCard,
    isTableauFullyExposed: isTableauFullyExposed
  };
})();

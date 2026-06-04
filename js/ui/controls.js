(function () {
  "use strict";

  var gameState = window.GameState;
  var stockWaste = window.StockWasteRules;
  var autocomplete = window.AutoCompleteRules;
  var cards = window.SolitaireCards;

  var HAND_REFRESH_GUARD_MS = 700;

  function bindControls(context) {
    context.elements.newGameButton.addEventListener("click", function () {
      startNewGame(context);
    });

    context.elements.refreshHandButton.addEventListener("click", function () {
      refreshCurrentHand(context);
    });

    context.elements.stockPile.addEventListener("click", function () {
      refreshCurrentHand(context);
    });

    context.elements.completeGameButton.addEventListener("click", function () {
      startAutoComplete(context);
    });

    context.elements.rulesButton.addEventListener("click", function () {
      context.elements.rulesDialog.hidden = false;
    });

    context.elements.rulesCloseButton.addEventListener("click", function () {
      context.elements.rulesDialog.hidden = true;
    });

    context.elements.rulesDialog.addEventListener("click", function (event) {
      if (event.target === context.elements.rulesDialog) {
        context.elements.rulesDialog.hidden = true;
      }
    });

    context.elements.clearLogButton.addEventListener("click", function () {
      context.state.transformationLog = [];
      context.render("Event log cleared.");
    });
  }

  function startNewGame(context) {
    context.state = gameState.buildShuffledGame(Date.now());
    context.selected = null;
    context.dragSelection = null;
    context.autoCompleteRunning = false;
    context.render("New shuffled deal ready.");
  }

  function refreshCurrentHand(context) {
    var now = Date.now();
    if (now - context.lastHandRefreshAt < HAND_REFRESH_GUARD_MS) {
      context.render("Hand already refreshed.");
      return;
    }
    context.lastHandRefreshAt = now;

    var result = stockWaste.refreshHand(context.state);
    context.selected = null;

    if (result && result.recycleEvents && result.recycleEvents.length) {
      context.render(result.recycleEvents[0].message);
      return;
    }

    context.render(result && result.pressureEvent
      ? result.pressureEvent.message
      : "Unplayed hand cards moved to waste. Drew a new hand.");
  }

  function startAutoComplete(context) {
    if (context.autoCompleteRunning || !autocomplete.canAutoComplete(context.state)) {
      context.render("Complete is available once all tableau cards are exposed.");
      return;
    }

    context.selected = null;
    context.dragSelection = null;
    context.autoCompleteRunning = true;
    runAutoCompleteStep(context);
  }

  function runAutoCompleteStep(context) {
    var move = autocomplete.findAutoCompleteMove(context.state);
    if (!move) {
      context.autoCompleteRunning = false;
      context.render(gameState.hasWon(context.state) ? "You won." : "No more automatic foundation moves are available.");
      return;
    }

    var card = autocomplete.applyAutoCompleteMove(context.state, move);
    context.render(card ? "Completing: moved " + cards.cardLabel(card) + " to foundation." : "No more automatic foundation moves are available.");

    if (gameState.hasWon(context.state)) {
      context.autoCompleteRunning = false;
      context.render("You won.");
      return;
    }

    window.setTimeout(function () {
      runAutoCompleteStep(context);
    }, 180);
  }

  window.Controls = {
    bindControls: bindControls,
    startNewGame: startNewGame,
    refreshCurrentHand: refreshCurrentHand,
    startAutoComplete: startAutoComplete
  };
})();

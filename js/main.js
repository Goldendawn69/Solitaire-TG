(function () {
  "use strict";

  function getElements() {
    return {
      status: document.getElementById("status"),
      stockPile: document.getElementById("stock-pile"),
      stockCount: document.getElementById("stock-count"),
      wastePile: document.getElementById("waste-pile"),
      wasteCount: document.getElementById("waste-count"),
      foundations: document.getElementById("foundations"),
      transformationStats: document.getElementById("transformation-stats"),
      transformationLog: document.getElementById("transformation-log"),
      clearLogButton: document.getElementById("clear-log-button"),
      hand: document.getElementById("hand"),
      tableau: document.getElementById("tableau"),
      newGameButton: document.getElementById("new-game-button"),
      refreshHandButton: document.getElementById("refresh-hand-button"),
      completeGameButton: document.getElementById("complete-game-button"),
      rulesButton: document.getElementById("rules-button"),
      rulesDialog: document.getElementById("rules-dialog"),
      rulesCloseButton: document.getElementById("rules-close-button")
    };
  }

  function boot() {
    var context = {
      state: null,
      selected: null,
      dragSelection: null,
      revealAnimationCards: {},
      autoCompleteRunning: false,
      lastHandRefreshAt: 0,
      elements: getElements(),
      render: null
    };

    context.render = window.BoardRenderer.createRenderer(context);
    window.DragDrop.bindDragDrop(context);
    window.Controls.bindControls(context);
    window.Controls.startNewGame(context);
    window.SevenHandSolitaire = context;
  }

  boot();
})();

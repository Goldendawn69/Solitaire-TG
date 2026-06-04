(function () {
  "use strict";

  window.SolitaireRules = Object.assign(
    {},
    window.SolitaireCards,
    window.MovementRules,
    window.StockWasteRules,
    window.AutoCompleteRules,
    window.TransformationSystem,
    window.CursePressure,
    window.GameState
  );
})();

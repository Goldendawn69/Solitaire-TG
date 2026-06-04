(function () {
  "use strict";

  function captureCardRects() {
    var rects = {};
    document.querySelectorAll(".card-face[data-card-id], .tableau-card.facedown[data-card-id]").forEach(function (element) {
      var cardId = element.dataset.cardId;
      if (!cardId || rects[cardId]) {
        return;
      }
      rects[cardId] = {
        rect: element.getBoundingClientRect(),
        faceDown: element.classList.contains("facedown")
      };
    });
    return rects;
  }

  function getFaceDownCardLookup(previousCardRects) {
    return Object.keys(previousCardRects).reduce(function (lookup, cardId) {
      if (previousCardRects[cardId].faceDown) {
        lookup[cardId] = true;
      }
      return lookup;
    }, {});
  }

  function animateCardMovement(previousCardRects) {
    document.querySelectorAll(".card-face[data-card-id], .tableau-card.facedown[data-card-id]").forEach(function (element) {
      var previous = previousCardRects[element.dataset.cardId];
      if (!previous) {
        return;
      }

      var next = element.getBoundingClientRect();
      var deltaX = previous.rect.left - next.left;
      var deltaY = previous.rect.top - next.top;
      var moved = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;
      var revealed = previous.faceDown && !element.classList.contains("facedown");

      if (!moved || revealed) {
        return;
      }

      element.animate(
        [
          { transform: "translate(" + deltaX + "px, " + deltaY + "px) scale(0.98)" },
          { transform: "translate(0, 0) scale(1)" }
        ],
        {
          duration: 260,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
        }
      );
    });
  }

  window.CardAnimation = {
    captureCardRects: captureCardRects,
    getFaceDownCardLookup: getFaceDownCardLookup,
    animateCardMovement: animateCardMovement
  };
})();

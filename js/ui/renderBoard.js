(function () {
  "use strict";

  var cards = window.SolitaireCards;
  var cardRenderer = window.CardRenderer;
  var transformationRenderer = window.TransformationRenderer;
  var eventLog = window.EventLog;
  var animation = window.CardAnimation;
  var gameState = window.GameState;
  var autocomplete = window.AutoCompleteRules;

  function createRenderer(context) {
    function render(message) {
      var previousCardRects = animation.captureCardRects();
      context.revealAnimationCards = animation.getFaceDownCardLookup(previousCardRects);
      context.elements.stockCount.textContent = context.state.stock.length;
      context.elements.wasteCount.textContent = context.state.waste.length;
      context.elements.status.textContent = gameState.hasWon(context.state) ? "You won." : message || nextHint(context);

      renderFoundations(context);
      transformationRenderer.renderTransformation(context.state, context.elements);
      eventLog.renderEventLog(context.state, context.elements);
      renderHand(context);
      renderTableau(context);

      context.elements.completeGameButton.disabled = context.autoCompleteRunning || !autocomplete.canAutoComplete(context.state);
      animation.animateCardMovement(previousCardRects);
      context.revealAnimationCards = {};
    }

    return render;
  }

  function nextHint(context) {
    if (context.selected) {
      return "Choose a legal destination.";
    }
    return "Select or drag a hand card or a face-up tableau card.";
  }

  function renderFoundations(context) {
    context.elements.foundations.innerHTML = "";
    cards.SUITS.forEach(function (suit) {
      var pile = context.state.foundations[suit];
      var foundation = document.createElement("button");
      foundation.type = "button";
      foundation.className = "pile foundation " + suit;
      foundation.dataset.foundationSuit = suit;
      foundation.dataset.dropTarget = "foundation";
      foundation.setAttribute("aria-label", suit + " foundation");

      if (pile.length) {
        foundation.appendChild(cardRenderer.createCardFace(pile[pile.length - 1], context.revealAnimationCards));
      } else {
        foundation.innerHTML = '<span class="foundation-suit">' + cards.suitSymbol(suit) + "</span>";
      }
      context.elements.foundations.appendChild(foundation);
    });
  }

  function renderHand(context) {
    context.elements.hand.innerHTML = "";
    if (!context.state.hand.length) {
      var empty = document.createElement("p");
      empty.className = "empty-note";
      empty.textContent = "Hand empty";
      context.elements.hand.appendChild(empty);
      return;
    }

    context.state.hand.forEach(function (card, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "card-button hand-card";
      button.dataset.handIndex = index;
      button.draggable = true;
      if (context.selected && context.selected.type === "hand" && context.selected.index === index) {
        button.classList.add("selected");
      }
      button.appendChild(cardRenderer.createCardFace(card, context.revealAnimationCards));
      context.elements.hand.appendChild(button);
    });
  }

  function renderTableau(context) {
    context.elements.tableau.innerHTML = "";
    context.state.tableau.forEach(function (column, columnIndex) {
      var columnElement = document.createElement("div");
      columnElement.className = "tableau-column";
      columnElement.dataset.columnIndex = columnIndex;
      columnElement.dataset.dropTarget = "tableau";

      column.forEach(function (card, cardIndex) {
        var cardElement = document.createElement("button");
        cardElement.type = "button";
        cardElement.className = "tableau-card";
        cardElement.dataset.columnIndex = columnIndex;
        cardElement.dataset.cardIndex = cardIndex;
        cardElement.dataset.cardId = card.id;
        cardElement.draggable = card.faceUp;
        cardElement.style.top = cardIndex * 30 + "px";

        if (card.faceUp) {
          cardElement.appendChild(cardRenderer.createCardFace(card, context.revealAnimationCards));
        } else {
          cardElement.classList.add("facedown");
          cardElement.setAttribute("aria-label", "Face-down card");
          cardElement.appendChild(cardRenderer.createCardBackImage());
        }

        if (
          context.selected &&
          context.selected.type === "tableau" &&
          context.selected.columnIndex === columnIndex &&
          cardIndex >= context.selected.cardIndex
        ) {
          cardElement.classList.add("selected");
        }

        columnElement.appendChild(cardElement);
      });

      if (!column.length) {
        var emptyColumn = document.createElement("button");
        emptyColumn.type = "button";
        emptyColumn.className = "empty-column-target";
        emptyColumn.dataset.columnIndex = columnIndex;
        emptyColumn.dataset.dropTarget = "tableau";
        emptyColumn.textContent = "K";
        columnElement.appendChild(emptyColumn);
      }

      columnElement.style.minHeight = Math.max(150, column.length * 30 + 120) + "px";
      context.elements.tableau.appendChild(columnElement);
    });
  }

  window.BoardRenderer = {
    createRenderer: createRenderer
  };
})();

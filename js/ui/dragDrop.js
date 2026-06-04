(function () {
  "use strict";

  var movement = window.MovementRules;
  var cards = window.SolitaireCards;

  function bindDragDrop(context) {
    context.elements.hand.addEventListener("click", function (event) {
      var button = event.target.closest("[data-hand-index]");
      if (!button) {
        return;
      }
      context.selected = {
        type: "hand",
        index: Number(button.dataset.handIndex)
      };
      context.render();
    });

    context.elements.foundations.addEventListener("click", function (event) {
      var foundation = event.target.closest("[data-foundation-suit]");
      if (!foundation || !context.selected) {
        return;
      }
      moveSelectionToFoundation(context, foundation.dataset.foundationSuit);
    });

    context.elements.tableau.addEventListener("click", function (event) {
      var clickedCard = event.target.closest("[data-card-index]");
      var clickedColumn = event.target.closest("[data-column-index]");
      if (!clickedColumn) {
        return;
      }
      var columnIndex = Number(clickedColumn.dataset.columnIndex);
      if (!context.selected && clickedCard) {
        selectTableauCard(context, clickedCard);
        return;
      }
      if (context.selected) {
        moveSelectionToTableau(context, columnIndex);
      }
    });

    document.addEventListener("dragstart", function (event) {
      handleDragStart(context, event);
    });
    document.addEventListener("dragend", function () {
      handleDragEnd(context);
    });
    document.addEventListener("dragover", function (event) {
      handleDragOver(context, event);
    });
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", function (event) {
      handleDrop(context, event);
    });
  }

  function moveSelectionToFoundation(context, foundationSuit) {
    var moved = false;
    if (context.selected.type === "hand") {
      moved = movement.moveHandCardToFoundation(context.state, context.selected.index, foundationSuit);
    } else if (context.selected.type === "tableau") {
      var column = context.state.tableau[context.selected.columnIndex];
      if (context.selected.cardIndex === column.length - 1) {
        moved = movement.moveTableauCardToFoundation(context.state, context.selected.columnIndex, foundationSuit);
      }
    }

    context.selected = null;
    context.render(moved ? "Moved to foundation." : "That foundation move is not legal.");
  }

  function moveSelectionToTableau(context, columnIndex) {
    var moved = false;
    if (context.selected.type === "hand") {
      moved = movement.moveHandCardToTableau(context.state, context.selected.index, columnIndex);
    } else if (context.selected.type === "tableau") {
      moved = movement.moveTableauStack(context.state, context.selected.columnIndex, context.selected.cardIndex, columnIndex);
    }

    context.selected = null;
    context.render(moved ? "Moved to tableau." : "That tableau move is not legal.");
  }

  function selectTableauCard(context, cardElement) {
    var columnIndex = Number(cardElement.dataset.columnIndex);
    var cardIndex = Number(cardElement.dataset.cardIndex);
    var card = context.state.tableau[columnIndex][cardIndex];
    if (!card.faceUp) {
      context.render("Face-down cards are locked until uncovered.");
      return;
    }
    context.selected = {
      type: "tableau",
      columnIndex: columnIndex,
      cardIndex: cardIndex
    };
    context.render();
  }

  function canWasteSelectedTableauCard(context) {
    if (!context.selected || context.selected.type !== "tableau") {
      return false;
    }
    var column = context.state.tableau[context.selected.columnIndex];
    return column.length > 0 && context.selected.cardIndex === column.length - 1 && column[context.selected.cardIndex].faceUp;
  }

  function wasteSelectedTableauCard(context) {
    if (!canWasteSelectedTableauCard(context)) {
      context.render("Only the top face-up card of a tableau column can be wasted.");
      return;
    }
    var card = movement.wasteTopTableauCard(context.state, context.selected.columnIndex);
    context.selected = null;
    context.render(card ? "Wasted " + cards.cardLabel(card) + " from tableau." : "Only the top face-up card of a tableau column can be wasted.");
  }

  function handleDragStart(context, event) {
    var handCard = event.target.closest("[data-hand-index]");
    var tableauCard = event.target.closest("[data-card-index]");

    if (handCard) {
      context.dragSelection = {
        type: "hand",
        index: Number(handCard.dataset.handIndex)
      };
    } else if (tableauCard) {
      var columnIndex = Number(tableauCard.dataset.columnIndex);
      var cardIndex = Number(tableauCard.dataset.cardIndex);
      var card = context.state.tableau[columnIndex][cardIndex];
      if (!card || !card.faceUp) {
        event.preventDefault();
        return;
      }
      context.dragSelection = {
        type: "tableau",
        columnIndex: columnIndex,
        cardIndex: cardIndex
      };
    } else {
      return;
    }

    context.selected = context.dragSelection;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(context.dragSelection));
  }

  function handleDragEnd(context) {
    if (context.dragSelection) {
      context.selected = null;
      context.dragSelection = null;
      context.render();
    }
    document.querySelectorAll(".drag-over").forEach(function (element) {
      element.classList.remove("drag-over");
    });
  }

  function handleDragOver(context, event) {
    if (!context.dragSelection) {
      return;
    }
    var target = event.target.closest("[data-drop-target]");
    if (!target) {
      return;
    }
    if (target.dataset.dropTarget === "waste" && !canWasteSelectedTableauCard(context)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    target.classList.add("drag-over");
  }

  function handleDragLeave(event) {
    var target = event.target.closest("[data-drop-target]");
    if (target && !target.contains(event.relatedTarget)) {
      target.classList.remove("drag-over");
    }
  }

  function handleDrop(context, event) {
    if (!context.dragSelection) {
      return;
    }
    var target = event.target.closest("[data-drop-target]");
    if (!target) {
      return;
    }
    if (target.dataset.dropTarget === "waste" && !canWasteSelectedTableauCard(context)) {
      return;
    }

    event.preventDefault();
    target.classList.remove("drag-over");
    context.selected = context.dragSelection;
    context.dragSelection = null;

    if (target.dataset.dropTarget === "foundation") {
      moveSelectionToFoundation(context, target.dataset.foundationSuit);
      return;
    }

    if (target.dataset.dropTarget === "waste") {
      wasteSelectedTableauCard(context);
      return;
    }

    moveSelectionToTableau(context, Number(target.dataset.columnIndex));
  }

  window.DragDrop = {
    bindDragDrop: bindDragDrop
  };
})();

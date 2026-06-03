(function () {
  "use strict";

  var rules = window.SolitaireRules;
  var state = null;
  var selected = null;
  var dragSelection = null;
  var revealAnimationCards = {};
  var lastHandRefreshAt = 0;
  var HAND_REFRESH_GUARD_MS = 700;

  var elements = {
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
    refreshHandButton: document.getElementById("refresh-hand-button")
  };

  function startNewGame() {
    state = rules.buildShuffledGame(Date.now());
    selected = null;
    render("New shuffled deal ready.");
  }

  function refreshCurrentHand() {
    var now = Date.now();
    if (now - lastHandRefreshAt < HAND_REFRESH_GUARD_MS) {
      render("Hand already refreshed.");
      return;
    }
    lastHandRefreshAt = now;
    var result = rules.refreshHand(state);
    selected = null;
    if (result && result.recycleEvents && result.recycleEvents.length) {
      render(result.recycleEvents[0].message);
      return;
    }

    render(result && result.pressureEvent
      ? result.pressureEvent.message
      : "Unplayed hand cards moved to waste. Drew a new hand.");
  }

  function render(message) {
    var previousCardRects = captureCardRects();
    revealAnimationCards = getFaceDownCardLookup(previousCardRects);
    elements.stockCount.textContent = state.stock.length;
    elements.wasteCount.textContent = state.waste.length;
    elements.status.textContent = rules.hasWon(state) ? "You won." : message || nextHint();
    renderFoundations();
    renderTransformation();
    renderHand();
    renderTableau();
    animateCardMovement(previousCardRects);
    revealAnimationCards = {};
  }

  function getFaceDownCardLookup(previousCardRects) {
    return Object.keys(previousCardRects).reduce(function (lookup, cardId) {
      if (previousCardRects[cardId].faceDown) {
        lookup[cardId] = true;
      }
      return lookup;
    }, {});
  }

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

      if (!moved && !revealed) {
        return;
      }

      if (revealed) {
        return;
      }

      element.animate(
        [
          {
            transform: "translate(" + deltaX + "px, " + deltaY + "px) scale(0.98)",
            filter: revealed ? "brightness(1.22)" : "brightness(1)"
          },
          {
            transform: "translate(0, 0) scale(1)",
            filter: "brightness(1)"
          }
        ],
        {
          duration: revealed ? 360 : 260,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
        }
      );
    });
  }

  function renderTransformation() {
    var transformationState = state.transformationState || rules.createTransformationState();
    var tracks = [
      "face",
      "voice",
      "mind",
      "hair",
      "waistHips",
      "genitals",
      "handsArms",
      "legsFeet",
      "breasts",
      "torso",
      "clothing"
    ];

    elements.transformationStats.innerHTML = "";
    tracks.forEach(function (track) {
      var stat = document.createElement("div");
      var value = transformationState[track];
      stat.className = "tf-stat";

      stat.appendChild(createTransformationStatHeader(track, value));
      stat.appendChild(createTransformationSegments(value));
      elements.transformationStats.appendChild(stat);
    });

    var pressure = document.createElement("div");
    pressure.className = "tf-stat tf-stat-curse";
    pressure.innerHTML =
      '<div class="tf-stat-header"><span class="tf-label">Curse Pressure</span><span class="tf-value">' +
      (state.cursePressure || 0) +
      "</span></div>";
    elements.transformationStats.appendChild(pressure);
    elements.transformationLog.innerHTML = "";
    (state.transformationLog || []).forEach(function (event) {
      if (!event.uiTimestamp) {
        event.uiTimestamp = formatLogTime(new Date());
      }
      var entry = document.createElement("p");
      entry.className = "transformation-log-entry";
      entry.dataset.transformationSeverity = event.severity;
      entry.dataset.transformationTrack = event.track;
      entry.innerHTML =
        '<span class="event-log-time">' +
        event.uiTimestamp +
        '</span><span class="event-log-message">' +
        event.message +
        "</span>";
      elements.transformationLog.appendChild(entry);
    });
    elements.transformationLog.scrollTop = elements.transformationLog.scrollHeight;
  }

  function formatLogTime(date) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatTrackName(track) {
    return track.replace(/([A-Z])/g, " $1").replace(/^./, function (letter) {
      return letter.toUpperCase();
    });
  }

  function createTransformationStatHeader(track, value) {
    var header = document.createElement("div");
    header.className = "tf-stat-header";

    var label = document.createElement("span");
    label.className = "tf-label";
    label.innerHTML =
      '<span class="tf-suit ' +
      getSuitForTrack(track) +
      '">' +
      getSuitSymbolForTrack(track) +
      "</span>" +
      formatTrackName(track);

    var stage = document.createElement("span");
    stage.className = "tf-value";
    stage.textContent = value + "/5";

    header.appendChild(label);
    header.appendChild(stage);
    return header;
  }

  function createTransformationSegments(value) {
    var segments = document.createElement("div");
    segments.className = "tf-segments";

    for (var index = 0; index < 5; index += 1) {
      var segment = document.createElement("span");
      segment.className = index < value ? "tf-segment active" : "tf-segment";
      segments.appendChild(segment);
    }

    return segments;
  }

  function getSuitForTrack(track) {
    if (["face", "voice", "mind", "hair"].indexOf(track) !== -1) {
      return "hearts";
    }
    if (["waistHips", "genitals"].indexOf(track) !== -1) {
      return "diamonds";
    }
    if (["handsArms", "legsFeet"].indexOf(track) !== -1) {
      return "clubs";
    }
    return "spades";
  }

  function getSuitSymbolForTrack(track) {
    return {
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣",
      spades: "♠"
    }[getSuitForTrack(track)];
  }

  function nextHint() {
    if (selected) {
      return "Choose a legal destination.";
    }
    return "Select or drag a hand card or a face-up tableau card.";
  }

  function canWasteSelectedTableauCard() {
    if (!selected || selected.type !== "tableau") {
      return false;
    }
    var column = state.tableau[selected.columnIndex];
    return column.length > 0 && selected.cardIndex === column.length - 1 && column[selected.cardIndex].faceUp;
  }

  function renderFoundations() {
    elements.foundations.innerHTML = "";
    rules.SUITS.forEach(function (suit) {
      var pile = state.foundations[suit];
      var foundation = document.createElement("button");
      foundation.type = "button";
      foundation.className = "pile foundation " + suit;
      foundation.dataset.foundationSuit = suit;
      foundation.dataset.dropTarget = "foundation";
      foundation.setAttribute("aria-label", suit + " foundation");

      if (pile.length) {
        foundation.appendChild(createCardFace(pile[pile.length - 1]));
      } else {
        foundation.innerHTML = '<span class="foundation-suit">' + suitSymbol(suit) + "</span>";
      }

      elements.foundations.appendChild(foundation);
    });
  }

  function renderHand() {
    elements.hand.innerHTML = "";
    if (!state.hand.length) {
      var empty = document.createElement("p");
      empty.className = "empty-note";
      empty.textContent = "Hand empty";
      elements.hand.appendChild(empty);
      return;
    }

    state.hand.forEach(function (card, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "card-button hand-card";
      button.dataset.handIndex = index;
      button.draggable = true;
      if (selected && selected.type === "hand" && selected.index === index) {
        button.classList.add("selected");
      }
      button.appendChild(createCardFace(card));
      elements.hand.appendChild(button);
    });
  }

  function renderTableau() {
    elements.tableau.innerHTML = "";
    state.tableau.forEach(function (column, columnIndex) {
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
          cardElement.appendChild(createCardFace(card));
        } else {
          cardElement.classList.add("facedown");
          cardElement.setAttribute("aria-label", "Face-down card");
          cardElement.appendChild(createCardBackImage());
        }

        if (
          selected &&
          selected.type === "tableau" &&
          selected.columnIndex === columnIndex &&
          cardIndex >= selected.cardIndex
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
      elements.tableau.appendChild(columnElement);
    });
  }

  function createCardFace(card) {
    var face = document.createElement("span");
    var isReveal = Boolean(revealAnimationCards[card.id]);
    face.className = "card-face card-image-face " + (isReveal ? "card-reveal-flip " : "card-animate ") + rules.cardColor(card);
    face.dataset.cardId = card.id;
    var image = document.createElement("img");
    var imagePath = getCardImagePath(card);
    image.className = "card-image";
    image.src = imagePath;
    image.alt = getCardImageAlt(card);
    image.onerror = function () {
      console.warn("Missing card image:", imagePath);
      image.remove();
      face.classList.remove("card-image-face");
      face.classList.add("card-image-missing");
      appendGeneratedCardFaceContent(face, card);
    };
    face.appendChild(image);
    return face;
  }

  function appendGeneratedCardFaceContent(face, card) {
    face.appendChild(createCardCorner(card, "top"));

    if (card.rank <= 10) {
      face.appendChild(createPipArea(card));
    } else {
      face.appendChild(createCourtPlaceholder(card));
    }

    face.appendChild(createCardCorner(card, "bottom"));
  }

  function createCardBackImage() {
    var image = document.createElement("img");
    image.className = "card-image card-back-image";
    image.src = "images/cards/back.svg";
    image.alt = "Face-down card";
    image.onerror = function () {
      image.remove();
    };
    return image;
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

  function createCardCorner(card, position) {
    var corner = document.createElement("span");
    corner.className = "card-corner " + position;
    corner.innerHTML =
      '<span class="rank">' +
      rules.cardLabel(card).slice(0, -1) +
      '</span><span class="suit">' +
      suitSymbol(card.suit) +
      "</span>";
    return corner;
  }

  function createPipArea(card) {
    var pipArea = document.createElement("span");
    pipArea.className = "pip-area";
    getPipPositions(card.rank).forEach(function (position) {
      var pip = document.createElement("span");
      pip.className = "pip pip-" + position;
      pip.textContent = suitSymbol(card.suit);
      pipArea.appendChild(pip);
    });
    return pipArea;
  }

  function createCourtPlaceholder(card) {
    var court = document.createElement("span");
    court.className = "court-placeholder";
    court.textContent = rules.cardLabel(card).slice(0, -1);
    return court;
  }

  function getPipPositions(rank) {
    return {
      1: ["center"],
      2: ["top-center", "bottom-center"],
      3: ["top-center", "center", "bottom-center"],
      4: ["upper-left", "upper-right", "lower-left", "lower-right"],
      5: ["upper-left", "upper-right", "center", "lower-left", "lower-right"],
      6: ["upper-left", "upper-right", "middle-left", "middle-right", "lower-left", "lower-right"],
      7: ["top-center", "upper-left", "upper-right", "middle-left", "middle-right", "lower-left", "lower-right"],
      8: ["top-center", "upper-left", "upper-right", "middle-left", "middle-right", "lower-left", "lower-right", "bottom-center"],
      9: ["top-center", "upper-left", "upper-right", "middle-left", "center", "middle-right", "lower-left", "lower-right", "bottom-center"],
      10: ["top-center", "upper-left", "upper-right", "middle-left", "middle-right", "lower-left", "lower-right", "bottom-center", "extra-upper-center", "extra-lower-center"]
    }[rank] || [];
  }

  window.SevenHandSolitaireDev = {
    getCardImagePath: getCardImagePath,
    getPipPositions: getPipPositions,
    testPipCounts: function () {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every(function (rank) {
        var positions = getPipPositions(rank);
        console.assert(positions.length === rank, "Rank " + rank + " has " + positions.length + " pips");
        return positions.length === rank;
      });
    }
  };

  function suitSymbol(suit) {
    return {
      spades: "♠",
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣"
    }[suit];
  }

  function handleHandClick(event) {
    var button = event.target.closest("[data-hand-index]");
    if (!button) {
      return;
    }
    selected = {
      type: "hand",
      index: Number(button.dataset.handIndex)
    };
    render();
  }

  function handleFoundationClick(event) {
    var foundation = event.target.closest("[data-foundation-suit]");
    if (!foundation || !selected) {
      return;
    }

    moveSelectionToFoundation(foundation.dataset.foundationSuit);
  }

  function moveSelectionToFoundation(foundationSuit) {
    var moved = false;
    if (selected.type === "hand") {
      moved = rules.moveHandCardToFoundation(state, selected.index, foundationSuit);
    } else if (selected.type === "tableau") {
      var column = state.tableau[selected.columnIndex];
      if (selected.cardIndex === column.length - 1) {
        moved = rules.moveTableauCardToFoundation(state, selected.columnIndex, foundationSuit);
      }
    }

    selected = null;
    render(moved ? "Moved to foundation." : "That foundation move is not legal.");
  }

  function handleTableauClick(event) {
    var clickedCard = event.target.closest("[data-card-index]");
    var clickedColumn = event.target.closest("[data-column-index]");
    if (!clickedColumn) {
      return;
    }

    var columnIndex = Number(clickedColumn.dataset.columnIndex);
    if (!selected && clickedCard) {
      selectTableauCard(clickedCard);
      return;
    }

    if (selected) {
      moveSelectionToTableau(columnIndex);
    }
  }

  function selectTableauCard(cardElement) {
    var columnIndex = Number(cardElement.dataset.columnIndex);
    var cardIndex = Number(cardElement.dataset.cardIndex);
    var card = state.tableau[columnIndex][cardIndex];
    if (!card.faceUp) {
      render("Face-down cards are locked until uncovered.");
      return;
    }
    selected = {
      type: "tableau",
      columnIndex: columnIndex,
      cardIndex: cardIndex
    };
    render();
  }

  function moveSelectionToTableau(columnIndex) {
    var moved = false;
    if (selected.type === "hand") {
      moved = rules.moveHandCardToTableau(state, selected.index, columnIndex);
    } else if (selected.type === "tableau") {
      moved = rules.moveTableauStack(state, selected.columnIndex, selected.cardIndex, columnIndex);
    }

    selected = null;
    render(moved ? "Moved to tableau." : "That tableau move is not legal.");
  }

  function handleDragStart(event) {
    var handCard = event.target.closest("[data-hand-index]");
    var tableauCard = event.target.closest("[data-card-index]");

    if (handCard) {
      dragSelection = {
        type: "hand",
        index: Number(handCard.dataset.handIndex)
      };
    } else if (tableauCard) {
      var columnIndex = Number(tableauCard.dataset.columnIndex);
      var cardIndex = Number(tableauCard.dataset.cardIndex);
      var card = state.tableau[columnIndex][cardIndex];
      if (!card || !card.faceUp) {
        event.preventDefault();
        return;
      }
      dragSelection = {
        type: "tableau",
        columnIndex: columnIndex,
        cardIndex: cardIndex
      };
    } else {
      return;
    }

    selected = dragSelection;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(dragSelection));
  }

  function handleDragEnd() {
    if (dragSelection) {
      selected = null;
      dragSelection = null;
      render();
    }
    document.querySelectorAll(".drag-over").forEach(function (element) {
      element.classList.remove("drag-over");
    });
  }

  function handleDragOver(event) {
    if (!dragSelection) {
      return;
    }
    var target = event.target.closest("[data-drop-target]");
    if (!target) {
      return;
    }
    if (target.dataset.dropTarget === "waste" && !canWasteSelectedTableauCard()) {
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

  function handleDrop(event) {
    if (!dragSelection) {
      return;
    }
    var target = event.target.closest("[data-drop-target]");
    if (!target) {
      return;
    }
    if (target.dataset.dropTarget === "waste" && !canWasteSelectedTableauCard()) {
      return;
    }

    event.preventDefault();
    target.classList.remove("drag-over");
    selected = dragSelection;
    dragSelection = null;

    if (target.dataset.dropTarget === "foundation") {
      moveSelectionToFoundation(target.dataset.foundationSuit);
      return;
    }

    if (target.dataset.dropTarget === "waste") {
      wasteSelectedTableauCard();
      return;
    }

    moveSelectionToTableau(Number(target.dataset.columnIndex));
  }

  function wasteSelectedTableauCard() {
    if (!canWasteSelectedTableauCard()) {
      render("Only the top face-up card of a tableau column can be wasted.");
      return;
    }

    var card = rules.wasteTopTableauCard(state, selected.columnIndex);
    selected = null;
    render(card ? "Wasted " + rules.cardLabel(card) + " from tableau." : "Only the top face-up card of a tableau column can be wasted.");
  }

  elements.newGameButton.addEventListener("click", startNewGame);
  elements.refreshHandButton.addEventListener("click", refreshCurrentHand);
  elements.clearLogButton.addEventListener("click", function () {
    state.transformationLog = [];
    render("Event log cleared.");
  });
  elements.stockPile.addEventListener("click", refreshCurrentHand);
  elements.hand.addEventListener("click", handleHandClick);
  elements.foundations.addEventListener("click", handleFoundationClick);
  elements.tableau.addEventListener("click", handleTableauClick);
  document.addEventListener("dragstart", handleDragStart);
  document.addEventListener("dragend", handleDragEnd);
  document.addEventListener("dragover", handleDragOver);
  document.addEventListener("dragleave", handleDragLeave);
  document.addEventListener("drop", handleDrop);

  startNewGame();
})();

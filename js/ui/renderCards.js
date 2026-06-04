(function () {
  "use strict";

  var cards = window.SolitaireCards;

  function createCardFace(card, revealAnimationCards) {
    var face = document.createElement("span");
    var isReveal = Boolean(revealAnimationCards && revealAnimationCards[card.id]);
    face.className = "card-face card-image-face " + (isReveal ? "card-reveal-flip " : "card-animate ") + cards.cardColor(card);
    face.dataset.cardId = card.id;

    var image = document.createElement("img");
    var imagePath = cards.getCardImagePath(card);
    image.className = "card-image";
    image.src = imagePath;
    image.alt = cards.getCardImageAlt(card);
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
    face.appendChild(createCourtPlaceholder(card));
    face.appendChild(createCardCorner(card, "bottom"));
  }

  function createCardCorner(card, position) {
    var corner = document.createElement("span");
    corner.className = "card-corner " + position;
    corner.innerHTML =
      '<span class="rank">' +
      cards.cardLabel(card).slice(0, -1) +
      '</span><span class="suit">' +
      cards.suitSymbol(card.suit) +
      "</span>";
    return corner;
  }

  function createCourtPlaceholder(card) {
    var court = document.createElement("span");
    court.className = "court-placeholder";
    court.textContent = cards.cardLabel(card);
    return court;
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

  window.CardRenderer = {
    createCardFace: createCardFace,
    createCardBackImage: createCardBackImage
  };
})();

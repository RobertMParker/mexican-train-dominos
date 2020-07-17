// Make hand a global, since it is a singleton. Don't judge me!
var HAND = null;

class Hand {
  constructor(dominos, x, y, layer) {
    this.dominos = dominos;
    this.x = x;
    this.y = y;
    
    var line = new Konva.Line({
      points: [0, y, window.innerWidth, y],
      stroke: 'black',
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    });
  
    layer.add(line);
    HAND = this;
  }
  
  onGamestateChanged(gamestate, wasReset) {
    var DOMINO_VERTICAL_PADDING = 10;
    var DOMINO_HORIZONTAL_PADDING = 10;
    var MAX_HAND_COLUMNS = 10;

    const hand = gamestate.currentHand;

    // Make sure that all dominos in the hand are draggable
    for(var i=0; i<hand.length; i++) {
      var img = this.dominos[Domino.originalKey(hand[i])].img;
      img.draggable(true);
    }

    // Find the dominos that are already displayed in the hand
    var dominosAlreadyDisplayedInHand = [];
    if (!wasReset) {
      for(var i=0; i<hand.length; i++) {
        var img = this.dominos[Domino.originalKey(hand[i])].img;
        if (img.visible()) {
          if (img.y() > this.y) {
            dominosAlreadyDisplayedInHand.push(hand[i]);
          }
        }
      }
    }

    var col = 0; 
    var row = 0; 

    for(var i=0; i<hand.length; i++) {
      const key = hand[i];
      if (dominosAlreadyDisplayedInHand.includes(key)) {
        continue;
      }
      var domino = this.dominos[Domino.originalKey(hand[i])];
      domino.rotateToMatch(domino.key);

      // Draw the domino in the first spot that doesn't overlap with other dominos.  And
      // then for subsequent dominos, keep going to the next spot.
      do {
        domino.relativeX((col * (Domino.width() + DOMINO_HORIZONTAL_PADDING)) + this.x);
        domino.relativeY((row * (Domino.height() + DOMINO_VERTICAL_PADDING)) + this.y + Domino.height());

        // Increment counters
        col++;
        if(col >= MAX_HAND_COLUMNS) {
            row++;
            col=0;
        }

        if (row > 10) {
          console.log("Probably stuck in an infinite loop...");
          break;
        }
      } while (this.overlapsWithAny(domino, dominosAlreadyDisplayedInHand));
      dominosAlreadyDisplayedInHand.push(key);
      domino.img.visible(true);
    }
  }

  overlapsWithAny(domino, keySet) {
    for(var i=0; i<keySet.length; i++) {
      if (this.overlaps(domino, keySet[i])) {
        return true;
      }
    }
    return false;
  }

  // TODO: move this into Domino
  overlaps(domino1, key) {
    const domino2 = this.dominos[Domino.originalKey(key)];

    return !(
      domino2.relativeX() > domino1.relativeX() + Domino.width() ||
      domino2.relativeX() + Domino.width() < domino1.relativeX() ||
      domino2.relativeY() > domino1.relativeY() + Domino.height() ||
      domino2.relativeY() + Domino.height() < domino1.relativeY()
    );
  }
}
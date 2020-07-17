
class Domino {
  constructor(key, layer, onDominoMovedCallback) {
    // This key will not change
    this.key = key;
    this.layer = layer;
    this.onDominoMovedCallback = onDominoMovedCallback;
    this.img = null;
    this.dragStartedX = 0;
    this.dragStartedY = 0;
    
    var imageObj = new Image();
    imageObj.src = './assets/domino' + key + '.png';    
    this.img = new Konva.Image({
      image: imageObj,
      x: 0,
      y: 0,
      width: Domino.width(),
      height: Domino.height(),
      draggable: false,
      rotation: 0,
      visible: false,
    });

    // add cursor styling
    this.img.on('mouseover', function() {
      document.body.style.cursor = 'pointer';
    });
    this.img.on('mouseout', function() {
      document.body.style.cursor = 'default';
    });
    this.img.on('dblclick dbltap', function() {
      console.log('Double click on domino: ' + this.key);      
      if (this.relativeY() < HAND.y) {
        console.log('Domino is not in hand, can not flip');
        return;
      }
      
      if (Domino.isDouble(this.key)){
        console.log('Domino is a double, can not flip');
        return;
      }
      this._rotateInPlace();    
      this.layer.batchDraw();
    }.bind(this));

    this.img.on('dragstart', function() {
      console.log('dragstart for: ' + this.key);
      
      this.dragStartedX = this.img.x();
      this.dragStartedY = this.img.y();
    }.bind(this));

    this.img.on('dragend', function() {
      console.log('dragend for: ' + this.key);

      if (!this.onDominoMovedCallback(this)) {
        if (this.relativeY() < HAND.y) {
          // Domino was dragged out of the hand, snap it back to where it started from
          this.img.x(this.dragStartedX);
          this.img.y(this.dragStartedY);
          this.layer.batchDraw();
        }
      }
    }.bind(this));

    // Without this, the dominos may not render correctly until moved.
    imageObj.onload = function() {
      // add the shape to the layer
      this.layer.add(this.img);
      this.layer.batchDraw();
    }.bind(this);
  }
  
  get relativeKey() {
    if (this.isRotated) {
      return Domino.rotateKey(this.key);
    }
    return this.key;
  }

  get isRotated() {
    return this.img.rotation() != 0;
  }
  
  rotateToMatch(key) {
    if (Domino.isKeyRotated(key)) {
      this.img.rotation(180);
    } else {
      this.img.rotation(0);
    }
  }
  
  _rotateInPlace() {
    if (this.isRotated) {
      this.img.rotation(0);
      this.img.x(this.img.x() - Domino.width());
      this.img.y(this.img.y() - Domino.height());
    } else {
      this.img.rotation(180);
      this.img.x(this.img.x() + Domino.width());
      this.img.y(this.img.y() + Domino.height());
    }
  }
  
  reset() {
    this.img.width(Domino.width());
    this.img.height(Domino.height());
  }
  
  // A getter/setter that allows for relative coordinates, and hides the rotation stuff
  relativeX(x) {
    if (x != null) {
      if (this.isRotated) {
        this.img.x(x + Domino.width());
      } else {
        this.img.x(x);
      }
    }
    if (this.isRotated) {
      return this.img.x() - Domino.width();
    }
    return this.img.x();
  }
  
  // A getter/setter that allows for relative coordinates, and hides the rotation stuff
  relativeY(y) {
    if (y != null) {
      if (this.isRotated) {
        this.img.y(y + Domino.height());
      } else {
        this.img.y(y);
      }
    }
    if (this.isRotated) {
      return this.img.y() - Domino.height();
    }
    return this.img.y();
  }
  
  static height() {
    return 35;
  }
  static width() {
    return Math.floor(this.height() * 2);
  }
  
  // Create a key based on leftValue and rightValue
  static createKey(leftValue, rightValue) {
    if (leftValue >= rightValue) {
      return '' + leftValue + '-' + rightValue;
    }
    return '' + rightValue + '-' + leftValue;
  }

  static generateAllDominoKeys(maxDouble) {
    var result = [];
    for (var leftValue = 0; leftValue <= maxDouble; leftValue++) {
      for (var rightValue = 0; rightValue <= leftValue; rightValue++) {
        result.push(Domino.createKey(leftValue, rightValue));
      }
    }
    return result;
  }

  static isKeyRotated(key) {
    var values = key.split('-');
    return parseInt(values[0]) < parseInt(values[1]);
  }

  static rotateKey(key) {
    var values = key.split('-');
    return values[1] + '-' + values[0];
  }

  static originalKey(key) {
    if (Domino.isKeyRotated(key)) {
      return Domino.rotateKey(key);
    }
    return key;
  }

  static isDouble(key) {
    var res = key.split("-");
    return res[0] == res[1];
  }
  
  static createAllDominos(maxDouble, layer, onDominoMovedCallback) {
    var dominos = {};
    const keys = Domino.generateAllDominoKeys(maxDouble);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      dominos[key] = new Domino(key, layer, onDominoMovedCallback);
    }
    return dominos;
  }
}





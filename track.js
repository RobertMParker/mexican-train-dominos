const TRAIN_HEIGHT = Domino.height();
const TRAIN_WIDTH = Math.floor(Domino.height() * 1.5);

// Each player has a track with their name
class Track {
  constructor(username, layer, dominos, x, y) {
    this.username = username;
    this.layer = layer;
    this.dominos = dominos;
    
    // These are the upper left hand coordinates of where the track starts
    this.x = x;
    this.y = y;
    
    this.usernameText = null;
    this.handLengthText = null;
    
    this.trainImg = null;
    this.ellipsisImg = null;
    
    this.animation = null;
    
    this._onLoad(layer);
  }
  
  static height() {
    return Domino.height() + 2 * this.verticalPadding();
  }
  
  static verticalPadding() {
    return 5;
  }
  
  _onLoad(layer) {
    this._createTrainImage(layer);
    this._createEllipsisImage(layer);
    
    this.usernameText = new Konva.Text({
        x: this.x,
        y: this.y + 15,
        text: this.username,
        fontSize: 25,
        fontFamily: 'Calibri',
        fill: 'black',
        listening: false,
      });
    layer.add(this.usernameText);
    
    if (this.username != "Public") {
      this.handLengthText = new Konva.Text({
          x: this.usernameText.x()+100,
          y: this.usernameText.y()+10,
          text: "99",
          fontSize: 15,
          fontFamily: 'Calibri',
          fill: 'black',
          listening: false,
        });
      layer.add(this.handLengthText);
    }
    
    var bottomLine = new Konva.Line({
      points: [this.x, this.y + Track.height(), window.innerWidth, this.y + Track.height()],
      stroke: 'black',
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    });
    layer.add(bottomLine);
  }
  
  // Callback that is triggered when the gamestate changes
  onGamestateChanged(gamestate){
    const MAX_DOMINOES_TO_SHOW_PER_TRAIN = 6;
    const X_OFFSET = 120 + this.x;
    
    if (this.username == gamestate.currentUser) {
      this.usernameText.fontStyle('Bold');
    }
    
    this.usernameText.fill(gamestate.userWithCurrentTurn == this.username ? 'red' : 'black');
    if (this.handLengthText != null) {
      this.handLengthText.text('' + gamestate.hands[this.username].length);
    }
    
    var dominos = gamestate.track(this.username);
    if ( dominos.length > MAX_DOMINOES_TO_SHOW_PER_TRAIN) {
      // Remove dominos in the middle-ish, and make invisible
      var removed = dominos.splice(1, dominos.length - MAX_DOMINOES_TO_SHOW_PER_TRAIN);
      for(var i=0; i<removed.length; i++) {
        this.dominos[Domino.originalKey(removed[i])].img.visible(false);
      }
      // Add in a ellipsis
      dominos.splice(1, 0, "ellipsis");
    } else {
      // Triggered on a reset
      this.ellipsisImg.visible(false);
    }
    
    for (var i=0; i<dominos.length; i++) {
      var key = dominos[i];
      if (key == "ellipsis") {
        this.ellipsisImg.x(Domino.width()*i + X_OFFSET + (Domino.width() - this.ellipsisImg.width())/2);
        this.ellipsisImg.y(this.y + 5);
        this.ellipsisImg.visible(true);
      } else {
        var domino = this.dominos[Domino.originalKey(key)];
        domino.rotateToMatch(key);
        domino.relativeX(Domino.width()*i + X_OFFSET);
        domino.relativeY(this.y + 5);
        domino.img.visible(true);
        domino.img.draggable(false);
      }
    }
    
    // Draw train
    if (this.username != "Public") {
      this.trainImg.x(Domino.width() * dominos.length + X_OFFSET + 10);
      this.trainImg.y(this.y + 5); 
      this.trainImg.visible(gamestate.trainEngineUp(this.username));
    }
    
    if (this.username == gamestate.winner) {
      this._setWinner(gamestate);
    }
  }
  
  _setWinner(gamestate) {
    // This is cheesy, but people love this shit.
    const train = gamestate.track(gamestate.winner);
    
    this.animation = new Konva.Animation(function(frame) {
      var scale1 = Math.abs(Math.sin((frame.time * 2 * Math.PI) / 2000)) + 0.5;
      this.usernameText.fontSize(30 * scale1);

      for(var i=0; i<train.length; i++) {
        var dominoImg = this.dominos[Domino.originalKey(train[i])].img;
        var scale2 = Math.abs(Math.sin(((frame.time + i*100)  * 2 * Math.PI) / 2000)) + 0.5;
        dominoImg.width(Domino.width() * scale2);
        dominoImg.height(Domino.height() * scale2);
      }

      // Stop animation after 10 seconds
      if (frame.time > 10 * 1000) {
        console.log("Stopping animation and resetting");
        this.animation.stop();
        this.usernameText.fontSize(30);
        // Reset all dominos
        for (var key in this.dominos) {
          this.dominos[key].reset();
        }
      }
    }.bind(this), this.layer);
    this.animation.start();
  }
  
  // Returns true if the coordinate is within the track
  contains(x, y) {
    return this.y < y && (this.y + Track.height()) > y && x > this.x;
  }
  
  _createTrainImage(layer) {
    var imageObj = new Image();
    imageObj.src = './assets/train-engine.png';    
    this.trainImg = new Konva.Image({
      image: imageObj,
      x: 0,
      y: 0,
      width: TRAIN_WIDTH,
      height: TRAIN_HEIGHT,
      draggable: false,
      rotation: 0,
      visible: false,
      name: 'train-' + this.username,
      listening: false,
    });

    imageObj.onload = function() {
      layer.add(this.trainImg);
      layer.batchDraw();
    }.bind(this);
  }

  _createEllipsisImage(layer) {
    var imageObj = new Image();
    imageObj.src = './assets/ellipsis.jpg';    
    this.ellipsisImg = new Konva.Image({
      image: imageObj,
      x: 0,
      y: 0,
      width: Domino.height(),
      height: Domino.height(),
      draggable: false,
      rotation: 0,
      visible: false,
      name: 'ellipsis-' + this.username,
      listening: false,
    });

    imageObj.onload = function() {
      layer.add(this.ellipsisImg);
      layer.batchDraw();
    }.bind(this);
  }
}

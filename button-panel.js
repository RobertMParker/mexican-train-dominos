class Button {
  constructor(x, y, display_text, clickHandler, layer) {
    this.enabled = true;
    this.x = x;
    this.y = y;
    this.text = new Konva.Text({
      x: x,
      y: y,
      width: Button.width(),
      text: display_text,
      fontSize: 18,
      fontFamily: 'Calibri',
      fill: '#555',
      align: 'center',
      padding: 10,
    });
    this.rect = new Konva.Rect({
      x: this.text.x(),
      y: this.text.y(),
      stroke: '#555',
      strokeWidth: 5,
      fill: '#ddd',
      width: Button.width(),
      height: Button.height(),
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      shadowOpacity: 0.2,
      cornerRadius: 10
    });
    this.text.on('mouseover', function() {
      document.body.style.cursor = 'pointer';
    });
    this.text.on('mouseout', function() {
      document.body.style.cursor = 'default';
    });
    // 'mousedown' is for PCs, and 'touchstart' is for ipads and such
    this.text.on('mousedown touchstart', function() {
      console.log('button click - ' + display_text);
      if (clickHandler != null) {
        if (this.enabled) { 
          clickHandler();
        } else {
          console.log('button not enabled');
        }
      } else {
        console.log('No clickhandler assigned.');
      }
    }.bind(this));  
    layer.add(this.rect);
    layer.add(this.text);
  }
  
  enable() {
    this.enabled = true;
    this.text.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
      });
    this.rect.fill('#ddd');
  }

  disable() {
    this.enabled = false;
    this.text.on('mouseover', function() {
        document.body.style.cursor = 'default';
      });
    this.rect.fill('#b3b3b3');
  }
 
  static height() {
    return 35;
  }
  
  static width() {
    return 140;
  }
}


class ButtonPanel {
  constructor(x, y, layer, gamestate) {
    this.gamestate = gamestate;
    this.layer = layer;
    
    this.drawButton = new Button(x, y, "Draw Domino", this._onDrawButton.bind(this), layer);
    this.toggleTrainButton = new Button(this.drawButton.x + Button.width() + 10, y,  "Toggle my train", this._onToggleTrainButton.bind(this), layer);
    this.passButton = new Button(this.toggleTrainButton.x + Button.width() + 10, y, "Pass", this._onPassButton.bind(this), layer);

    if (this.gamestate.admin) {
      this.resetButton = new Button(this.drawButton.x, y + Button.height() + 10, "Reset Game", this._onResetButton.bind(this), layer);
      this.scoreGameButton = new Button(this.resetButton.x + Button.width() + 10, this.resetButton.y, "Score Game", this._scoreGameButton.bind(this), layer);
    }
  }
  
  onGamestateChanged(gamestate) {
    if ((gamestate.isCurrentUsersTurn && !gamestate.drewDomino)) {
      this.drawButton.enable();
    } else {
      this.drawButton.disable();
    }
    
    if (gamestate.canPass) {
      this.passButton.enable();
    } else {
      this.passButton.disable();
    }
  }

  // TODO: Should this live here?  I think I want this functionality to change.
  _scoreGameButton() {
    const scores = this.gamestate.scores;
    var displayText = '';
    for (var username in scores) {
      displayText += '' + username + ': ' + scores[username] + '\n';
    }
    window.alert(displayText);
  }
  
  _onDrawButton() {
    this.gamestate.pickupFromBoneyard();
  }
  
  _onToggleTrainButton() {
    this.gamestate.toggleTrain();
  }
  
  _onPassButton() {
    this.gamestate.pass();
  }
  
  _onResetButton() {
    this.gamestate.reset();
  }
}
// Hey I know this is a mess.  I'm not a JS Dev.  So sue me.

class Board {
  constructor() {
    this.gamestate = new Gamestate(this.onGamestateChanged.bind(this), this.onPrivateMessage.bind(this));
    
    var stage = new Konva.Stage({
        container: 'container',
        width: window.innerWidth,
        height: window.innerHeight
      });
    this.layer = new Konva.Layer();
    stage.add(this.layer);
    this.layer.draw();
                                   
    this.messagesText = null;
    this.tracks = [];
    this.hand = null;
    this.centerTrack = null;
    this.dominos = null;
    this.messagePanel = null;
    this.buttonPanel = null;
    this.isStarted = false;
    this.playedSound = false;
  }
  
  onPrivateMessage(message) {
    console.log('private message: ' + message);
    this.messagePanel.onPrivateMessage(message);
  }

  onGamestateChanged() {
    if (!this.isStarted) {
      console.log('Starting board');
      this.isStarted = true;
      this.dominos = Domino.createAllDominos(this.gamestate.maxDouble, this.layer, this.onDominoMoved.bind(this));
      this._drawBoard();
      this._setTitle();
      this._setPlaySound();
    }
    
    var wasReset = this._ensureHiddenDominosAreHidden();
    for(var i=0; i<this.tracks.length; i++) {
      this.tracks[i].onGamestateChanged(this.gamestate);
    }
    this.centerTrack.onGamestateChanged(this.gamestate);
    this.hand.onGamestateChanged(this.gamestate, wasReset);
    this.messagePanel.onGamestateChanged(this.gamestate);
    this.buttonPanel.onGamestateChanged(this.gamestate);

    this.layer.batchDraw();
  }
  
  // Returns true if the domino is moved, false otherwise
  onDominoMoved(domino) {
    const track = this._getTrack(domino);
    if (track == null) {
      return false;
    }
    if (this.gamestate.isLegalMove(domino.relativeKey, track)) {
      this.gamestate.moveDomino(domino.relativeKey, track);
      return true;
    }
    return false;
  }
  
  _setTitle() {
    // Make the title blink if it is the current user's turn, and constant otherwise.
    // Hopefully this will help speed up the gameplay when users have multiple tabs open.
    setInterval(function() {
      const defaultTitle = 'Mexican Train Dominos!';
      const yourTurnTitle = "It's Your Turn!";
      if (this.gamestate.isCurrentUsersTurn && document.title != yourTurnTitle) {
        document.title = yourTurnTitle;
      } else {
        document.title = defaultTitle;
      }
    }.bind(this), 500);
  }
  
  
  _setPlaySound() {
    // Play a train sound, if it's the user's turn, and the window is out of focus
    // Hopefully this will help speed up the gameplay when users have multiple tabs open.
    setInterval(function() {
      if (!this.gamestate.isCurrentUsersTurn) {
        // Reset if it's another player's turn
        this.playedSound = false;
      }
      
      if (this.gamestate.isCurrentUsersTurn && !document.hasFocus() && this.playedSound == false) {
        this.playedSound = true;
        // Disabled sound for now.
        // new Audio('./assets/Train_Honk_Horn_2x-Mike_Koenig-157974048.mp3').play()
      }
    }.bind(this), 500);
  }

  _drawBoard() {
    var lastY=0;

    const usernames = this.gamestate.usernames;
    // Start at one, so center isn't drawn
    for (var i=1; i<usernames.length; i++) {
      this.tracks.push(new Track(usernames[i], this.layer, this.dominos, CenterTrack.width() + 15, (i-1) * Track.height()));
      lastY += Track.height();
    }

    var centerY = (this.tracks.length * Track.height() - CenterTrack.height())/2 ;
    this.centerTrack = new CenterTrack(5, centerY, this.dominos, this.layer);

    this.messagePanel = new MessagePanel(0, this.tracks.length * Track.height(), this.layer);
    this.buttonPanel = new ButtonPanel(MessagePanel.width() + 10, lastY + 10, this.layer, this.gamestate);
    this.hand = new Hand(this.dominos, 0, this.messagePanel.y + MessagePanel.height(), this.layer);
  }

  _ensureHiddenDominosAreHidden() {
    // This function is important for resets
    var wasReset = false;
    const hiddenDominos = this.gamestate.hiddenDominos;
    for(var i=0; i<hiddenDominos.length; i++) {
      var img = this.dominos[Domino.originalKey(hiddenDominos[i])].img;
      if (img.visible()) {
        img.visible(false);
        wasReset = true;
      }
    }
    // TODO: This can be more robust by checking that the hand matches the expected hand.
    return wasReset;
  }

  // Get the player associated with an x,y coord
  _getTrack(domino) {
    // Use midpoint of domino in calculation
    var x = domino.relativeX() + (Domino.width()/2);
    var y = domino.relativeY() + (Domino.height()/2);

    for(var i=0; i<this.tracks.length; i++) {
      if (this.tracks[i].contains(x, y)) {
        return this.tracks[i].username;
      }
    }
    
    if (this.centerTrack.contains(x, y)) {
      return "Center";
    }
    
    // Not found
    return null;
  }
}

var board = new Board();
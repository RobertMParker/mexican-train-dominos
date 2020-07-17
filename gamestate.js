const CURRENT_USER = getUrlParam("user");
const GAME_ID = getUrlParam("gameId");
const IS_ADMIN = getUrlParam("admin") != null;

// Gamestate holds state about the game that will be shared among all players.
class Gamestate {
  constructor(gamestateChangedCallback, onPrivateMessageCallback) {
    this.tracks = {};
    this.currentTurnIndex = -1;
    this.hands = {};
    this.boneyard = [];
    // Signifies if the last move played was a double, and the user can play again.
    // It is cleared when any player ends their turn.
    this.playedDouble = false;
    // Signifies that a domino was drawn, it is cleared when any player ends their turn
    this.drewDomino = false;
    this.messages = [];
    this.maxDouble = 12;
    this.handSize = 10;

    var db = firebase.firestore();
    
    if (GAME_ID != null) {
      this.docRef = db.doc("games/" + GAME_ID);
      this.docRef.onSnapshot(this.onUpdateFromDatabase.bind(this));
    } else {
      console.log('GAME_ID is not set');
    }
    
    this.gamestateChangedCallback = gamestateChangedCallback;
    this.onPrivateMessageCallback = onPrivateMessageCallback;
  }
  
  // This runs everytime the data is updated
  onUpdateFromDatabase(doc) {
    if (doc && doc.exists) {
      const myData = doc.data();
      console.log('Got update from Firebase');
      this.fromJSON(myData.gamestate);
      this.gamestateChangedCallback();
    }
  }
  
  onPrivateMessage(message) {
    this.onPrivateMessageCallback(message);
  }
  
  // N.B. This does not save, but in most scenarios the state will already be saved.
  onPublicMessage(message) {
    // Only keep last five messages to keep the state small
    if (this.messages.length > 4) {
      this.messages.shift();
    }
    this.messages.push(message);
    console.log(message);
  }
  
  get currentUser() {
    return CURRENT_USER;
  }
  
  get isCurrentUsersTurn() {
    return CURRENT_USER == this.userWithCurrentTurn;
  }
  
  get usernames() {
    var result = [];
    for (var username in this.tracks) {
      result.push(username);
    }
    return result;
  }

  get currentHand() {
    // return a copy of the hand, so it can't be modified
    return this.hands[CURRENT_USER].slice();
  }
  
  get hiddenDominos() {
    var result = [];
    result = result.concat(this.boneyard);
    const usernames = this.usernames;
    for (var i=2; i<usernames.length; i++) {
      if (CURRENT_USER != usernames[i]) {
        const hand = this.hands[usernames[i]];
        result = result.concat(hand);
      }
    }
    return result;
  }
  
  get scores() {
    var scores = {};
    const usernames = this.usernames;
    for(var i=2; i<usernames.length; i++) {
      var score = 0;
      const hand = this.hands[usernames[i]];
      for(var x=0; x<hand.length; x++) {
        var values = hand[x].split('-');
        score += parseInt(values[0]) + parseInt(values[1]);
      }
      scores[usernames[i]] = score;
    }
    return scores;
  }
  
  get recentMessages() {
    return this.messages.slice(); 
  }

  trainEngineUp(username) {
    if (username in this.tracks) {
      return this.tracks[username].trainEngineUp;
    }
    console.log('unknown username: ' + username);
    return null;
  }

  track(username) {
    if (username in this.tracks) {
      return this.tracks[username].dominos.slice();
    }
    console.log('unknown username: ' + username);
    return null;
  }
  
  get admin() {
    return IS_ADMIN;
  }
  
  setMaxDouble(maxDouble) {
    this.maxDouble = maxDouble;
  }
  
  setHandSize(handSize) {
    this.handSize = handSize;
  }
  
  resetInternal(usernames) {
    this.boneyard = Domino.generateAllDominoKeys(this.maxDouble);
    this.playedDouble = false;
    this.drewDomino = false;
    this.currentTurnIndex = 2;
    this.messages = [];
    
    shuffle(this.boneyard);
    
    this.tracks['Center'] = {
          "dominos" : [],
          "trainEngineUp": false,
      };
    
    this.tracks['Public'] = {
          "dominos" : [],
          "trainEngineUp": false,
      };

    // Add hands and tracks for all the users
    for (var i=0; i<usernames.length; i++) {
      const username = usernames[i];
      this.tracks[username] = {
          "dominos" : [],
          "trainEngineUp": false,
      };
      
      if (username != "Center" && username != "Public") {
        var hand = [];
        for (var x=0;x<this.handSize;x++) {
          hand.push(this.boneyard.pop());
        }
        this.hands[username] = hand;
      }
    }
  }
  
  reset() {
    if (!IS_ADMIN) {
      this.onPrivateMessage('Only admins can reset');
      return;
    }
    var usernames = this.usernames;
    this.resetInternal(usernames);
    this.onPublicMessage(CURRENT_USER + " reset the gamestate.");
    this.save();
  }
  
  get userWithCurrentTurn() {
    return Object.keys(this.tracks)[this.currentTurnIndex];
  }
  
  // returns the username of the winner or null if the game is still ongoing
  get winner() {
    const usernames = this.usernames;
    for (var playerIndex=1; playerIndex<usernames.length; playerIndex++) {
      const username = usernames[playerIndex];
      if (username != "Center" && username != "Public") {
        if (username != this.userWithCurrentTurn && this.hands[username].length == 0) {
          return username;
        }
      }
    }
    return null;
  }
   
  pickupFromBoneyard() {
    console.log('pickup from boneyard');
    if (CURRENT_USER != this.userWithCurrentTurn){
      this.onPrivateMessage('Can not pickup, it is not your turn');
      return;
    }
    
    if (this.drewDomino) {
      this.onPrivateMessage('Can not pickup, you have already drawn a domino.');
      return;
    }
    
    // If the boneyard is empty, save the last domino in each train, add then to the boneyard, and reshuffle
    if (this.boneyard.length == 0) {
      var shuffleList = [];
      for (var username in this.tracks) {
        var trackState = this.tracks[username].dominos;
        if (trackState.length > 1) {
          shuffleList = shuffleList.concat(trackState.splice(0, trackState.length-1));
        }
      }
      shuffle(shuffleList);
      
      while (shuffleList.length > 0) {
        // re-orient the dominos into their original key order, so that this doesn't cause issues
        this.boneyard.push(Domino.originalKey(shuffleList.pop()));
      }
      this.onPublicMessage('Boneyard ran out.  Reshuffled.');
    }
    
    if (this.boneyard.length > 0) {
      this.hands[CURRENT_USER].push(this.boneyard.pop());
      this.onPublicMessage(CURRENT_USER + " drew a domino.");
      this.drewDomino = true;
    } else {
      this.onPublicMessage('Even after reshuffle, the boneyard is out of dominoes.');
    }
    this.save();
  }
  
  toggleTrain() {
    console.log('toggle train')
    if (this.tracks[CURRENT_USER].trainEngineUp) {
      this.onPublicMessage(CURRENT_USER + " took their train down.");
    } else {
      this.onPublicMessage(CURRENT_USER + " put their train up.");
    }
    this.tracks[CURRENT_USER].trainEngineUp = !this.tracks[CURRENT_USER].trainEngineUp;
    this.save();
  }
  
  get canPass() {
    return IS_ADMIN || (CURRENT_USER == this.userWithCurrentTurn && this.drewDomino)
  }

  pass() {
    console.log('pass')
    if (!IS_ADMIN && CURRENT_USER != this.userWithCurrentTurn){
      this.onPrivateMessage('It is not your turn');
      return;
    }
    if (!IS_ADMIN && !this.drewDomino) {
      this.onPrivateMessage('You need to draw a domino before you can pass, or be an admin');
      return;
    }
    this.playedDouble = false;
    this.drewDomino = false;
    this._nextPlayer();
    this.onPublicMessage(CURRENT_USER + " passed.");
    this.save();
  }
  
  // This is internal, and doesn't trigger a save()
  _nextPlayer() {
    this.currentTurnIndex++;
    if(this.currentTurnIndex >= Object.keys(this.tracks).length) {
      // skip common and public
      this.currentTurnIndex = 2;
    }
  }
  
  moveDomino(dominoKey, trainName) {
    // Remove domino from the hand
    var hand = this.hands[CURRENT_USER];
    var index = hand.indexOf(Domino.originalKey(dominoKey));
    if (index !== -1) {
      hand.splice(index, 1);
    }
    this.tracks[trainName].dominos.push(dominoKey);
    this.playedDouble = Domino.isDouble(dominoKey);
    var dominoName = dominoKey == "6-6" ? "sushi" : dominoKey;
    var msg = CURRENT_USER + " played a " + dominoName + " on ";
    if (trainName == "Center") {
      msg += "the center tile.";
    } else if (trainName == "Public") {
      msg += "the public train.";
    } else if (trainName == CURRENT_USER) {
      msg += "their own train.";
    } else {
      msg += trainName + "'s train.";
    }
    this.onPublicMessage(msg);
    
    // If it's a double, they get to move again.
    if (!Domino.isDouble(dominoKey)) {
      this._nextPlayer();
      if (this.hands[CURRENT_USER].length == 0) {
        this.onPublicMessage(CURRENT_USER + " won! Domino Dance Party!");   
      }
    }
    
    this.drewDomino = false;
    this.save();
  }
  
  get valid() {
    // TODO: This validates the gamestate holds the correct number of dominos, 
    // but it could also validate the set of dominos is correct.
    var dominoCount = 0;
    for (var i=0; i<this.usernames.length; i++) {
      const username = this.usernames[i];
      dominoCount += this.tracks[username].dominos.length;
      if (username != "Center" && username != "Public") {
        dominoCount += this.hands[username].length;
      }
    }
    dominoCount += this.boneyard.length;

    const expectedDominoCount = Domino.generateAllDominoKeys(this.maxDouble).length;
    if (dominoCount != expectedDominoCount) {
      console.log('Domino count is ' + dominoCount + ', and it should be ' + expectedDominoCount);
      return false;
    }
    return true;
  }
  
  isLegalMove(dominoKey, trainName) {
    if (this.tracks[trainName] == null) {
      return false;
    }

    if (CURRENT_USER != this.userWithCurrentTurn) {
      this.onPrivateMessage('It is not your turn yet');
      return false;
    }
    
    var aDoubleNeedsToBeClosed = false;
    if(!this.playedDouble) {
      // If user didn't just play a double, check for open doubles
      for (var i=0; i<this.usernames.length; i++) {
        const username = this.usernames[i];
        if (username != "Center") {
          const train = this.tracks[username].dominos;
          if (train.length > 0 && Domino.isDouble(train[train.length-1])) {
            aDoubleNeedsToBeClosed = true;
            this.onPrivateMessage('A double needs to be closed');
          }
        }
      }
      
      if (aDoubleNeedsToBeClosed) {
        // At least one double is open, so make sure that the user is playing a double
        const train = this.tracks[trainName].dominos
        return train.length > 0 
            && Domino.isDouble(train[train.length-1]) 
            && this.dominoEdgesMatch(train, dominoKey);
      }
    }

    var trackState = this.tracks[trainName].dominos;
    if ("Center" == trainName) {
      var hasDomino = trackState.length > 0;
      if (hasDomino) {
        this.onPrivateMessage('The center already has a domino.');
      }
      var isDoubleResult = Domino.isDouble(dominoKey);
      if (!isDoubleResult) {
        this.onPrivateMessage('The center can only accept doubles.');
      }
      return !hasDomino && isDoubleResult;
    }
    if (CURRENT_USER == trainName || trainName == "Public" || this.tracks[trainName].trainEngineUp) {
      return this.dominoEdgesMatch(trackState, dominoKey);
    }
    this.onPrivateMessage('This train is not open for you.');
    return false;
  }

  dominoEdgesMatch(trackState, key) {
    if (trackState.length == 0) {
      const centerHasDomino = this.tracks["Center"].dominos.length > 0;
      if (!centerHasDomino) {
        this.onPrivateMessage('The center needs a domino.');
      }
      return  centerHasDomino && this.dominoEdgesMatch(this.tracks["Center"].dominos, key);
    }
    var res1 = trackState[trackState.length-1].split("-");
    var res2 = key.split("-");
    const edgesMatch = res1[1] == res2[0];
    this.onPrivateMessage('The edges do not match, maybe rotate it?');
    return edgesMatch;
  }

  toJSONString() {
    var result = {
      "tracks": this.tracks,
      "currentTurnIndex": this.currentTurnIndex,
      "hands": this.hands,
      "boneyard": this.boneyard,
      "playedDouble": this.playedDouble,
      "drewDomino": this.drewDomino,
      "messages": this.messages,
      "maxDouble": this.maxDouble,
      "handSize": this.handSize,
    }
    return JSON.stringify(result);
  }

  fromJSON(jsonStr) {
    var newState = JSON.parse(jsonStr);
    this.tracks = newState.tracks;
    this.currentTurnIndex = newState.currentTurnIndex;
    this.hands = newState.hands;
    this.boneyard = newState.boneyard;
    this.playedDouble = newState.playedDouble;
    this.drewDomino = newState.drewDomino;
    this.messages = newState.messages;
    this.maxDouble = newState.maxDouble;
    this.handSize = newState.handSize;
  }
  
  save() {
    if (!this.valid) {
      console.log('State is invalid. Will not save to database.');
      return;
    }

    this.docRef.set({
      gamestate: this.toJSONString(),
    }).then(function() {
      console.log("State saved");
    }).catch(function(error) {
      console.error("Error saving state", error);
    });
  }
}
  

// Shuffle the contents of an array
function shuffle(array) {
	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};
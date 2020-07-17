
class MessagePanel {
  constructor(x, y, layer) {
    this.x = x;
    this.y = y;
    this.layer = layer;
    var messagesRect = new Konva.Rect({
          x: x,
          y: y,
          stroke: 'black',
          strokeWidth: 5,
          width: MessagePanel.width(),
          height: MessagePanel.height(),
        });
    this.messagesText = new Konva.Text({
          x: messagesRect.x() + 5,
          y: messagesRect.y() + 5,
          text: 'Messages go here',
          fontSize: 15,
          fontFamily: 'Calibri',
          fill: 'black',
          listening: false,
          width: messagesRect.width(),
          height: messagesRect.height(),
        });
    layer.add(messagesRect);
    layer.add(this.messagesText);
  }
  
  onGamestateChanged(gamestate) {
    var text = '';
    var messages = gamestate.recentMessages;
    for (var i=0; i<messages.length; i++) {
      text += messages[i];
      text += '\n';
    }
    this.messagesText.text(text);
  }
  
  onPrivateMessage(message) {
    var text = this.messagesText.text();
    if (!text.endsWith('\n')) {
      text += '\n';
    }
    text += 'Private: ' + message;
    this.messagesText.text(text);
    this.layer.batchDraw();
  }
  
  static height() {
    return 120;
  }
  
  static width() {
    return 400;
  }
}


// TODO: extract the messages block into a separate component
    
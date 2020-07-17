// This is the rectangle that holds the starting double domino.
class CenterTrack {
  constructor(x, y, dominos, layer) {
    this.x = x;
    this.y = y;
    this.dominos = dominos;
    
    this.rect = new Konva.Rect({
        x: this.x,
        y: this.y,
        stroke: 'black',
        strokeWidth: 5,
        width: CenterTrack.width(),
        height: CenterTrack.height(),
      });
    
    var text = new Konva.Text({
        x: this.rect.x() + 10,
        y: this.rect.y() + CenterTrack.height()/2 - 7,
        text: "Center",
        fontSize: 20,
        fontFamily: 'Calibri',
        fill: 'black',
        listening: false,
      });
    layer.add(this.rect);
    layer.add(text);
  }
  
  onGamestateChanged(gamestate){
    var dominos = gamestate.track("Center");
    if (dominos.length > 0) {
      var dominoImg = this.dominos[dominos[0]].img;
      dominoImg.x(this.rect.x() + 5);
      dominoImg.y(this.rect.y() + 5);
      dominoImg.visible(true);
      dominoImg.rotation(0);
      dominoImg.draggable(false);
    }
  }
  
  contains(x, y) {
    return this.x <= x 
        && x <= (this.x + CenterTrack.width())
        && this.y <= y
        && y <= (this.y + CenterTrack.height());
  }
  
  static height() {
    return Domino.height() + 10;
  }
  
  static width() {
    return Domino.width() + 10;
  }
}
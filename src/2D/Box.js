class Box {
  constructor(coord, size) {
    this.coord = coord;
    this.size = size;
  }
  move(dx, dy) {
    this.coord.move(dx, dy);
  }
  moveTo(x, y) {
    this.coord.moveTo(x, y);
  }
  resize(dw, dh) {
    this.size.mod(dw, dh);
  }
  resizeTo(w, h) {
    this.size.modTo(w, h);
  }
  get x() {
    return this.coord.x;
  }
  get y() {
    return this.coord.y;
  }
  get width() {
    return this.size.width;
  }
  get height() {
    return this.size.height;
  }
  checkCollision(otherBox) {
    var checkCollisionInternal = (function (x1, y1, w1, h1, x2, y2, w2, h2) {
      var overlapX = x1 < (x2 + w2) && (x1 + w1) > x2;
      var overlapY = y1 < (y2 + h2) && (y1 + h1) > y2;
      var collision = overlapX && overlapY;
      return collision;
    });
    return checkCollisionInternal(this.coord.x, this.coord.y, this.size.width, this.size.height, otherBox.x, otherBox.y, otherBox.width, otherBox.height);
  }
}
export {
  Box
}

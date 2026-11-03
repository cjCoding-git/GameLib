class Coord {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }
}
export {
  Coord
}

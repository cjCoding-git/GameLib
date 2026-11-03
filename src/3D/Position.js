class Position {
  constructor(x=0, y=0, z=0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  translate(dx, dy, dz) {
    this.x += dx;
    this.y += dy;
    this.z += dz;
  }
}
export {
  Position
}

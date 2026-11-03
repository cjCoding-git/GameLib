class Rotation {
  constructor(x=0, y=0, z=0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  rotate(rx, ry, rz) {
    this.x += rx;
    this.y += ry;
    this.z += rz;
  }
}
export {
  Rotation
}

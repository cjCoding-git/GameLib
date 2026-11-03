class Rotation {
  constructor(x=0, y=0, z=0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  static d2r(deg) {
    return (deg * Math.PI) / 180;
  }
  static r2d(rad) {
    return rad * (180 / Math.PI);
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

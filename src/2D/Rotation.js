class Rotation {
  constructor(deg) {
    this._deg = deg;
    this.rotateTo(this._deg);
  }
  static d2r(deg) {
    return (deg * Math.PI) / 180;
  }
  static r2d(rad) {
    return rad * (180 / Math.PI);
  }
  rotate(deg) {
    this.rotateTo(this._deg + deg);
  }
  rotateTo(deg) {
    this._deg = deg;
    if (this._deg >= 360) {
      this.rotateTo(this._deg - 360);
    }
    if (this._deg < 0) {
      this.rotateTo(this._deg + 360);
    }
  }
  valueOf() {
    return this._deg;
  }
  get degrees() {
    return this._deg;
  }
  get radians() {
    return GameLib2D.Rotation.d2r(this._deg);
  }
  getVelocityMod() {
    var rad = GameLib2D.Rotation.d2r(this._deg);
    var vx = Math.sin(rad);
    var vy = -Math.cos(rad);
    return [vx, vy];
  }
}
export {
  Rotation
}

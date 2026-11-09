class Object {
  constructor(gameLib, scene) {
    this._gameLib = gameLib;
    this._gl = this._gameLib.webgl;
    this.scene = scene;
    this.group = null;
  }
  setup() {}
  update(camera) {}
  draw(camera) {}
}
export {
  Object
}

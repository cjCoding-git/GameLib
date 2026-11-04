class Object {
  constructor(gameLib, scene) {
    this._gameLib = gameLib;
    this._gl = this._gameLib.webgl;
    this.scene = scene;
  }
  setup() {}
  update(camera) {}
  draw(camera) {}
}
export {
  Object
}

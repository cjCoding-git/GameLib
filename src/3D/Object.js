class Object {
  constructor(gameLib) {
    this._gameLib = gameLib;
    this._gl = this._gameLib.webgl;
  }
  setup() {}
  update() {}
  draw(camera, program) {}
}
export {
  Object
}

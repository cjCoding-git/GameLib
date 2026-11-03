class Renderable {
  constructor() {
    this.gameLib = new GameLib2D.GameLib();
    this.gameLib.addRenderable(this);
    this._active = true;
    this._canvas = this.gameLib.canvas;
    this._ctx = this.gameLib.ctx;
    this.overlay = false;
  }
  shouldRender() {
    return true;
  }
  isActive() {
    return this._active;
  }
  setActive(active) {
    this._active = active;
  }
  draw() {}
}
export {
  Renderable
}

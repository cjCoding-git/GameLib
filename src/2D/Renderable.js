import { GameLib } from "./GameLib.js"
class Renderable {
  constructor(scene) {
    this.gameLib = new GameLib();
    this.gameLib.addRenderable(this);
    this._active = true;
    this._canvas = this.gameLib.canvas;
    this._ctx = this.gameLib.ctx;
    this.overlay = false;
    this.scene = scene;
  }
  makeOverlay() {
    this.overlay = true;
    this._canvas = this.gameLib.viewportCanvas;
    this._ctx = this.gameLib.viewportCtx;
  }
  overlaySkipped() {}
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

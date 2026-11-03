import { Renderable } from "../Renderable.js"
import { GameLib } from "../GameLib.js"
class Button extends Renderable {
  constructor(pos, size, scene) {
    super(scene);
    this.overlay = true;
    this._canvas = this.gameLib.viewportCanvas;
    this._ctx = this.gameLib.viewportCtx;
    this._box = new Box(pos, size);
    this.hover = false;
    this.cursor = "default";
  }
  moveTo(x, y) {
    this._box.moveTo(x, y);
  }
  get x() {
    return this._box.x;
  }
  get y() {
    return this._box.y;
  }
  get width() {
    return this._box.width;
  }
  get height() {
    return this._box.height;
  }
  handleClick(evt, coord) {
    if(coord.x >= this._box.x && coord.y >= this._box.y  && coord.x <= this._box.x + this._box.width && coord.y <= this._box.y + this._box.height) {
      this.clicked();
      return true;
    }
    return false;
  }
  handleHover(evt, coord) {
    if(coord.x >= this._box.x && coord.y >= this._box.y  && coord.x <= this._box.x + this._box.width && coord.y <= this._box.y + this._box.height) {
      this.hover = true;
      GameLib.cursor(this.cursor);
      return true;
    } else {
      this.hover = false;
      return false;
    }
  }
  clicked() {
    this.hover = false;
    GameLib.cursor("default");
  }
}
export {
  Button
}

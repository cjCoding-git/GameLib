import { Renderable } from "../Renderable.js"
class TextInput extends Renderable {
  constructor(pos, size, scene) {
    super(scene);
    this.overlay = true;
    this._canvas = this.gameLib.viewportCanvas;
    this._canvasRect = this._canvas.getBoundingClientRect();
    this.canvasX = this._canvasRect.x;
    this.canvasY = this._canvasRect.y;
    this._ctx = this.gameLib.viewportCtx;
    this._box = new Box(pos, size);
    this._active = false;
    this._value = null;
    this._element = null;
  }
  createElement() {
    this._element = document.createElement('input');
    this._element.setAttribute('style', this.getStyle());
    this._element.setAttribute('type', 'text');
    document.body.appendChild(this._element);
  }
  getStyle() {
    return 'box-sizing: border-box;padding-left: 5px;padding-right: 5px;z-index: 999;display: block;position: absolute;left: ' + (this.canvasX + this.x) + 'px;top: ' + (this.canvasY + this.y) + 'px;width: ' + this.width + 'px;height: ' + this.height + 'px;outline: none;background: transparent;border: 0;';
  }
  draw() {
    if(this._element) {
      this._canvasRect = this._canvas.getBoundingClientRect();
      this.canvasX = this._canvasRect.x;
      this.canvasY = this._canvasRect.y;
      this._element.setAttribute('style', this.getStyle());
    } else {
      this.createElement();
    }
    this._ctx.fillStyle = "#ffffff";
    this._ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  get value() {
    if(this._element) {
      return this._element.value;
    }
  }
  overlaySkipped() {
    if(this._element) {
      this.removeElement();
    }
  }
  removeElement() {
    this._element.remove();
    this._element = null;
  }
  setActive(active) {
    super.setActive(active);
    if(active) {
      this.createElement();
    } else {
      this.removeElement();
    }
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
}
export {
  TextInput
}

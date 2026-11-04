import { UIObject } from "./UIObject.js"
class UIText extends UIObject {
  constructor(gameLib, scene, x, y, width, height, text, options={}) {
    super(gameLib, scene, x, y, width, height, options.color);
    this.isTexturedUI = true;
    this.source = document.createElement('canvas');
    this.source.width = Math.max(1, Math.ceil(width));
    this.source.height = Math.max(1, Math.ceil(height));
    this.text = text;
    this.font = options.font || "24px sans-serif";
    this.fillStyle = options.fillStyle || "#ffffff";
    this.textAlign = options.textAlign || "left";
    this.textBaseline = options.textBaseline || "top";
    this.textureDirty = true;
    this._drawText();
  }
  setText(text) {
    this.text = text;
    this._drawText();
    return this;
  }
  _drawText() {
    var ctx = this.source.getContext('2d');
    ctx.clearRect(0, 0, this.source.width, this.source.height);
    ctx.font = this.font;
    ctx.fillStyle = this.fillStyle;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    ctx.fillText(this.text, 0, 0, this.source.width);
    this.textureDirty = true;
  }
}
export {
  UIText
}

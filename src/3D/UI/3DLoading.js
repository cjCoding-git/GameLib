import { Loading } from "../../Core/Loading.js"
import { UIObject } from "./UIObject.js"
class 3DLoading extends UIObject {
  constructor(gameLib) {
    var x = 0;
    var y = 0;
    var width = gameLib._canvas.width;
    var height = gameLib._canvas.height
    super(gameLib, "loading", x, y, width, height, [1.0, 1.0, 1.0, 1.0]);
    this.isTexturedUI = true;
    this.source = document.createElement('canvas');
    this.source.width = width;
    this.source.height = height;
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
  3DLoading
}

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
  }
}
export {
  UIText
}

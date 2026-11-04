import { UIObject } from "./UIObject.js";
class UIPath extends UIObject {
  constructor(gameLib, scene, x, y, width, height, pathData, options={}) {
    super(gameLib, scene, x, y, width, height, options.color);
    this.isTexturedUI = true;
    this.source = document.createElement('canvas');
    this.source.width = Math.max(1, Math.ceil(width));
    this.source.height = Math.max(1, Math.ceil(height));
    this.textureDirty = true;
    var ctx = this.source.getContext('2d');
    var path = new Path2D(pathData);
    if(options.fillStyle) {
      ctx.fillStyle = options.fillStyle;
      ctx.fill(path);
    }
    if(options.strokeStyle) {
      ctx.strokeStyle = options.strokeStyle;
      ctx.lineWidth = options.lineWidth || 1;
      ctx.stroke(path);
    }
  }
}
export {
  UIPath
}

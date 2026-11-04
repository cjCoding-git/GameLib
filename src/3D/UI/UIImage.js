import { UIObject } from "./UIObject.js"
class UIImage extends UIObject {
  constructor(gameLib, scene, x, y, width, height, url, options={}) {
    super(gameLib, scene, x, y, width, height, options.color);
    this.isTexturedUI = true;
    this.source = null;
    this.textureDirty = true;
    var image = new Image();
    if(options.crossOrigin) {
      image.crossOrigin = options.crossOrigin;
    }
    image.onload = () => {
      this.source = image;
      this.textureDirty = true;
    };
    image.onerror = () => {
      console.warn(`[GameLib] Failed to load image: ${url}`);
    };
    image.src = url;
  }
}
export {
  UIImage
}

import { GameLibCore } from "../Core/index.js"
import { Texture } from "./Texture.js"
class TextureFactory {
  constructor() {
    throw new GameLibCore.Error("Class TextureFactory may not be constructed!");
  }
  static create(gl, source, options = {}) {
    if (source instanceof Texture) {
      return source;
    }
    return new Texture(gl, source, options);
  }
  static fromImage(gl, image, options = {}) {
    return Texture.fromImage(gl, image, options);
  }
  static load(gl, url, options = {}) {
    return Texture.load(gl, url, options);
  }
}
export {
  TextureFactory
}

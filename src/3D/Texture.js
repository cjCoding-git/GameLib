import { GameLibCore } from "../Core/index.js"
class Texture {
  constructor(gl, source = null, options = {}) {
    this.gl = gl;
    this.options = options;
    this.target = options.target || gl.TEXTURE_2D;
    this.texture = gl.createTexture();
    gl.bindTexture(this.target, this.texture);
    this.setParameters(options);
    if (source !== null) {
      this.update(source);
    }
  }
  setParameters(options = {}) {
    const gl = this.gl;
    const target = this.target;
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrapS || gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrapT || gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.minFilter || gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.magFilter || gl.LINEAR);
    return this;
  }
  update(source) {
    const gl = this.gl;
    gl.bindTexture(this.target, this.texture);
    if (this.options.flipY !== undefined) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.options.flipY);
    }
    gl.texImage2D(
      this.target,
      0,
      this.options.internalFormat || gl.RGBA,
      this.options.format || gl.RGBA,
      this.options.type || gl.UNSIGNED_BYTE,
      source
    );
    if (this.options.generateMipmaps) {
      gl.generateMipmap(this.target);
    }
    return this;
  }
  bind(unit = 0) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(this.target, this.texture);
    return this;
  }
  static fromImage(gl, image, options = {}) {
    return new Texture(gl, image, options);
  }
  static load(gl, url, options = {}) {
    return GameLibCore.AssetManager.shared
      .loadImage(url, { crossOrigin: options.crossOrigin })
      .then(image => Texture.fromImage(gl, image, options));
  }
}
export {
  Texture
}

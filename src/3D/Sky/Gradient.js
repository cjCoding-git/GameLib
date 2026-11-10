import { GameLibCore } from "../../Core/index.js"
import { Skybox } from "./Skybox.js"
import GL1Vertex from "../../Shaders/Sky/Gradient/Vertex/GL1.glsl"
import GL2Vertex from "../../Shaders/Sky/Gradient/Vertex/GL2.glsl"
import GL1Fragment from "../../Shaders/Sky/Gradient/Fragment/GL1.glsl"
import GL2Fragment from "../../Shaders/Sky/Gradient/Fragment/GL2.glsl"
class Gradient extends Skybox {
  constructor(gameLib, options={}) {
    var webGL2 = gameLib.options && gameLib.options.webGL2 !== false;
    var vsSource = webGL2 ? GL2Vertex : GL1Vertex;
    var fsSource = webGL2 ? GL2Fragment : GL1Fragment;
    super(gameLib, vsSource, fsSource);
    this.zenithColor = options.zenith || [0.1, 0.35, 0.8];
    this.horizonColor = options.horizon || [0.7, 0.85, 0.95];
    this.groundColor = options.ground || [0.2, 0.2, 0.2];
    this.sunDirection = options.sunDirection || [0.5, 0.5, -0.5];
    this.sunColor = options.sunColor || [1.0, 0.9, 0.7];
    this.sunExponent = options.sunExponent !== undefined ? options.sunExponent : 256.0;
  }
  setColors({ zenith, horizon, ground }) {
    if (zenith) this.zenithColor = zenith;
    if (horizon) this.horizonColor = horizon;
    if (ground) this.groundColor = ground;
    return this;
  }
  setSun(direction, color = [1.0, 0.9, 0.7], exponent = 256.0) {
    this.sunDirection = direction;
    this.sunColor = color;
    this.sunExponent = exponent;
    return this;
  }
  _bindUniforms(projectionMatrix, viewNoTranslation) {
    super._bindUniforms(projectionMatrix, viewNoTranslation);
    var gl = this._gl;
    gl.uniform3fv(gl.getUniformLocation(this._program, "uZenithColor"), this.zenithColor);
    gl.uniform3fv(gl.getUniformLocation(this._program, "uHorizonColor"), this.horizonColor);
    gl.uniform3fv(gl.getUniformLocation(this._program, "uGroundColor"), this.groundColor);
    gl.uniform3fv(gl.getUniformLocation(this._program, "uSunDirection"), this.sunDirection);
    gl.uniform3fv(gl.getUniformLocation(this._program, "uSunColor"), this.sunColor);
    gl.uniform1f(gl.getUniformLocation(this._program, "uSunExponent"), this.sunExponent);
  }
  getEnvironmentTexture() {
    return null;
  }
}
export {
  Gradient
}

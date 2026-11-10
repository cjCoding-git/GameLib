import { GameLibCore } from "../../Core/index.js"
import { Skybox } from "./Skybox.js"
import GL1Vertex from "../../Shaders/Sky/Cubemap/Vertex/GL1.glsl"
import GL2Vertex from "../../Shaders/Sky/Cubemap/Vertex/GL2.glsl"
import GL1Fragment from "../../Shaders/Sky/Cubemap/Fragment/GL1.glsl"
import GL2Fragment from "../../Shaders/Sky/Cubemap/Fragment/GL2.glsl"
class Cubemap extends Skybox {
  constructor(gameLib, faceUrls=null) {
    var webGL2 = gameLib.options && gameLib.options.webGL2 !== false;
    var vsSource = webGL2 ? GL2Vertex : GL1Vertex;
    var fsSource = webGL2 ? GL2Fragment : GL1Fragment;
    super(gameLib, vsSource, fsSource);
    this._texture = null;
    if(faceUrls) {
      this.loadCubemap(faceUrls);
    }
  }
  loadCubemap(faceUrls) {
    var gl = this._gl;
    if (this._texture) gl.deleteTexture(this._texture);
    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._texture);
    var targets = [
      gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];
    targets.forEach((target, i) => {
      gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([50, 50, 50, 255]));
      GameLibCore.AssetManager.shared.loadImage(faceUrls[i]).then(() => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      });
    });
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return this;
  }
  _bindUniforms(projectionMatrix, viewNoTranslation) {
    super._bindUniforms(projectionMatrix, viewNoTranslation);
    var gl = this._gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._texture);
    gl.uniform1i(gl.getUniformLocation(this._program, "uSkyboxCubemap"), 0);
  }
}
export {
  Cubemap
}

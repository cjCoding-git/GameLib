import { GameLibCore } from "../../Core/index.js"
import GL1Vertex from "../../Shaders/Sky/Equirectangular/Vertex/GL1.glsl"
import GL2Vertex from "../../Shaders/Sky/Equirectangular/Vertex/GL2.glsl"
import GL1Fragment from "../../Shaders/Sky/Equirectangular/Fragment/GL1.glsl"
import GL2Fragment from "../../Shaders/Sky/Equirectangular/Fragment/GL2.glsl"
class Equirectangular {
  constructor(gameLib, textureUrl=null) {
    var webGL2 = gameLib.options && gameLib.options.webGL2 !== false;
    var vsSource = webGL2 ? GL2Vertex : GL1Vertex;
    var fsSource = webGL2 ? GL2Fragment : GL1Fragment;
    super(gameLib, vsSource, fsSource);
    this._texture = null;
    if(textureUrl) {
      this.loadTexture(textureUrl);
    }
  }
  loadTexture(textureUrl) {
    var gl = this._gl;
    if (this._texture) gl.deleteTexture(this._texture);
    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([50, 50, 50, 255]));
    GameLibCore.AssetManager.loadImage(textureUrl).then(() => {
      gl.bindTexture(gl.TEXTURE_2D, this._texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    });
    return this;
  }
  _bindUniforms(projectionMatrix, viewNoTranslation) {
    super._bindUniforms(projectionMatrix, viewNoTranslation);
    var gl = this._gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.uniform1i(gl.getUniformLocation(this._program, "uEquirectangularMap"), 0);
  }
}
export {
  Equirectangular
}

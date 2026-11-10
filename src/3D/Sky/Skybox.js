import GL1Vertex from "../../Shaders/Sky/Vertex/GL1.glsl"
import GL2Vertex from "../../Shaders/Sky/Vertex/GL2.glsl"
import GL1Fragment from "../../Shaders/Sky/Fragment/GL1.glsl"
import GL2Fragment from "../../Shaders/Sky/Fragment/GL2.glsl"
class Skybox {
  constructor(gameLib, faceUrls) {
    this._gameLib = gameLib;
    this._gl = this._gameLib.webgl;
    this.initProgram();
    this.initBuffers();
    this._texture = this.loadCubeMap(faceUrls);
  }
  initProgram() {
    var webGL2 = this._gameLib.options.webGL2;
    var vsSource = webGL2 ? GL2Vertex : GL1Vertex;
    var fsSource = webGL2 ? GL2Fragment : GL1Fragment;
    var vs = this._gameLib.compileShader(this._gl.VERTEX_SHADER, vsSource);
    var fs = this._gameLib.compileShader(this._gl.FRAGMENT_SHADER, fsSource);
    this._program = this._gameLib.createProgram(vs, fs);
  }
  initBuffers() {
    var vertices = new Float32Array([
      -1,  1, -1,  -1, -1, -1,   1, -1, -1,   1, -1, -1,   1,  1, -1,  -1,  1, -1,
      -1, -1,  1,  -1, -1, -1,  -1,  1, -1,  -1,  1, -1,  -1,  1,  1,  -1, -1,  1,
       1, -1, -1,   1, -1,  1,   1,  1,  1,   1,  1,  1,   1,  1, -1,   1, -1, -1,
      -1, -1,  1,  -1,  1,  1,   1,  1,  1,   1,  1,  1,   1, -1,  1,  -1, -1,  1,
      -1,  1, -1,   1,  1, -1,   1,  1,  1,   1,  1,  1,  -1,  1,  1,  -1,  1, -1,
      -1, -1, -1,  -1, -1,  1,   1, -1, -1,   1, -1, -1,  -1, -1,  1,   1, -1,  1
    ]);
    this._vbo = this._gl.createBuffer();
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vbo);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, vertices, this._gl.STATIC_DRAW);
  }
  loadCubeMap(urls) {
    var gl = this._gl;
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    var targets = [
      gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];
    targets.forEach((target, index) => {
      gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([100, 100, 100, 255]));
      var image = new Image();
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      };
      image.src = urls[index];
    });
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }
  render(projectionMatrix, viewMatrix) {
    var gl = this.gl;
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(this._program);
    var viewMatrixNoTranslation = new Float32Array(viewMatrix);
    viewMatrixNoTranslation[12] = 0;
    viewMatrixNoTranslation[13] = 0;
    viewMatrixNoTranslation[14] = 0;
    var uProjLoc = gl.getUniformLocation(this._program, "uProjectionMatrix");
    var uViewLoc = gl.getUniformLocation(this._program, "uViewMatrix");
    var uSkyboxLoc = gl.getUniformLocation(this._program, "uSkybox");
    gl.uniformMatrix4fv(uProjLoc, false, projectionMatrix);
    gl.uniformMatrix4fv(uViewLoc, false, viewMatrixNoTranslation);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._texture);
    gl.uniform1i(uSkyboxLoc, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
    var aPosLoc = gl.getAttribLocation(this._program, "aPosition");
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.depthFunc(gl.LESS);
  }
}
export {
  Skybox
}

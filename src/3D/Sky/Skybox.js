import { GameLibCore } from "../../Core/index.js"
class Skybox {
  constructor(gameLib, vertexSource=null, fragmentSource=null) {
    if(!gameLib || !gameLib.webgl) {
      throw new GameLibCore.Error("Class Skybox requires a valid GameLib3D instance!");
    }
    this._gameLib = gameLib;
    this._gl = this._gameLib.webgl;
    this._vbo = null;
    this._program = null;
    this._initBuffers();
    if(vertexSource && fragmentSource) {
      this._initProgram(vertexSource, fragmentSource);
    }
  }
  _initBuffers() {
    var gl = this._gl;
    var vertices = new Float32Array([
      -1,  1, -1,  -1, -1, -1,   1, -1, -1,   1, -1, -1,   1,  1, -1,  -1,  1, -1,
      -1, -1,  1,  -1, -1, -1,  -1,  1, -1,  -1,  1, -1,  -1,  1,  1,  -1, -1,  1,
       1, -1, -1,   1, -1,  1,   1,  1,  1,   1,  1,  1,   1,  1, -1,   1, -1, -1,
      -1, -1,  1,  -1,  1,  1,   1,  1,  1,   1,  1,  1,   1, -1,  1,  -1, -1,  1,
      -1,  1, -1,   1,  1, -1,   1,  1,  1,   1,  1,  1,  -1,  1,  1,  -1,  1, -1,
      -1, -1, -1,  -1, -1,  1,   1, -1, -1,   1, -1, -1,  -1, -1,  1,   1, -1,  1
    ]);
    this._vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }
  _initProgram(vsSource, fsSource) {
    var gl = this._gl;
    var vs = this._gameLib.compileShader(gl.VERTEX_SHADER, vsSource);
    var fs = this._gameLib.compileShader(gl.FRAGMENT_SHADER, fsSource);
    this._program = this._gameLib.createProgram(vs, fs);
  }
  _bindUniforms(projectionMatrix, viewNoTranslation) {
    var gl = this._gl;
    gl.uniformMatrix4fv(gl.getUniformLocation(this._program, "uProjectionMatrix"), false, projectionMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(this._program, "uViewMatrix"), false, viewNoTranslation);
  }
  render(projectionMatrix, viewMatrix) {
    if (!this._program) return;
    var gl = this._gl;
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(this._program);
    var viewNoTranslation = new Float32Array(viewMatrix);
    viewNoTranslation[12] = 0;
    viewNoTranslation[13] = 0;
    viewNoTranslation[14] = 0;
    this._bindUniforms(projectionMatrix, viewNoTranslation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
    var aPosLoc = gl.getAttribLocation(this._program, "aPosition");
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.depthFunc(gl.LESS);
  }
  getEnvironmentTexture() {
    return null;
  }
}
export {
  Skybox
}

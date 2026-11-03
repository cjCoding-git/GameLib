import { Object } from "./Object.js"
import { Transform } from "./Transform.js"
import { mat4 } from "../Lib/GLMatrix.js"
class Mesh extends Object {
  constructor(gameLib, geometryData, color=[1.0, 1.0, 1.0, 1.0]) {
    super(gameLib);
    this.transform = new Transform();
    this.color = color;
    this.geometry = geometryData;
    this.buffers = {};
  }
  setup() {
    var webgl = this._gl.webgl;
    this.buffers.position = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.position);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(this.geometry.positions), webgl.STATIC_DRAW);
    this.buffers.normal = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.normal);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(this.geometry.normals), webgl.STATIC_DRAW);
    this.buffers.uv = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.uv);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(this.geoemtry.uv), webgl.STATIC_DRAW);
    var vertexCount = this.geometry.positions.length / 3;
    var colors = [];
    for(var i=0;i<vertexCount;i++) {
      colors.push(...this.color);
    }
    this.buffers.color = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.color);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(colors), webgl.STATIC_DRAW);
    this.buffers.indices = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.indices);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Uint16Array(this.geometry.indices), webgl.STATIC_DRAW);
    this.indexCount = this.geometry.indices.length;
  }
  draw(camera, program) {
    var webgl = this._gl;
    var aspect = webgl.canvas.clientWidth / webgl.canvas.clientHeight;
    var projectionMatrix = camera.getProjectionMatrix(aspect);
    var viewMatrix = camera.getViewMatrix();
    var modelMatrix = this.transform.getModelMatrix();
    var modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    var normalMatrix = this.transform.getNormalMatrix(modelViewMatrix);
    this._gameLib.setProgramAttribute(program, "aVertexPosition", this.buffers.position, 3);
    this._gameLib.setProgramAttribute(program, "aVertexNormal", this.buffers.normal, 3);
    this._gameLib.setProgramAttribute(program, "aVertexColor", this.buffers.color, 4);
    this._gameLib.setProgramAttribute(program, "aTextureCoord", this.buffers.uv, 2);
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    webgl.uniformMatrix4fv(this._gameLib.getAttributeLocation(program, 'uProjectionMatrix'), false, projectionMatrix);
    webgl.uniformMatrix4fv(this._gameLib.getAttributeLocation(program, 'uModelViewMatrix'), false, modelViewMatrix);
    webgl.uniformMatrix4fv(this._gameLib.getAttributeLocation(program, 'uNormalMatrix'), false, normalMatrix);
    webgl.drawElements(webgl.TRIANGLES, this.indexCount, webgl.UNSIGNED_SHORT, 0);
  }
}
export {
  Mesh
}

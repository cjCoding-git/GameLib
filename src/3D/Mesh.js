import { Object } from "./Object.js"
import { Transform } from "./Transform.js"
import { mat4 } from "../Lib/GLMatrix.js"
class Mesh extends Object {
  constructor(gameLib, geometryData, material) {
    super(gameLib);
    this.transform = new Transform();
    this.material = material;
    this.geometry = geometryData;
    this.buffers = {};
  }
  setup() {
    var webgl = this._gl;
    var program = this.material.ensureProgram(this._gameLib);
    if (program) {
      this._gameLib.useProgram(program);
    }
    this.buffers.position = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.position);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(this.geometry.positions), webgl.STATIC_DRAW);
    this.buffers.normal = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.normal);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(this.geometry.normals), webgl.STATIC_DRAW);
    this.buffers.uv = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.uv);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(this.geometry.uv || []), webgl.STATIC_DRAW);
    var colors = this.material.getVertexColors ? this.material.getVertexColors(this.geometry) : new Float32Array([]);
    this.buffers.color = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.color);
    webgl.bufferData(webgl.ARRAY_BUFFER, colors, webgl.STATIC_DRAW);
    this.buffers.indices = webgl.createBuffer();
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.geometry.indices), webgl.STATIC_DRAW);
    this.indexCount = this.geometry.indices.length;
  }
  draw(camera, program) {
    var webgl = this._gl;
    var materialProgram = this.material && this.material.ensureProgram && this.material.ensureProgram(this._gameLib);
    if (!materialProgram) {
      return;
    }
    this._gameLib.useProgram(materialProgram);
    var aspect = webgl.canvas.clientWidth / webgl.canvas.clientHeight;
    var projectionMatrix = camera.getProjectionMatrix(aspect);
    var viewMatrix = camera.getViewMatrix();
    var modelMatrix = this.transform.getModelMatrix();
    var modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    var normalMatrix = this.transform.getNormalMatrix(modelViewMatrix);
    this._gameLib.setProgramAttribute(materialProgram, "aVertexPosition", this.buffers.position, 3);
    this._gameLib.setProgramAttribute(materialProgram, "aVertexNormal", this.buffers.normal, 3);
    this._gameLib.setProgramAttribute(materialProgram, "aVertexColor", this.buffers.color, 4);
    this._gameLib.setProgramAttribute(materialProgram, "aTextureCoord", this.buffers.uv, 2);
    if (this.material.texture) {
      this.material.texture.bind(this.material.textureUnit || 0);
      var textureLocation = this._gameLib.getAttributeLocation(materialProgram, "uTexture", "uniform");
      if (textureLocation) {
        webgl.uniform1i(textureLocation, this.material.textureUnit || 0);
      }
      var useTextureLocation = this._gameLib.getAttributeLocation(materialProgram, "uUseTexture", "uniform");
      if (useTextureLocation) {
        webgl.uniform1i(useTextureLocation, 1);
      }
    } else {
      var useTextureLocation = this._gameLib.getAttributeLocation(materialProgram, "uUseTexture", "uniform");
      if (useTextureLocation) {
        webgl.uniform1i(useTextureLocation, 0);
      }
    }
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    webgl.uniformMatrix4fv(this._gameLib.getAttributeLocation(materialProgram, 'uProjectionMatrix'), false, projectionMatrix);
    webgl.uniformMatrix4fv(this._gameLib.getAttributeLocation(materialProgram, 'uModelViewMatrix'), false, modelViewMatrix);
    webgl.uniformMatrix4fv(this._gameLib.getAttributeLocation(materialProgram, 'uNormalMatrix'), false, normalMatrix);
    webgl.drawElements(webgl.TRIANGLES, this.indexCount, webgl.UNSIGNED_SHORT, 0);
  }
}
export {
  Mesh
}

import { Object } from "./Object.js"
import { Transform } from "./Transform.js"
import { mat4 } from "../Core/Matrix/mat4.js"
class Mesh extends Object {
  constructor(gameLib, scene, geometryData, material) {
    super(gameLib, scene);
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
  draw(camera) {
    var webgl = this._gl;
    var materialProgram = this.material && this.material.ensureProgram && this.material.ensureProgram(this._gameLib);
    if (!materialProgram) return;
    this._gameLib.useProgram(materialProgram);
    var aspect = webgl.canvas.clientWidth / webgl.canvas.clientHeight;
    var projectionMatrix = camera.getProjectionMatrix(aspect);
    var viewMatrix = camera.getViewMatrix();
    var modelMatrix = this.transform.getModelMatrix();
    var modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    var normalMatrix = this.transform.getNormalMatrix(modelViewMatrix);
    var uniform = name => this._gameLib.getAttributeLocation(materialProgram, name, "uniform");
    this._gameLib.setProgramAttribute(materialProgram, "aVertexPosition", this.buffers.position, 3);
    this._gameLib.setProgramAttribute(materialProgram, "aVertexNormal", this.buffers.normal, 3);
    this._gameLib.setProgramAttribute(materialProgram, "aVertexColor", this.buffers.color, 4);
    this._gameLib.setProgramAttribute(materialProgram, "aTextureCoord", this.buffers.uv, 2);
    var useTextureLocation = uniform("uUseTexture");
    if (useTextureLocation !== null) {
      webgl.uniform1i(useTextureLocation, this.material.texture ? 1 : 0);
    }
    if (this.material.texture) {
      var textureUnit = this.material.textureUnit || 0;
      this.material.texture.bind(textureUnit);
      var textureLocation = uniform("uTexture");
      if (textureLocation !== null) {
        webgl.uniform1i(textureLocation, textureUnit);
      }
    }
    var projectionLocation = uniform("uProjectionMatrix");
    if (projectionLocation !== null) {
      webgl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
    }
    var modelViewLocation = uniform("uModelViewMatrix");
    if (modelViewLocation !== null) {
      webgl.uniformMatrix4fv(modelViewLocation, false, modelViewMatrix);
    }
    var normalLocation = uniform("uNormalMatrix");
    if (normalLocation !== null) {
      webgl.uniformMatrix4fv(normalLocation, false, normalMatrix);
    }
    var MAX_LIGHTS = 8;
    var lights = this._gameLib.getLights(this.scene).slice(0, MAX_LIGHTS);
    var lightTypes = [];
    var lightColors = [];
    var lightVectors = [];
    var lightIntensities = [];
    var lightRanges = [];
    var getVector3 = (value) => {
      if (Array.isArray(value)) return [value[0] || 0, value[1] || 0, value[2] || 0];
      if (value && typeof value === "object") {
        if (typeof value.x !== "undefined" && typeof value.y !== "undefined" && typeof value.z !== "undefined") {
          return [value.x, value.y, value.z];
        }
      }
      return [0, 0, 0];
    };
    for (var light of lights) {
      var type = light.type === "ambient" ? 0 : light.type === "point" ? 2 : 1;
      lightTypes.push(type);
      var color = Array.isArray(light.color) ? light.color : [1, 1, 1];
      lightColors.push(color[0] || 0, color[1] || 0, color[2] || 0);
      lightIntensities.push(light.intensity || 0);
      lightRanges.push(light.range || 1);
      var source = type === 2 ? getVector3(light.position) : getVector3(light.direction || light.position);
      var x = source[0];
      var y = source[1];
      var z = source[2];
      if (type === 2) {
        lightVectors.push(viewMatrix[0] * x + viewMatrix[4] * y + viewMatrix[8] * z + viewMatrix[12], viewMatrix[1] * x + viewMatrix[5] * y + viewMatrix[9] * z + viewMatrix[13], viewMatrix[2] * x + viewMatrix[6] * y + viewMatrix[10] * z + viewMatrix[14]);
      } else {
        lightVectors.push(viewMatrix[0] * x + viewMatrix[4] * y + viewMatrix[8] * z, viewMatrix[1] * x + viewMatrix[5] * y + viewMatrix[9] * z, viewMatrix[2] * x + viewMatrix[6] * y + viewMatrix[10] * z);
      }
    }
    var lightCountLocation = uniform("uLightCount");
    if (lightCountLocation !== null) {
      webgl.uniform1i(lightCountLocation, lights.length);
    }
    if (lights.length > 0) {
      var typeLocation = uniform("uLightType[0]");
      if (typeLocation !== null) {
        webgl.uniform1iv(typeLocation, new Int32Array(lightTypes));
      }
      var colorLocation = uniform("uLightColor[0]");
      if (colorLocation !== null) {
        webgl.uniform3fv(colorLocation, new Float32Array(lightColors));
      }
      var vectorLocation = uniform("uLightVector[0]");
      if (vectorLocation !== null) {
        webgl.uniform3fv(vectorLocation, new Float32Array(lightVectors));
      }
      var intensityLocation = uniform("uLightIntensity[0]");
      if (intensityLocation !== null) {
        webgl.uniform1fv(intensityLocation, new Float32Array(lightIntensities));
      }
      var rangeLocation = uniform("uLightRange[0]");
      if (rangeLocation !== null) {
        webgl.uniform1fv(rangeLocation, new Float32Array(lightRanges));
      }
    }
    var clearColorLocation = uniform("uClearColor");
    if(clearColorLocation !== null) {
      webgl.uniform4fv(clearColorLocation, new Float32Array(this._gameLib.getClearColor()));
    }
    webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    webgl.drawElements(webgl.TRIANGLES, this.indexCount, webgl.UNSIGNED_SHORT, 0);
  }
}
export {
  Mesh
}

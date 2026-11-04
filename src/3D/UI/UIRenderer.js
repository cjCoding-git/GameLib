import { GameLibCore } from "../../Core/index.js"
class UIRenderer {
  constructor(gameLib) {
    this._gameLib = gameLib;
    this._uiObjects = [];
    this._vertices = [];
    this._program = null;
    this._buffer = null;
    this._positionLocation = null;
    this._colorLocation = null;
    this._resolutionLocation = null;
  }
  addObject(object) {
    object.id = GameLibCore.Utils.UUID();
    this._uiObjects.push(object);
  }
  getObjects() {
    return this._uiObjects;
  }
  removeObject(id) {
    this._uiObjects = this._uiObjects.filter(object => object.id !== id);
  }
  _getVertexShaderSource(webgl2) {
    if(webgl2) {
      return `#version 300 es
      in vec2 aPosition;
      in vec4 aColor;
      uniform vec2 uResolution;
      out vec4 vColor;
      void main() {
        vec2 clipPosition = (aPosition / uResolution) * 2.0 - 1.0;
        clipPosition.y *= -1.0;
        gl_Position = vec4(clipPosition, 0.0, 1.0);
        vColor = aColor;
      }`;
    } else {
      return `attribute vec2 aPosition;
      attribute vec4 aColor;
      uniform vec2 uResolution;
      varying vec4 vColor;
      void main() {
        vec2 clipPosition = (aPosition / uResolution) * 2.0 - 1.0;
        clipPosition.y *= -1.0;
        gl_Position = vec4(clipPosition, 0.0, 1.0);
        vColor = aColor;
      }`;
    }
  }
  _getFragmentShaderSource(webgl2) {
    if(webgl2) {
      return `#version 300 es
      precision mediump float;
      in vec4 vColor;
      out vec4 outColor;
      void main() {
        outColor = vColor;
      }`;
    } else {
      return `precision mediump float;
      varying vec4 vColor;
      void main() {
        gl_FragColor = vColor;
      }`;
    }
  }
  _initialize() {
    if(this._program) return true;
    var gl = this._gameLib.webgl;
    var isWebGL2 = !this._gameLib.options || this._gameLib.options.webGL2 !== false;
    var vertexSource = this._getVertexShaderSource(isWebGL2);
    var fragmentSource = this._getFragmentShaderSource(isWebGL2);
    var vertexShader = this._gameLib.compileShader(vertexSource);
    var fragmentShader = this._gameLib.compileShader(fragmentSource);
    if(!vertexShader || !fragmentShader) return false;
    this._program = this._gameLib.createProgram(vertexShader, fragmentShader);
    if(!this._program) return false;
    this._buffer = gl.createBuffer();
    this._positionLocation = gl.getAttribLocation(this._program, "aPosition");
    this._colorLocation = gl.getAttribLocation(this._program, "aColor");
    this._resolutionLocation = gl.getUniformLocation(this._program", "uResolution");
    return Boolean(this._buffer);
  }
  render(scene) {
    for(var i=0;i<this._uiObjects.length;i++) {
      var object = this._uiObjects[i];
      if(object.scene === scene) {
        this.renderObject(object);
      }
    }
  }
  renderObject(object) {
    var x = object.x;
    var y = object.y;
    var width = object.width;
    var height = object.height;
    var color = object.color || [1.0, 1.0, 1.0, 1.0];
  }
}
export {
  UIRenderer
}

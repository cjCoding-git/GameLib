import { GameLibCore } from "../../Core/index.js"
class UIRenderer {
  constructor(gameLib) {
    this._gameLib = gameLib;
    this._uiObjects = [];
    this._vertices = [];
    this._program = null;
    this._buffer = null
    this._positionLocation = null;
    this._colorLocation = null;
    this._resolutionLocation = null;
    this._textureProgram = null;
    this._textureBuffer = null;
    this._texturePositionLocation = null;
    this._textureUVLocation = null;
    this._textureResolutionLocation = null;
    this._textureSamplerLocation = null;
  }
  _getTextureVertexShaderSource(webgl2) {
    if(webgl2) {
      return `#version 300 es
      in vec2 aPosition;
      in vec2 aUV;
      uniform vec2 uResolution;
      out vec2 vUV;
      void main() {
        vec2 clipPosition = (aPosition / uResolution) * 2.0 - 1.0;
        clipPosition.y *= -1.0;
        gl_Position = vec4(clipPosition, 0.0, 1.0);
        vUV = aUV;
      }`;
    } else {
      return `attribute vec2 aPosition;
      attribute vec2 aUV;
      uniform vec2 uResolution;
      varying vec2 vUV;
      void main() {
        vec2 clipPosition = (aPosition / uResolution) * 2.0 - 1.0;
        clipPosition.y *= -1.0;
        gl_Position = vec4(clipPosition, 0.0, 1.0);
        vUV = aUV;
      }`;
    }
  }
  _getTextureFragmentShaderSource(webgl2) {
    if(webgl2) {
      return `#version 300 es
      precision mediump float;
      in vec2 vUV;
      uniform sampler2D uTexture;
      out vec4 outColor;
      void main() {
        outColor = texture(uTexture, vUV);
      }`;
    } else {
      return `precision mediump float;
      varying vec2 vUV;
      uniform sampler2D uTexture;
      void main() {
        gl_FragColor = texture2D(uTexture, vUV);
      }`;
    }
  }
  _initializeTextureRenderer() {
    if(this._textureProgram) return true;
    var gl = this._gameLib.webgl;
    var webgl2 = !this._gameLib.options || this._gameLib.options.webGL2 !== false;
    var vertexSource = this._getTextureVertexShaderSource(webgl2);
    var fragmentSource = this._getTextureFragmentShaderSource(webgl2);
    var vertexShader = this._gameLib.compileShader(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = this._gameLib.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if(!vertexShader || !fragmentShader) return false;
    this._textureProgram = this._gameLib.createProgram(vertexShader, fragmentShader);
    if(!this._textureProgram) return false;
    this._textureBuffer = gl.createBuffer();
    this._texturePositionLocation = gl.getAttribLocation(this._textureProgram, "aPosition");
    this._textureUVLocation = gl.getAttribLocation(this._textureProgram, "aUV");
    this._textureResolutionLocation = gl.getUniformLocation(this._textureProgram, "uResolution");
    this._textureSamplerLocation = gl.getUniformLocation(this._textureProgram, "uTexture");
    return Boolean(this._textureBuffer);
  }
  _renderTexturedObject(object) {
    var gl = this._gameLib.webgl;
    var source = object.source;
    if(!source || !this._initializeTextureRenderer()) return;
    if(!this._textureProgram || !this._textureBuffer) return;
    if(!object._glTexture) {
      object._glTexture = gl.createTexture();
      object.textureDirty = true;
      gl.bindTexture(gl.TEXTURE_2D, object._glTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, object._glTexture);
    if(object.textureDirty && source.complete !== false) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      object.textureDirty = false;
    }
    var x = object.x;
    var y = object.y;
    var right = x + object.width;
    var bottom = y + object.height;
    var vertices = new Float32Array([
      x, y, 0, 0,
      right, y, 1, 0,
      x, bottom, 0, 1,
      x, bottom, 0, 1,
      right, y, 1, 0,
      right, bottom, 1, 1
    ]);
    gl.useProgram(this._textureProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    var stride = 4 * Float32Array.BYTES_PER_ELEMENT;
    gl.enableVertexAttribArray(this._texturePositionLocation);
    gl.vertexAttribPointer(this._texturePositionLocation, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this._textureUVLocation);
    gl.vertexAttribPointer(this._textureUVLocation, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    gl.uniform2f(this._textureResolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1i(this._textureSamplerLocation, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
  addObject(object) {
    object.id = GameLibCore.Utils.UUID();
    this._uiObjects.push(object);
    return object.id;
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
    var vertexShader = this._gameLib.compileShader(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = this._gameLib.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if(!vertexShader || !fragmentShader) return false;
    this._program = this._gameLib.createProgram(vertexShader, fragmentShader);
    if(!this._program) return false;
    this._buffer = gl.createBuffer();
    this._positionLocation = gl.getAttribLocation(this._program, "aPosition");
    this._colorLocation = gl.getAttribLocation(this._program, "aColor");
    this._resolutionLocation = gl.getUniformLocation(this._program, "uResolution");
    return Boolean(this._buffer);
  }
  render(scene) {
    this._vertices = [];
    for(var i=0;i<this._uiObjects.length;i++) {
      var object = this._uiObjects[i];
      if(object.scene === scene && object.visible !== false) {
        if(object.update && typeof object.update === "function") object.update();
        this.renderObject(object);
      }
    }
    if(this._vertices.length === 0 || !this._initialize()) return;
    var gl = this._gameLib.webgl;
    var vertices = new Float32Array(this._vertices);
    var bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;
    var vertexStride = 6 * bytesPerFloat;
    gl.useProgram(this._program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this._positionLocation);
    gl.vertexAttribPointer(this._positionLocation, 2, gl.FLOAT, false, vertexStride, 0);
    gl.enableVertexAttribArray(this._colorLocation);
    gl.vertexAttribPointer(this._colorLocation, 4, gl.FLOAT, false, vertexStride, 2 * bytesPerFloat);
    gl.uniform2f(this._resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
  }
  renderObject(object) {
    if(object.update && typeof object.update == "function") object.update();
    if(object.isTexturedUI) return this._renderTexturedObject(object);
    var x = object.x;
    var y = object.y;
    var width = object.width;
    var height = object.height;
    var color = object.color || [1.0, 1.0, 1.0, 1.0];
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var a = color[3];
    var addVertex = (px, py) => {
      this._vertices.push(px, py, r, g, b, a);
    };
    addVertex(x, y);
    addVertex(x + width, y);
    addVertex(x, y + height);
    addVertex(x, y + height);
    addVertex(x + width, y);
    addVertex(x + width, y + height);
  }
}
export {
  UIRenderer
}

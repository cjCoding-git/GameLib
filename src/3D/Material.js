import { GameLibCore } from "../Core/index.js"
class Material {
  constructor(gameLib, shader = null) {
    if (!gameLib) {
      throw new GameLibCore.Error("Constructing a Material requires a GameLib instance.");
    }
    this.gameLib = gameLib;
    this.program = shader;
    this.hasColor = false;
    this.color = null;
    this.gradient = null;
    this.texture = null;
    this.textureUnit = 0;
    this.uniforms = {};
  }
  static webGL1VertexShader = `
    attribute vec3 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec2 aTextureCoord;
    attribute vec3 aVertexNormal;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uNormalMatrix;
    varying vec4 vColor;
    varying vec2 vUV;
    varying vec3 vNormal;
    void main() {
      vColor = aVertexColor;
      vUV = aTextureCoord;
      vNormal = normalize((uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz);
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    }
  `;
  static webGL1FragmentShader = `
    precision mediump float;
    varying vec4 vColor;
    varying vec2 vUV;
    varying vec3 vNormal;
    uniform sampler2D uTexture;
    uniform bool uUseTexture;
    uniform vec3 uLightDirection;
    uniform vec3 uAmbientColor;
    uniform vec3 uLightColor;
    void main() {
      vec4 color = vColor;
      if (uUseTexture) {
        color *= texture2D(uTexture, vUV);
      }
      float diffuse = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);
      vec3 illumination = uAmbientColor + uLightColor * diffuse;
      gl_FragColor = vec4(color.rgb * illumnation, color.a);
    }
  `;
  static webGL2VertexShader = `#version 300 es
    in vec3 aVertexPosition;
    in vec4 aVertexColor;
    in vec2 aTextureCoord;
    in vec3 aVertexNormal;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uNormalMatrix;
    out vec4 vColor;
    out vec2 vUV;
    out vec3 vNormal;
    void main() {
      vColor = aVertexColor;
      vUV = aTextureCoord;
      vNormal = normalize((uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz);
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    }
  `;
  static webGL2FragmentShader = `#version 300 es
    precision mediump float;
    in vec4 vColor;
    in vec2 vUV;
    in vec3 vNormal;
    uniform sampler2D uTexture;
    uniform bool uUseTexture;
    uniform vec3 uLightDirection;
    uniform vec3 uAmbientColor;
    uniform vec3 uLightColor;
    out vec4 outColor;
    void main() {
      vec4 color = vColor;
      if (uUseTexture) {
        color *= texture(uTexture, vUV);
      }
      float diffuse = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);
      vec3 illumination = uAmbientColor + uLightColor * diffuse;
      outColor = vec4(color.rgb * illumination, color.a);
    }
  `;
  static get standardVertexShader() {
    return Material.webGL1VertexShader;
  }
  static get standardFragmentShader() {
    return Material.webGL1FragmentShader;
  }
  static normalizeColor(color) {
    if (!Array.isArray(color)) {
      return [ 1.0, 1.0, 1.0, 1.0 ];
    }
    if (color.length === 3) {
      return [ color[0], color[1], color[2], 1.0 ];
    }
    if (color.length >= 4) {
      return [ color[0], color[1], color[2], color[3] ];
    }
    return [ 1.0, 1.0, 1.0, 1.0 ];
  }
  static interpolate(a, b, t) {
    return a + (b - a) * t;
  }
  static createStandardProgram(gameLib) {
    if (!gameLib || !gameLib.webgl) {
      throw new GameLibCore.Error("Material.createStandardProgram(gameLib) requires a GameLib instance with a WebGL context.");
    }
    var webgl = gameLib.webgl;
    var isWebGL2 = !gameLib.options || gameLib.options.webGL2 !== false;
    var vertexSource = isWebGL2 ? Material.webGL2VertexShader : Material.webGL1VertexShader;
    var fragmentSource = isWebGL2 ? Material.webGL2FragmentShader : Material.webGL1FragmentShader;
    var vertexShader = gameLib.compileShader(webgl.VERTEX_SHADER, vertexSource);
    var fragmentShader = gameLib.compileShader(webgl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      console.warn("[GameLib] Standard material shader compilation failed.");
      return null;
    }
    var program = gameLib.createProgram(vertexShader, fragmentShader);
    if (!program) {
      console.warn("[GameLib] Standard material shader linking failed.");
      return null;
    }
    return program;
  }
  static getDefaultProgram(gameLib) {
    return Material.createStandardProgram(gameLib);
  }
  ensureProgram(gameLib = this.gameLib) {
    if (!this.program && gameLib) {
      this.program = Material.createStandardProgram(gameLib);
    }
    return this.program;
  }
  setColor(color) {
    this.color = Material.normalizeColor(color);
    this.hasColor = true;
    this.gradient = null;
    return this;
  }
  setTexture(texture) {
    this.texture = texture;
    return this;
  }
  setGradient(stops, options = {}) {
    if (!Array.isArray(stops) || stops.length === 0) {
      this.gradient = null;
      return this;
    }
    this.gradient = {
      source: options.source || "uv",
      axis: options.axis || "y",
      stops: stops
        .map((stop) => {
          if (!Array.isArray(stop) || stop.length < 2) {
            return null;
          }
          return [ Number(stop[0]), Material.normalizeColor(stop[1]) ];
        })
        .filter(Boolean)
        .sort((a, b) => a[0] - b[0])
    };
    if (this.gradient.stops.length === 0) {
      this.gradient = null;
      return this;
    }
    this.hasColor = true;
    this.color = null;
    return this;
  }
  interpolateGradient(value) {
    if (!this.gradient || this.gradient.stops.length === 0) {
      return [ 1.0, 1.0, 1.0, 1.0 ];
    }
    var stops = this.gradient.stops;
    if (value <= stops[0][0]) {
      return stops[0][1];
    }
    for (var i = 0; i < stops.length - 1; i++) {
      var current = stops[i];
      var next = stops[i + 1];
      if (value >= current[0] && value <= next[0]) {
        var t = (value - current[0]) / (next[0] - current[0] || 1);
        return [
          Material.interpolate(current[1][0], next[1][0], t),
          Material.interpolate(current[1][1], next[1][1], t),
          Material.interpolate(current[1][2], next[1][2], t),
          Material.interpolate(current[1][3], next[1][3], t)
        ];
      }
    }
    return stops[stops.length - 1][1];
  }
  getVertexColors(geometry) {
    var vertexCount = Math.max(1, Math.floor((geometry.positions?.length || 0) / 3));
    var colors = [];
    if (!this.hasColor && !this.gradient) {
      for (var i = 0; i < vertexCount; i++) {
        colors.push(1.0, 1.0, 1.0, 1.0);
      }
      return new Float32Array(colors);
    }
    if (this.gradient) {
      var axis = (this.gradient.axis || "y").toLowerCase();
      var source = (this.gradient.source || "uv").toLowerCase();
      var axisIndex = axis === "x" ? 0 : axis === "z" ? 2 : 1;
      var coordinates = [];
      if (source === "position" && Array.isArray(geometry.positions)) {
        for (var i = 0; i < vertexCount; i++) {
          coordinates.push(geometry.positions[i * 3 + axisIndex]);
        }
      } else if (Array.isArray(geometry.uv)) {
        var uvIndex = axis === "x" ? 0 : 1;
        for (var i = 0; i < vertexCount; i++) {
          coordinates.push(geometry.uv[i * 2 + uvIndex] ?? 0.5);
        }
      } else if (Array.isArray(geometry.positions)) {
        for (var i = 0; i < vertexCount; i++) {
          coordinates.push(geometry.positions[i * 3 + axisIndex]);
        }
      } else {
        for (var i = 0; i < vertexCount; i++) {
          coordinates.push(0.5);
        }
      }
      for (var i = 0; i < vertexCount; i++) {
        var color = this.interpolateGradient(coordinates[i]);
        colors.push(color[0], color[1], color[2], color[3]);
      }
      return new Float32Array(colors);
    }
    var baseColor = Material.normalizeColor(this.color || [ 1.0, 1.0, 1.0, 1.0 ]);
    for (var i = 0; i < vertexCount; i++) {
      colors.push(baseColor[0], baseColor[1], baseColor[2], baseColor[3]);
    }
    return new Float32Array(colors);
  }
}
export {
  Material
}

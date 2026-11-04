class Material {
  constructor(shader = null) {
    this.program = shader;
    this.hasColor = false;
    this.color = null;
    this.gradient = null;
    this.texture = null;
    this.textureUnit = 0;
    this.uniforms = {};
  }

  static standardVertexShader = `
    attribute vec3 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec2 aTextureCoord;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;

    varying vec4 vColor;
    varying vec2 vUV;

    void main() {
      vColor = aVertexColor;
      vUV = aTextureCoord;
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    }
  `;

  static standardFragmentShader = `
    precision mediump float;

    varying vec4 vColor;
    varying vec2 vUV;

    uniform sampler2D uTexture;
    uniform bool uUseTexture;

    void main() {
      vec4 color = vColor;
      if (uUseTexture) {
        color *= texture2D(uTexture, vUV);
      }
      gl_FragColor = color;
    }
  `;

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
      throw new Error("Material.createStandardProgram(gameLib) requires a GameLib instance with a WebGL context.");
    }
    var webgl = gameLib.webgl;
    var vertexShader = gameLib.compileShader(webgl.VERTEX_SHADER, Material.standardVertexShader);
    var fragmentShader = gameLib.compileShader(webgl.FRAGMENT_SHADER, Material.standardFragmentShader);
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

  ensureProgram(gameLib) {
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

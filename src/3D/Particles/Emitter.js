import { Object } from "../Object.js"
import { Transform } from "../Transform.js"
import { Particle } from "./Particle.js"
import { EmitterOptions } from "./EmitterOptions.js"
import GL1Vertex from "../../Shaders/Particle/Vertex/GL1.glsl"
import GL2Vertex from "../../Shaders/Particle/Vertex/GL2.glsl"
import GL1Fragment from "../../Shaders/Particle/Fragment/GL1.glsl"
import GL2Fragment from "../../Shaders/Particle/Fragment/GL2.glsl"
var vec = (value, size) => Array.from({ length: size }, (_, i) => Number(value?.[i]) || 0);
var range = (min, max) => min + Math.random() * (max - min);
class Emitter extends Object {
  constructor(gameLib, scene, transform = new Transform(), options = new EmitterOptions()) {
    super(gameLib, scene);
    this.transform = transform;
    this.options = options;
    this._particles = [];
    this._emitAccumulator = 0;
    this._elapsed = 0;
    this._lastTime = null;
    this._playing = Boolean(options.playOnAwake && options.active);
    if (options.burstCount > 0 && this._playing) this.emit(options.burstCount);
    this._program = null;
    this._buffer = null;
  }
  get particles() { return this._particles; }
  get isPlaying() { return this._playing; }
  play() { this._playing = true; this._elapsed = 0; return this; }
  pause() { this._playing = false; return this; }
  stop(clear = false) { this._playing = false; this._emitAccumulator = 0; if (clear) this.clearParticles(); return this; }
  clearParticles() { this._particles.length = 0; }
  _spawnPosition() {
    var options = this.options;
    var offset = vec(options.positionOffset, 3);
    var variance = vec(options.positionVariance, 3);
    var position = [this.transform.position.x, this.transform.position.y, this.transform.position.z];
    for (let i = 0; i < 3; i++) position[i] += offset[i] + range(-Math.abs(variance[i]), Math.abs(variance[i]));
    var shape = options.shapeOptions || {};
    if (options.shape === "sphere" || options.shape === "circle") {
      var u = Math.random() * 2 - 1;
      var angle = Math.random() * (shape.arc || Math.PI * 2);
      var radius = Math.cbrt(Math.random()) * (shape.radius || 1);
      position[0] += radius * Math.sqrt(1 - u * u) * Math.cos(angle);
      position[1] += radius * u;
      position[2] += radius * Math.sqrt(1 - u * u) * Math.sin(angle);
    } else if (options.shape === "box" || options.shape === "rectangle") {
      for (let i = 0; i < 3; i++) position[i] += range(-0.5, 0.5) * (shape.size?.[i] || 0);
    } else if (options.shape === "line") {
      const t = Math.random() - 0.5;
      for (let i = 0; i < 3; i++) position[i] += t * (shape.size?.[i] || 0);
    }
    return position;
  }
  emit(count = 1) {
    for (let n = 0; n < Math.max(0, Math.floor(count)) && this._particles.length < this.options.maxParticles; n++) {
      var particleOptions = this.options.particleOptions;
      var direction = vec(this.options.direction, 3).map((value, axis) => value + range(-Math.abs(this.options.directionVariance?.[axis] || 0), Math.abs(this.options.directionVariance?.[axis] || 0)));
      var length = Math.hypot(...direction) || 1;
      var speed = range(Number(this.options.speed?.min) || 0, Number(this.options.speed?.max) || 0);
      var velocity = particleOptions.velocity || {};
      var startVelocity = vec(velocity.start, 3).map((value, axis) => value + direction[axis] / length * speed);
      var options = { ...particleOptions, velocity: { ...velocity, start: startVelocity } };
      this._particles.push(new Particle(this._spawnPosition(), options));
    }
    return this._particles;
  }
  update(deltaMs = 1000 / 60) {
    var dtMs = Math.max(0, Number(deltaMs) || 0) * Math.max(0, Number(this.options.timeScale) || 0);
    this._particles.forEach(particle => particle.update(dtMs));
    this._particles = this._particles.filter(particle => particle.alive);
    if (!this._playing || !this.options.active) return this._particles;
    this._elapsed += dtMs;
    var durationMs = Number(this.options.duration) * 1000;
    if (Number.isFinite(durationMs) && this._elapsed >= durationMs) {
      if (this.options.loop) this._elapsed %= Math.max(1, durationMs);
      else { this._playing = false; return this._particles; }
    }
    var rate = Number(this.options.emissionRate);
    if (rate > 0) {
      this._emitAccumulator += dtMs * rate / 1000;
      var count = Math.floor(this._emitAccumulator);
      if (count) { this._emitAccumulator -= count; this.emit(count); }
    } else if (this.options.emitDelay > 0) {
      this._emitAccumulator += dtMs;
      while (this._emitAccumulator >= this.options.emitDelay) { this._emitAccumulator -= this.options.emitDelay; this.emit(); }
    }
    for (var burst of this.options.bursts || []) {
      var at = Number(burst.time) * 1000;
      if (Number.isFinite(at) && this._elapsed - dtMs < at && this._elapsed >= at) this.emit(burst.count || 1);
    }
    return this._particles;
  }
  _initialize() {
    if (this._program) return true;
    var webGL2 = this._gameLib.options && this._gameLib.options.webGL2 !== false;
    var gl = this._gl;
    var compile = (type, source) => {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    };
    var vertex = compile(gl.VERTEX_SHADER, webGL2 ? GL2Vertex : GL1Vertex);
    var fragment = compile(gl.FRAGMENT_SHADER, webGL2 ? GL2Fragment : GL1Fragment);
    if (!vertex || !fragment) return false;
    var program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return false; }
    this._program = program;
    this._buffer = gl.createBuffer();
    this._positionLocation = gl.getAttribLocation(program, "aPosition");
    this._colorLocation = gl.getAttribLocation(program, "aColor");
    this._matrixLocation = gl.getUniformLocation(program, "uViewProjection");
    this._sizeLocation = gl.getUniformLocation(program, "uPointSize");
    return Boolean(this._buffer);
  }
  draw(camera) {
    var now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this._lastTime !== null) this.update(now - this._lastTime);
    this._lastTime = now;
    if (!this._particles.length || !camera || !this._initialize()) return;
    var gl = this._gl;
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projection = camera.getProjectionMatrix(aspect);
    var view = camera.getViewMatrix();
    var matrix = new Float32Array(16);
    for (var column = 0; column < 4; column++) for (var row = 0; row < 4; row++) {
      matrix[column * 4 + row] = view[row] * projection[column * 4] + view[4 + row] * projection[column * 4 + 1] + view[8 + row] * projection[column * 4 + 2] + view[12 + row] * projection[column * 4 + 3];
    }
    var data = [];
    for (var particle of this._particles) {
      data.push(...particle.position, ...particle.color, Math.max(0, Math.min(1, particle.opacity)));
    }
    gl.useProgram(this._program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    var stride = 7 * Float32Array.BYTES_PER_ELEMENT;
    gl.enableVertexAttribArray(this._positionLocation);
    gl.vertexAttribPointer(this._positionLocation, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this._colorLocation);
    gl.vertexAttribPointer(this._colorLocation, 4, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.uniformMatrix4fv(this._matrixLocation, false, matrix);
    gl.uniform1f(this._sizeLocation, Math.max(1, Number(this.options.particleOptions.size?.start) || 4));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS, 0, this._particles.length);
  }
}
export {
  Emitter
}

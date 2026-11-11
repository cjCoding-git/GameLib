import { Renderable } from "../Renderable.js"
import { EmitterOptions } from "./EmitterOptions.js"
import { Particle } from "./Particle.js"
class Emitter extends Renderable {
  constructor(options = new EmitterOptions(), scene = null) {
    if (options && !options.particleOptions && typeof options === "object") {
      scene = options;
      options = new EmitterOptions();
    }
    super(scene);
    this.options = options;
    this._particles = [];
    this._emitAccumulator = 0;
    this._elapsed = 0;
    this._lastFrameTime = null;
    this._playing = Boolean(options.playOnAwake && options.active);
    this.position = [0, 0];
    if (options.burstCount > 0 && this._playing) this.emit(options.burstCount);
  }
  get particles() { return this._particles; }
  get isPlaying() { return this._playing; }
  play() { this._playing = true; this._elapsed = 0; return this; }
  pause() { this._playing = false; return this; }
  stop(clear = false) { this._playing = false; this._emitAccumulator = 0; if (clear) this.clearParticles(); return this; }
  clearParticles() { this._particles.length = 0; }
  emit(count = 1) {
    var options = this.options;
    for (var i = 0; i < Math.max(0, Math.floor(count)); i++) {
      if (this._particles.length >= options.maxParticles) break;
      var spawn = this._getSpawnPosition();
      var particleOptions = options.particleOptions;
      var speed = options.speed || { min: 0, max: 0 };
      var magnitude = speed.min + Math.random() * (speed.max - speed.min);
      var direction = (options.direction || [0, -1]).map((value, axis) => value + (Math.random() * 2 - 1) * (options.directionVariance?.[axis] || 0));
      var length = Math.hypot(...direction) || 1;
      var velocity = particleOptions.velocity || {};
      var start = (velocity.start || [0, 0]).map((value, axis) => value + direction[axis] / length * magnitude);
      var configured = { ...particleOptions, velocity: { ...velocity, start } };
      this._particles.push(new Particle(spawn, configured));
    }
    return this._particles;
  }
  _getSpawnPosition() {
    var options = this.options;
    var offset = options.positionOffset || [0, 0];
    var variance = options.positionVariance || [0, 0];
    var x = this.position[0] + (offset[0] || 0) + (Math.random() * 2 - 1) * (variance[0] || 0);
    var y = this.position[1] + (offset[1] || 0) + (Math.random() * 2 - 1) * (variance[1] || 0);
    var shape = options.shapeOptions || {};
    if (options.shape === "circle" || options.shape === "sphere") {
      var angle = Math.random() * (shape.arc || Math.PI * 2);
      var radius = Math.sqrt(Math.random()) * (shape.radius || 1);
      x += Math.cos(angle) * radius;
      y += Math.sin(angle) * radius;
    } else if (options.shape === "rectangle" || options.shape === "box") {
      x += (Math.random() - 0.5) * (shape.size?.[0] || 0);
      y += (Math.random() - 0.5) * (shape.size?.[1] || 0);
    } else if (options.shape === "line") {
      var amount = Math.random() - 0.5;
      x += amount * (shape.size?.[0] || 0);
      y += amount * (shape.size?.[1] || 0);
    }
    return [x, y];
  }
  update(deltaMs = 1000 / 60) {
    var scaledDelta = Math.max(0, Number(deltaMs) || 0) * Math.max(0, Number(this.options.timeScale) || 0);
    for (var particle of this._particles) particle.update(scaledDelta);
    this._particles = this._particles.filter(particle => particle.alive);
    if (!this._playing || !this.options.active) return this._particles;
    this._elapsed += scaledDelta;
    var duration = Number(this.options.duration);
    if (Number.isFinite(duration) && this._elapsed >= duration * 1000) {
      if (this.options.loop) this._elapsed %= Math.max(1, duration * 1000);
      else { this._playing = false; return this._particles; }
    }
    const rate = Number(this.options.emissionRate);
    if (rate > 0) {
      this._emitAccumulator += scaledDelta * rate / 1000;
      var count = Math.floor(this._emitAccumulator);
      if (count > 0) { this._emitAccumulator -= count; this.emit(count); }
    } else if (this.options.emitDelay > 0) {
      this._emitAccumulator += scaledDelta;
      while (this._emitAccumulator >= this.options.emitDelay) {
        this._emitAccumulator -= this.options.emitDelay;
        this.emit(1);
      }
    }
    for (var burst of this.options.bursts || []) {
      var burstTime = Number(burst.time) * 1000;
      if (Number.isFinite(burstTime) && this._elapsed - scaledDelta < burstTime && this._elapsed >= burstTime) this.emit(burst.count || 1);
    }
    return this._particles;
  }
  draw() {
    var now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this._lastFrameTime !== null) this.update(now - this._lastFrameTime);
    this._lastFrameTime = now;
    for (var particle of this._particles) particle.draw(this._ctx);
  }
}
export {
  Emitter
}

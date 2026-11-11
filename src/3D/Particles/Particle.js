import { Transform } from "../Transform.js"
var vec = (value, size) => Array.from({ length: size }, (_, i) => Number(value?.[i]) || 0);
var range = (min, max) => min + Math.random() * (max - min);
var lerp = (a, b, t) => a + (b - a) * t;
class Particle {
  constructor(positionOrTransform = new Transform(), options = {}) {
    this.options = options;
    var position = positionOrTransform instanceof Transform ? positionOrTransform.position : positionOrTransform;
    this.transform = positionOrTransform instanceof Transform ? positionOrTransform : new Transform();
    if (!(positionOrTransform instanceof Transform)) {
      this.transform.position.x = Number(position?.[0]) || 0;
      this.transform.position.y = Number(position?.[1]) || 0;
      this.transform.position.z = Number(position?.[2]) || 0;
    }
    this.position = [this.transform.position.x, this.transform.position.y, this.transform.position.z];
    this.velocity = vec(options.velocity?.start, 3);
    this.age = 0;
    this.lifetime = Math.max(0, Number(options.lifetime) || 0) + range(-Math.abs(Number(options.lifetimeVariance) || 0), Math.abs(Number(options.lifetimeVariance) || 0));
    this.lifetime = Math.max(0, this.lifetime);
    this.alive = this.lifetime > 0;
    this.rotation = vec(options.rotation?.start, 3);
    this.angularVelocity = vec(options.angularVelocity, 3);
    var baseSize = Number(options.size?.start) || 0;
    var variance = Number(options.sizeVariance) || 0;
    this.size = baseSize + range(-Math.abs(variance), Math.abs(variance));
    this.opacity = Number(options.opacity?.start ?? 1);
    this.color = [...(options.color?.start || [1, 1, 1])];
    this.shape = String(options.shape || "circle").toLowerCase();
    this.outline = {
      width: Number(options.outline?.width) || 0,
      color: Array.isArray(options.outline?.color) ? [...options.outline.color] : [0, 0, 0, 1]
    }; 
    this.outline.color = Array.from({ length: 4 }, (_, i) => Number(this.outline.color?.[i] ?? (i === 3 ? 1 : 0)));
  }
  update(deltaMs) {
    if (!this.alive || deltaMs <= 0) return;
    var dt = deltaMs / 1000;
    this.age += deltaMs;
    var t = Math.min(1, this.age / this.lifetime);
    var options = this.options;
    var acceleration = vec(options.acceleration, 3);
    acceleration[1] -= 9.81 * (Number(options.gravityScale) || 0);
    var drag = Math.max(0, Number(options.drag) || 0);
    for (var i = 0; i < 3; i++) {
      var target = lerp(Number(options.velocity?.start?.[i]) || 0, Number(options.velocity?.end?.[i]) || 0, t);
      this.velocity[i] += (acceleration[i] + (target - this.velocity[i]) * Math.min(1, dt)) * dt;
      this.velocity[i] *= Math.max(0, 1 - drag * dt);
      this.position[i] += this.velocity[i] * dt;
      this.rotation[i] += (this.angularVelocity[i] + (Number(options.angularAcceleration?.[i]) || 0) * dt) * dt;
    }
    this.transform.position.x = this.position[0];
    this.transform.position.y = this.position[1];
    this.transform.position.z = this.position[2];
    this.size = Math.max(0, lerp(Number(options.size?.start) || 0, Number(options.size?.end) || 0, t));
    if (Number(options.sizeVariance) > 0) this.size += range(-Math.abs(Number(options.sizeVariance) || 0), Math.abs(Number(options.sizeVariance) || 0)) * (1 - t);
    this.opacity = lerp(Number(options.opacity?.start ?? 1), Number(options.opacity?.end ?? 0), t);
    this.color = Array.from({ length: 3 }, (_, i) => lerp(Number(options.color?.start?.[i]) || 0, Number(options.color?.end?.[i]) || 0, t));
    this.shape = String(options.shape || this.shape || "circle").toLowerCase();
    this.outline = {
      width: Number(options.outline?.width) || 0,
      color: Array.isArray(options.outline?.color) ? [...options.outline.color] : [0, 0, 0, 1]
    };
    this.outline.color = Array.from({ length: 4 }, (_, i) => Number(this.outline.color?.[i] ?? (i === 3 ? 1 : 0)));
    if (options.collision && this.position[1] < 0 && this.velocity[1] < 0) {
      this.position[1] = 0;
      this.velocity[1] *= -Math.max(0, Number(options.restitution) || 0);
    }
    if (this.age >= this.lifetime) this.alive = false;
  }
}
export {
  Particle
}

var vector = (value, dimensions) => Array.from({ length: dimensions }, (_, index) => Number(value?.[index]) || 0);
var randomBetween = (min, max) => min + Math.random() * (max - min);
var lerp = (start, end, amount) => start + (end - start) * amount;
var lerpArray = (start, end, amount, dimensions) => Array.from({ length: dimensions }, (_, index) => lerp(Number(start?.[index]) || 0, Number(end?.[index]) || 0, amount));
class Particle {
  constructor(position = [0, 0], options = {}) {
    this.options = options;
    this.position = vector(position, 2);
    var velocity = options.velocity || {};
    this.velocity = vector(velocity.start, 2);
    this.age = 0;
    this.lifetime = Math.max(0, Number(options.lifetime) || 0) + randomBetween(-Math.abs(Number(options.lifetimeVariance) || 0), Math.abs(Number(options.lifetimeVariance) || 0));
    this.lifetime = Math.max(0, this.lifetime);
    this.alive = this.lifetime > 0;
    this.rotation = Number(options.rotation?.start) || 0;
    this.angularVelocity = Number(options.angularVelocity) || 0;
    this.size = Number(options.size?.start) || 0;
    this.opacity = Number(options.opacity?.start ?? 1);
    this.color = [...(options.color?.start || [1, 1, 1])];
  }
  update(deltaMs) {
    if (!this.alive || deltaMs <= 0) return;
    var dt = deltaMs / 1000;
    this.age += deltaMs;
    var t = Math.min(1, this.age / this.lifetime);
    var options = this.options;
    var acceleration = vector(options.acceleration, 2);
    var endVelocity = vector(options.velocity?.end, 2);
    var drag = Math.max(0, Number(options.drag) || 0);
    for (var i = 0; i < 2; i++) {
      var targetVelocity = lerp(Number(options.velocity?.start?.[i]) || 0, endVelocity[i], t);
      this.velocity[i] += (acceleration[i] + (targetVelocity - this.velocity[i]) * Math.min(1, dt)) * dt;
      this.velocity[i] *= Math.max(0, 1 - drag * dt);
      this.position[i] += this.velocity[i] * dt;
    }
    this.rotation += (this.angularVelocity + (Number(options.angularAcceleration) || 0) * dt) * dt;
    this.size = Math.max(0, lerp(Number(options.size?.start) || 0, Number(options.size?.end) || 0, t) + randomBetween(-Math.abs(Number(options.sizeVariance) || 0), Math.abs(Number(options.sizeVariance) || 0)) * Math.min(1, dt));
    this.opacity = lerp(Number(options.opacity?.start ?? 1), Number(options.opacity?.end ?? 0), t);
    this.color = lerpArray(options.color?.start, options.color?.end, t, 3);
    if (options.collision && this.position[1] > 0 && this.velocity[1] > 0) {
      this.position[1] = 0;
      this.velocity[1] *= -Math.max(0, Number(options.restitution) || 0);
    }
    if (this.age >= this.lifetime) this.alive = false;
  }
  draw(ctx) {
    if (!this.alive || !ctx) return;
    var size = this.size;
    var color = this.options.color?.start;
    var cssColor = typeof color === "string" ? color : `rgb(${this.color.map(value => Math.round(Math.max(0, Math.min(1, value)) * 255)).join(",")})`;
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, this.opacity));
    ctx.translate(this.position[0], this.position[1]);
    ctx.rotate(this.rotation * Math.PI / 180);
    if (this.options.texture && typeof ctx.drawImage === "function") {
      var image = this.options.texture.image || this.options.texture;
      ctx.drawImage(image, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = cssColor;
      if (this.options.shape === "square") ctx.fillRect(-size / 2, -size / 2, size, size);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
export {
  Particle
}

class ParticleOptions {
  constructor() {
    this.color = {
      start: [1, 1, 1],
      end: [0.5, 0.5, 0.5]
    };
    this.lifetime = 10000;
    this.lifetimeVariance = 0;
    this.opacity = {
      start: 1,
      end: 0
    };
    this.size = {
      start: 4,
      end: 2
    };
    this.sizeVariance = 0;
    this.velocity = {
      start: [0, 0],
      end: [0, 0]
    };
    this.acceleration = [0, 0];
    this.gravityScale = 0;
    this.drag = 0;
    this.mass = 1;
    this.rotation = {
      start: 0,
      end: 0
    };
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.texture = null;
    this.material = null;
    this.blendMode = "normal";
    this.renderOrder = 0;
    this.spriteSheet = {
      columns: 1,
      rows: 1,
      frameCount: 1,
      frameRate: 0,
      loop: true
    };
    this.collision = false;
    this.restitution = 0;
    this.friction = 0;
  }
}
export {
  ParticleOptions
}

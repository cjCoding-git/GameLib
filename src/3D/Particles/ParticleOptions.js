class ParticleOptions {
  constructor() {
    this.color = {
      start: [1.0, 1.0, 1.0],
      end: [0.5, 0.5, 0.5]
    }
    this.lifetime = 10000;
    this.opacity = {
      start: 1,
      end: 0
    };
    this.size = {
      start: 4,
      end: 2,
    };
    this.collision = false;
  }
}
export {
  ParticleOptions
}

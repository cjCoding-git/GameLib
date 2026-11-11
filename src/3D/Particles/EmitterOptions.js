import { ParticleOptions } from "./ParticleOptions.js"
class EmitterOptions {
  constructor() {
    this.particleOptions = new ParticleOptions();
    this.emitDelay = 1;
    this.maxParticles = 100;
    this.playOnAwake = true;
    this.loop = true;
    this.duration = Infinity;
    this.emissionRate = 1;
    this.burstCount = 0;
    this.bursts = [];
    this.prewarm = false;
    this.timeScale = 1;
    this.shape = "point";
    this.shapeOptions = {
      radius: 1,
      size: [1, 1, 1],
      arc: Math.PI * 2
    };
    this.positionOffset = [0, 0, 0];
    this.positionVariance = [0, 0, 0];
    this.direction = [0, 1, 0];
    this.directionVariance = [0, 0, 0];
    this.speed = {
      min: 0,
      max: 0
    };
    this.velocityInheritance = 0;
    this.simulationSpace = "local";
    this.randomSeed = null;
    this.active = true;
    this.updateOptions = null;
  }
}
export {
  EmitterOptions
}

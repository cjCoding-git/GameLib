import { ParticleOptions } from "./ParticleOptions.js"
class EmitterOptions {
  constructor() {
    this.particleOptions = new ParticleOptions();
    this.emitDelay = 1;
    this.maxParticles = 100;
  }
}
export {
  EmitterOptions
}

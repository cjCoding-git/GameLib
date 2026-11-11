import { GameLibCore } from "../../Core/index.js"
import { Emitter } from "./Emitter.js"
import { Particle } from "./Particle.js"
import { ParticleOptions } from "./ParticleOptions.js"
import { EmitterOptions } from "./EmitterOptions.js"
class Particles {
  constructor() {
    throw new GameLibCore.Error("Class Particles may not be constructed!");
  }
  static Emitter = Emitter;
  static Particle = Particle;
  static ParticleOptions = ParticleOptions;
  static EmitterOptions = EmitterOptions;
}
export {
  Particles
}

import { GameLibCore } from "../../Core/index.js"
import { Emitter } from "./Emitter.js"
import { Particle } from "./Particle.js"
class Particles {
  constructor() {
    throw new GameLibCore.Error("Class Particles may not be constructed!");
    static Emitter = Emitter;
    static Particle = Particle;
  }
}
export {
  Particles
}

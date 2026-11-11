import { Transform } from "../Transform.js"
import { Particle } from "./Particle.js"
import { EmitterOptions } from "./EmitterOptions.js"
class Emitter {
  constructor(transform=new Transform(), options=new EmitterOptions()) {
    this.transform = transform;
    this.options = options;
    this._particles = [];
  }
  emitParticle() {
    var particle = new Particle(this.transform.clone(), this.options);
  }
  clearParticles() {
    this._particles = [];
  }
}
export {
  Emitter
}

import { Transform } from "../Transform.js"
import { GameLibCore } from "../../Core/index.js"
class Emitter {
  constructor(transform=new Transform(), options=new GameLibCore.ParticleOptions()) {
    this.transform = transform;
    this.options = options;
  }
}
export {
  Emitter
}

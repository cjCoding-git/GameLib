import { Transform } from "../Transform.js"
import { EmitterOptions } from "./EmitterOptions.js"
class Emitter {
  constructor(transform=new Transform(), options=new EmitterOptions()) {
    this.transfoerm = transform;
    this.options = options;
  }
}
export {
  Emitter
}

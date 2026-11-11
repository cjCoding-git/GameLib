import { EmitterOptions } from "./EmitterOptions.js"
class Emitter {
  constructor(options = new EmitterOptions()) {
    this.options = options;
  }
}
export {
  Emitter
}

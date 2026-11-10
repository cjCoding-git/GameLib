import { GameLibCore } from "../../Core/index.js"
import { Skybox } from "./Skybox.js"
class Sky {
  constructor() {
    throw new GameLibCore.Error("Class Sky may not be constructed!");
  }
  static Skybox = Skybox;
}
export {
  Sky
}

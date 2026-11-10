import { GameLibCore } from "../../Core/index.js"
import { Skybox } from "./Skybox.js"
import { Cubemap } from "./Cubemap.js"
import { Equirectangular } from "./Equirectangular.js"
import { Gradient } from "./Gradient.js"
class Sky {
  constructor() {
    throw new GameLibCore.Error("Class Sky may not be constructed!");
  }
  static Skybox = Skybox;
  static Cubemap = Cubemap;
  static Equirectangular = Equirectangular;
  static Gradient = Gradient;
}
export {
  Sky
}

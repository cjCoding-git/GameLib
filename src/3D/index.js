import { GameLibCore } from "../Core/index.js"
import { Utils } from "./Utils.js"
import { Object } from "./Object.js"
import { ShaderFactory } from "./ShaderFactory/index.js"
import { GameLib } from "./GameLib.js"
class GameLib3D {
  constructor() {
    throw new GameLibCore.Error("Wrapper class GameLib3D may not be constructed!");
  }
  static Utils = Utils;
  static Object = Object;
  static ShaderFactory = ShaderFactory;
  static GameLib = GameLib;
}
export {
  GameLib3D
}

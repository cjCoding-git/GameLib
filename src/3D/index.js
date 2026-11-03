import { GameLibCore } from "../Core/index.js"
import { Utils } from "./Utils.js"
import { Object } from "./Object.js"
import { ShaderFactory } from "./ShaderFactory/index.js"
import { GameLib } from "./GameLib.js"
import { mat4 } from "./Matrix.js"
import { Transform } from "./Transform.js"
import { Position } from "./Position.js"
import { Rotation } from "./Rotation.js"
import { Scale } from "./Scale.js"
class GameLib3D {
  constructor() {
    throw new GameLibCore.Error("Wrapper class GameLib3D may not be constructed!");
  }
  static Utils = Utils;
  static Object = Object;
  static ShaderFactory = ShaderFactory;
  static GameLib = GameLib;
  static mat4 = mat4;
  static Transform = Transform;
  static Position = Position;
  static Rotation = Rotation;
  static Scale = Scale;
}
export {
  GameLib3D
}

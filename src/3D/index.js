import { GameLibCore } from "../Core/index.js"
import { Utils } from "./Utils.js"
import { Object } from "./Object.js"
import { ShaderFactory } from "./ShaderFactory/index.js"
import { GameLib } from "./GameLib.js"
import { Transform } from "./Transform.js"
import { Position } from "./Position.js"
import { Rotation } from "./Rotation.js"
import { Scale } from "./Scale.js"
import { Camera } from "./Camera.js"
import { Geometry } from "./Geometry/index.js"
import { Ammo } from "../Lib/Ammo.js"
import { Mesh } from "./Mesh.js"
import { Material } from "./Material.js"
import { Texture } from "./Texture.js"
import { TextureFactory } from "./TextureFactory.js"
import { UI } from "./UI/index.js"
class GameLib3D {
  constructor() {
    throw new GameLibCore.Error("Wrapper class GameLib3D may not be constructed!");
  }
  static Utils = Utils;
  static Object = Object;
  static ShaderFactory = ShaderFactory;
  static GameLib = GameLib;
  static Transform = Transform;
  static Position = Position;
  static Rotation = Rotation;
  static Scale = Scale;
  static Geometry = Geometry;
  static Camera = Camera;
  static Ammo = Ammo;
  static Mesh = Mesh;
  static Material = Material;
  static Texture = Texture;
  static TextureFactory = TextureFactory;
  static UI = UI;
}
export {
  GameLib3D
}

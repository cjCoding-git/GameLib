import { GameLibCore } from "../Core/index.js"
import { Utils } from "./Utils.js"
import { Object } from "./Object.js"
import { ShaderFactory } from "./ShaderFactory/index.js"
import { GameLib } from "./GameLib.js"
import { glMatrix, mat2, mat2d, mat3, mat4, quat, quat2, vec2, vec3, vec4 } from "../Lib/GLMatrix.js"
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
class GameLib3D {
  constructor() {
    throw new GameLibCore.Error("Wrapper class GameLib3D may not be constructed!");
  }
  static Utils = Utils;
  static Object = Object;
  static ShaderFactory = ShaderFactory;
  static GameLib = GameLib;
  static glMatrix = glMatrix;
  static mat2 = mat2;
  static mat2d = mat2d;
  static mat3 = mat3;
  static mat4 = mat4;
  static quat = quat;
  static quat2 = quat2;
  static vec2 = vec2;
  static vec3 = vec3;
  static vec4 = vec4;
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
}
export {
  GameLib3D
}

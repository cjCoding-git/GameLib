import { GameLibCore } from "../../Core/index.js"
import { Box } from "./Box.js"
import { Sphere } from "./Sphere.js"
import { Cone } from "./Cone.js"
class Geometry {
  constructor() {
    throw new GameLibCore.Error("Class Geometry may not be constructed!");
  }
  static Box = Box;
  static Sphere = Sphere;
  static Cone = Cone;
}
export {
  Geometry
}

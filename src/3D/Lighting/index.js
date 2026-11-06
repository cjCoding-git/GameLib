import { GameLibCore } from "../../Core/index.js"
import { PointLight } from "./PointLight.js"
import { DirectionalLight } from "./DirectionalLight.js"
import { AmbientLight } from "./AmbientLight.js"
class Lighting {
  constructor() {
    throw new GameLibCore.Error("Class Lighting may not be constructed!");
  }
  static PointLight = PointLight;
  static DirectionalLight = DirectionalLight;
  static AmbientLight = AmbientLight;
}
export {
  Lighting
}

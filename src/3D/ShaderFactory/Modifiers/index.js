import { GameLibCore } from "../../../Core/index.js"
import { Variable } from "./Variable.js"
class Modifiers {
  constructor() {
      throw new GameLibCore.Error("Class GameLib3D.ShaderFactory.Modifiers may not be constructed!");
  }
  static Variable = Variable;
}
export {
  Modifiers
}

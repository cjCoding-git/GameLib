import { GameLibCore } from "../../Core/index.js"
import { UIRenderer } from "./UIRenderer.js"
class UI {
  constructor() {
    throw new GameLibCore.Error("Class UI may not be constructed!");
  }
  static UIRenderer = UIRenderer;
}
export {
  UI
}

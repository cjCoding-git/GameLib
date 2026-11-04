import { GameLibCore } from "../../Core/index.js"
import { UIRenderer } from "./UIRenderer.js"
import { UIObject } from "./UIObject.js"
class UI {
  constructor() {
    throw new GameLibCore.Error("Class UI may not be constructed!");
  }
  static UIRenderer = UIRenderer;
  static UIObject = UIObject;
}
export {
  UI
}

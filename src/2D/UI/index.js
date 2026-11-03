import { UIElement } from "./UIElement.js"
import { GameLibCore } from "../../Core/index.js"
class UI {
  constructor() {
    throw new GameLibCore.Error("Class UI may not be constructed!");
  }
  static UIElement = UIElement;
}
export {
  UI
}

import { GameLibCore } from "../../Core/index.js"
import { UIElement } from "./UIElement.js"
import { Button } from "./Button.js"
import { TextInput } from "./TextInput.js"
class UI {
  constructor() {
    throw new GameLibCore.Error("Class UI may not be constructed!");
  }
  static UIElement = UIElement;
  static Button = Button;
  static TextInput = TextInput;
}
export {
  UI
}

import { GameLibCore } from "../../Core/index.js"
import { UIRenderer } from "./UIRenderer.js"
import { UIObject } from "./UIObject.js"
import { UIPath } from "./UIPath.js"
import { UIImage } from "./UIImage.js"
import { UIText } from "./UIText.js"
class UI {
  constructor() {
    throw new GameLibCore.Error("Class UI may not be constructed!");
  }
  static UIRenderer = UIRenderer;
  static UIObject = UIObject;
  static UIPath = UIPath;
  static UIImage = UIImage;
  static UIText = UIText;
}
export {
  UI
}

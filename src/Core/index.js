import { GameLibError } from "src/Core/Error.js"
import { InputManager } from "src/Core/InputManager.js"
import { AudioManager } from "src/Core/AudioManager.js"
import { Utils } from "src/Core/Utils.js"
class GameLibCore {
  constructor() {
    throw new GameLibError("Class GameLibCore may not be constructed!");
  }
  static Error = GameLibError;
  static Utils = Utils;
  static InputManager = InputManager;
  static AudioManager = AudioManager;
}
export {
  GameLibCore
}

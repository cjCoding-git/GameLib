import { GameLibError } from "./Error.js"
import { InputManager } from "./InputManager.js"
import { AudioManager } from "./AudioManager.js"
import { Utils } from "./Utils.js"
import { GameLibBase } from "./GameLibBase.js"
class GameLibCore {
  constructor() {
    throw new GameLibError("Class GameLibCore may not be constructed!");
  }
  static Error = GameLibError;
  static Utils = Utils;
  static InputManager = InputManager;
  static AudioManager = AudioManager;
  static GameLibBase = GameLibBase;
}
export {
  GameLibCore
}

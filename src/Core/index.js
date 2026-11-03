import { GameLibError } from "./Error.js"
import { InputManager } from "./InputManager.js"
import { AudioManager } from "./AudioManager.js"
import { Utils } from "./Utils.js"
import { GameLibBase } from "./GameLibBase.js"
import { Storage } from "./Storage.js"
import { Store } from "./Store.js"
class GameLibCore {
  constructor() {
    throw new GameLibError("Class GameLibCore may not be constructed!");
  }
  static Error = GameLibError;
  static Utils = Utils;
  static InputManager = InputManager;
  static AudioManager = AudioManager;
  static GameLibBase = GameLibBase;
  static Storage = Storage;
  static Store = Store;
}
export {
  GameLibCore
}

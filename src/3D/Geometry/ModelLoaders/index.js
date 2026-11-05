import { GameLibCore } from "../../../Core/index.js"
import { GMLLoader } from "./GMLLoader.js"
import { GLBLoader } from "./GLBLoader.js"
import { GLTFLoader } from "./GLTFLoader.js"
class ModelLoaders {
  constructor() {
    throw new GameLibCore.Error("Class ModelLoaders may not be constructed!");
  }
  static GMLLoader = GMLLoader;
  static GLBLoader = GLBLoader;
  static GLTFLoader = GLTFLoader;
}
export {
  ModelLoaders
}

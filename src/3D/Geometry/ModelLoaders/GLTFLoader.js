import { GameLibCore } from "../../../Core/index.js"
class GLTFLoader {
  constructor() {
    throw new GameLibCore.Error("Class GLTFLoader may not be constructed!");
  }
  static load(url, options={}) {
    throw new GameLibCore.Error("Loading GLTF files is not yet implemented.");
  }
}
export {
  GLTFLoader
}

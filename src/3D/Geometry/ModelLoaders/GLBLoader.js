import { GameLibCore } from "../../../Core/index.js"
class GLBLoader {
  constructor() {
    throw new GameLibCore.Error("Class GLBLoader may not be constructed!");
  }
  static load(url, options={}) {
    throw new GameLibCore.Error("Loading GLB files is not yet implemented.");
  }
}
export {
  GLBLoader
}

import { GameLibCore } from "../../../Core/index.js"
class OBJLoader {
  constructor() {
    throw new GameLibCore.Error("Class OBJLoader may not be constructed!");
  }
  static load(url, options={}) {
    throw new GameLibCore.Error("Loading OBJ files is not yet implemented.");
  }
}
export {
  OBJLoader
}

import { GameLibCore } from "../../Core.js"
class UIRenderer {
  constructor(gameLib) {
    this._gameLib = gameLib;
    this._uiObjects = [];
  }
  addObject(object) {
    object.id = GameLibCore.Utils.UUID();
    this._uiObjects.push(object);
  }
  getObjects() {
    return this._uiObjects;
  }
  removeObject(id) {
    this._uiObjects = this._uiObjects.filter(object => object.id !== id);
  }
  renderUI(scene) {}
}
export {
  UIRenderer
}

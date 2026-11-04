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
  render(scene) {
    for(var i=0;i<this._uiObjects.length;i++) {
      var object = this._uiObjects[i];
      if(object.scene === scene) {
        this.renderObject(object);
      }
    }
  }
  renderObject(object) {}
}
export {
  UIRenderer
}

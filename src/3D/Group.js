import { Object } from "./Object.js"
import { Transform } from "./Transform.js"
import { GameLibCore } from "../Core/index.js"
class Group {
  constructor(gameLib, scene) {
    this._gameLib = gameLib;
    this.scene = scene;
    this._objects = [];
    this.transform = new Transform();
  }
  addObject(object) {
    if(object instanceof Object || object instanceof Group) {
      if(object.scene !== this.scene) {
        throw new GameLibCore.Error("Object being added to Group must be in same scene as group!");
      } else {
        object.group = this;
        object.id = GameLibCore.Utils.UUID();
        if(object.transform) {
          object.transform.setGroup(this);
        }
        this._objects.push(object);
        return object.id;
      }
    } else {
      throw new GameLibCore.Error("Group.addObject(object) must be passed an Object or Group!");
    }
  }
  getObjects() {
    return this._objects;
  }
  removeObject(id) {
    this._objects = this._objects.filter(object => object.id !== id);
  }
  update(camera) {
    for(var i=0;i<this._objects.length;i++) {
      this._objects[i].update(camera);
    }
  }
  draw(camera) {
    for(var i=0;i<this._objects.length;i++) {
      this._objects[i].draw(camera);
    }
  }
}
export {
  Group
}

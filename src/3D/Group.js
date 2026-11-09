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
        this._objects.push(object);
      }
    } else {
      throw new GameLibCore.Error("Group.addObject(object) must be passed an Object or Group!");
    }
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

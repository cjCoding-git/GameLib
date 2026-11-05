import { Loading } from "../../Core/Loading.js"
import { UIObject } from "./UIObject.js"
class UILoading extends UIObject {
  constructor(gameLib) {
    var x = 0;
    var y = 0;
    var width = gameLib._canvas.width;
    var height = gameLib._canvas.height
    super(gameLib, "loading", x, y, width, height, [1.0, 1.0, 1.0, 1.0]);
    this.isTexturedUI = true;
    this.source = document.createElement('canvas');
    this.source.width = width;
    this.source.height = height;
    this.textureDirty = true;
    this.config = {};
    this.setConfig(this.config);
    this.update();
  }
  setConfig(config) {
    this.config = config;
  }
  update() {
    Loading.render(this.source, this.source.getContext('2d'), this.config);
    this.textureDirty = true;
    if(this.width !== this._gameLib._canvas.width) {
      this.width = this._gameLib._canvas.width;
    }
    if(this.height !== this._gameLib._canvas.height) {
      this.height = this._gameLib._canvas.height;
    }
    if(this.source.width !== this.width) {
      this.source.width = this.width;
    }
    if(this.source.height !== this.height) {
      this.source.height = this.height;
    }
  }
}
export {
  UILoading
}

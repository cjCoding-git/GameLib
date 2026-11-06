class UIObject {
  constructor(gameLib, scene, x, y, width, height, color) {
    this._gameLib = gameLib;
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.visible = true;
  }
  update() {}
}
export {
  UIObject
}

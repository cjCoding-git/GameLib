import { GameLib2D } from "./index.js"
class Sprite extends GameLib2D.Box {
  constructor(pos, size) {
    super(pos, size);
    this.image = null;
    this.fillColor = "#000000";
    this.gameLib = new GameLib2D.GameLib();
    this.gameLib.addSprite(this);
    this.ctx = this.gameLib.ctx;
    this.triggers = [];
  }
  update() {}
  draw() {
    if (this.image != null) {
      this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      this.ctx.fillStyle = this.fillColor;
      this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
  addTrigger(triggerID, callback) {
    this.triggers[triggerID] = callback;
  }
  trigger(triggerID) {
    if (this.triggers[triggerID]) {
      this.triggers[triggerID]();
    }
  }
  checkBounds() {
    if (this.x < 0) {
      this.moveTo(0, this.y);
      this.trigger('bounds');
    }
    if (this.x > this.gameLib.canvas.width - this.width) {
      this.moveTo(this.gameLib.canvas.width - this.width, this.y);
      this.trigger('bounds');
    }
    if (this.y < 0) {
      this.moveTo(this.x, 0);
      this.trigger('bounds');
    }
    if (this.y > this.gameLib.canvas.height - this.height) {
      this.moveTo(this.x, this.gameLib.canvas.height - this.height);
      this.trigger('bounds');
    }
  }
  drawHitbox() {
    this.ctx.strokeStyle = this.fillColor;
    this.ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}
export {
  Sprite
}

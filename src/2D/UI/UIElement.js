import { Renderable } from "../Renderable.js"
class UIElement extends Renderable {
  constructor(scene) {
    super(scene);
    this.makeOverlay();
  }
}
export {
  UIElement
}

import { Object } from "../Object.js"
import { Rotation } from "../Rotation.js"
class PointLight extends Object {
  constructor(gameLib, scene, position, { color = [1.0, 1.0, 1.0], intensity = 1, direction = new Rotation(0, -1, 0), range = 10 }) {
    super(gameLib, scene);
    this.isLight = true;
    this.type = "point";
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    this.direction = direction;
    this.range = range;
  }
}
export {
  PointLight
}

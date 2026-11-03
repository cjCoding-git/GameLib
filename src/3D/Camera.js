import { Transform } from "./Transform.js"
import { Rotation } from "./Rotation.js"
class Camera {
  constructor(fovDegrees=45, near=0.1, far=100.0) {
    this.transform = new Transform([0, 0, 0]);
    this.fov = Rotation.d2r(fovDegrees);
    this.near = near;
    this.far = far;
  }
}
export {
  Camera
}

import { Transform } from "./Transform.js"
import { Rotation } from "./Rotation.js"
import { mat4 } from "./Matrix.js"
class Camera {
  constructor(fovDegrees=45, near=0.1, far=100.0) {
    this.transform = new Transform([0, 0, 0]);
    this.fov = Rotation.d2r(fovDegrees);
    this.near = near;
    this.far = far;
  }
  getProjectionMatrix(aspectRatio) {
    var proj = mat4.create();
    mat4.perspective(proj, this.fov, aspectRatio, this.near, this.far);
    return proj;
  }
  getViewMatrix() {
    var view = this.transform.getModelMatrix();
    mat4.invert(view, view);
    return view;
  }
}
export {
  Camera
}

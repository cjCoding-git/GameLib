import { Position } from "./Position.js"
import { Rotation } from "./Rotation.js"
import { Scale } from "./Scale.js"
import { mat4 } from "./Matrix.js"
class Transform {
  constructor(position=new Position(), rotation=new Rotation(), scale=new Scale()) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }
  translate(x, y, z) {
    this.position.translate(x, y, z);
  }
  rotate(x, y, z) {
    this.rotation.rotate(x, y, z);
  }
  getModelMatrix() {
    var matrix = mat4.create();
    mat4.translate(matrix, matrix, this.position);
    mat4.rotateX(matrix, matrix, this.rotation.x);
    mat4.rotateY(matrix, matrix, this.rotation.y);
    mat4.rotateZ(matrix, matrix, this.rotation.z);
    mat4.scale(matrix, matrix, this.scale);
    return matrix;
  }
  getNormalMatrix(modelViewMatrix) {
    var normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    return normalMatrix;
  }
}
export {
  Transform
}

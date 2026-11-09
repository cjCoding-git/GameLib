import { Position } from "./Position.js"
import { Rotation } from "./Rotation.js"
import { Scale } from "./Scale.js"
import { mat4 } from "../Core/Matrix/mat4.js"
class Transform {
  constructor(position=new Position(), rotation=new Rotation(), scale=new Scale()) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.group = null;
  }
  setGroup(group) {
    this.group = group;
  }
  getGroupTransform() {
    if(!this.group) return null;
    return this.group.transform;
  }
  translate(x, y, z) {
    this.position.translate(x, y, z);
  }
  rotate(x, y, z) {
    this.rotation.rotate(x, y, z);
  }
  _calculateTransform() {
    if(!this.group || !this.getGroupTransform()) return this;
    var groupTransform = this.getGroupTransform();
    return {
      position: {
        x: this.position.x + groupTransform.position.x,
        y: this.position.y + groupTransform.position.y,
        z: this.position.z + groupTransform.position.z
      },
      rotation: {
        x: this.rotation.x + groupTransform.rotation.x,
        y: this.rotation.y + groupTransform.rotation.y,
        z: this.rotation.z + groupTransform.rotation.z
      },
      scale: {
        x: this.scale.x + groupTransform.scale.x,
        y: this.scale.y + groupTransform.scale.y,
        z: this.scale.z + groupTransform.scale.z
      }
    };
  }
  getModelMatrix() {
    var calcTransform = this._calculateTransform();
    var matrix = mat4.create();
    mat4.translate(matrix, matrix, [calcTransform.position.x, calcTransform.position.y, calcTransform.position.z]);
    mat4.rotateX(matrix, matrix, calcTransform.rotation.x);
    mat4.rotateY(matrix, matrix, calcTranform.rotation.y);
    mat4.rotateZ(matrix, matrix, calcTransform.rotation.z);
    mat4.scale(matrix, matrix, [calcTransform.scale.x, calcTransform.scale.y, calcTransform.scale.x]);
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

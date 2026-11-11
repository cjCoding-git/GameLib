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
  clone() {
    var newPosition = new Position(this.position.x, this.position.y, this.position.z);
    var newRotation = new Rotation(this.rotation.x, this.rotation.y, this.rotation.z);
    var newScale = new Scale(this.scale.x, this.scale.y, this.scale.z);
    var newTransform = new Transform(newPosition, newRotation, newScale);
    return newTransform;
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
  getModelMatrix() {
    var matrix = mat4.create();
    mat4.translate(matrix, matrix, [this.position.x, this.position.y, this.position.z]);
    mat4.rotateX(matrix, matrix, this.rotation.x);
    mat4.rotateY(matrix, matrix, this.rotation.y);
    mat4.rotateZ(matrix, matrix, this.rotation.z);
    mat4.scale(matrix, matrix, [this.scale.x, this.scale.y, this.scale.x]);
    var groupTransform = this.getGroupTransform();
    if(groupTransform) {
      var groupMatrix = groupTransform.getModelMatrix();
      var combinedMatrix = mat4.create();
      mat4.multiply(combinedMatrix, groupMatrix, matrix);
      return combinedMatrix;
    }
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

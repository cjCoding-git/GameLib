import { mat4 } from "./mat4.js"
import { GameLibError } from "../Error.js"
class Matrix {
  constructor() {
    throw new GameLibError("Class Matrix may not be constructed!");
  }
  static mat4 = mat4;
}
export {
  Matrix
}

import { GameLibError } from "../Error.js"
class mat4 {
  constructor() {
    throw new GameLibError("Class mat4 may not be constructed!");
  }
  static EPSILON = 1e-6;
  create() {
    return new Float32Array(16);
  }
  identity(out=create()) {
    out[0]  = 1; out[1]  = 0; out[2]  = 0; out[3]  = 0;
    out[4]  = 0; out[5]  = 1; out[6]  = 0; out[7]  = 0;
    out[8]  = 0; out[9]  = 0; out[10] = 1; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }
  multiply(out, a, b) {}
  translate(out, a, v) {}
  rotateX(out, a, rad) {}
  rotateY(out, a, rad) {}
  rotateZ(out, a, rad) {}
  scale(out, a, v) {}
  transpose(out, a) {}
  invert(out, a) {}
  perspective(out, fovy, aspect, near, far) {}
}
export {
  mat4
}

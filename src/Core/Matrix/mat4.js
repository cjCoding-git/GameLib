import { GameLibError } from "../Error.js"
function getItem(matrix, row, col) {
  var rowOffset = row * 4;
  var colOffset = col;
  var offset  = rowOffset + colOffset;
  return matrix[offset];
}
function makeGet(matrix) {
  return getItem.bind(this, matrix);
}
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
  multiply(out, a, b) {
    var getA = makeGet(a);
    var getB = makeGet(b);
    var m = (offset, a0, b0) => {
      return getA(offset, a0) * getB(b0, offset);
    };
    out[0] = m(0, 0, 0) + m(1, 0, 0) + m(2, 0, 0) + m(3, 0, 0);
    out[1] = m(0, 1, 0) + m(1, 1, 0) + m(2, 1, 0) + m(3, 1, 0);
    out[2] = m(0, 2, 0) + m(1, 2, 0) + m(2, 2, 0) + m(3, 2, 0);
  }
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

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
  multiply(out, a, b) {
    var aCopy = new Float32Array(16);
    var bCopy = new Float32Array(16);
    for(var i=0;i<a.length;i++) {
      aCopy[i] = a[i];
    }
    for(var i=0;i<b.length;i++) {
      bCopy[i] = b[i];
    }
    var size = 4;
    for(var row=0;row<size;row++) {
      for(var col=0;col<size;col++) {
        var sum = 0;
        for(var offset=0;offset<size;offset++) {
          sum += aCopy[row * 4 + offset] * bCopy[offset * 4 + col];
        }
        out[row * 4 + col] = sum;
      }
    }
    return out;
  }
  translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    var a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
    var a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
    var a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    if(a !== out) {
      out[0]  = a00; out[1]  = a01; out[2]  = a02; out[3]  = a03;
      out[4]  = a10; out[5]  = a11; out[6]  = a12; out[7]  = a13;
      out[8]  = a20; out[9]  = a21; out[10] = a22; out[11] = a23;
      out[12] = a30; out[13] = a31; out[14] = a32; out[15] = a33;
    }
    out[12] = a00 * x + a10 * y + a20 * z + a30;
    out[13] = a01 * x + a11 * y + a21 * z + a31;
    out[14] = a02 * x + a12 * y + a22 * z + a32;
    out[15] = a03 * x + a13 * y + a23 * z + a33;
    return out;
  }
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

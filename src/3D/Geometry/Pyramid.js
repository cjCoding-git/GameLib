class Pyramid {
  constructor(width=1, height=1, depth=1) {
    var w = width / 2;
    var h = height / 2;
    var d = depth / 2;
    var positions = [
      -w, -h,  d,   w, -h,  d,   0,  h,  0,
       w, -h,  d,   w, -h, -d,   0,  h,  0,
       w, -h, -d,  -w, -h, -d,   0,  h,  0,
      -w, -h, -d,  -w, -h,  d,   0,  h,  0,
      -w, -h,  d,  -w, -h, -d,   w, -h, -d,   w, -h,  d
    ];
    var frontLen = Math.sqrt(d * d + height * height);
    var sideLen = Math.sqrt(w * w + height * height);
    var normals = [
       0, d / frontLen, height / frontLen,  0, d / frontLen, height / frontLen,  0, d / frontLen, height / frontLen,
      height / sideLen, w / sideLen, 0,  height / sideLen, w / sideLen, 0,  height / sideLen, w / sideLen, 0,
       0, d / frontLen, -height / frontLen,  0, d / frontLen, -height / frontLen,  0, d / frontLen, -height / frontLen,
      -height / sideLen, w / sideLen, 0,  -height / sideLen, w / sideLen, 0,  -height / sideLen, w / sideLen, 0,
       0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0
    ];
    var uv = [
      0, 0,  1, 0,  0.5, 1,
      0, 0,  1, 0,  0.5, 1,
      0, 0,  1, 0,  0.5, 1,
      0, 0,  1, 0,  0.5, 1,
      0, 0,  0, 1,  1, 1,  1, 0
    ];
    var indices = [];
    for(var i=0;i<4;i++) {
      var offset = i * 3;
      indices.push(offset, offset + 1, offset + 2);
    }
    indices.push(12, 13, 14, 12, 14, 15);
    this.positions = positions;
    this.normals = normals;
    this.uv = uv;
    this.indices = indices;
  }
}
export {
  Pyramid
}

class Box {
  constructor(width=1, height=1, depth=1) {
    var w = width / 2;
    var h = height / 2;
    var d = depth / 2;
    var positions = [
      -w, -h,  d,   w, -h,  d,   w,  h,  d,  -w,  h,  d,
      -w, -h, -d,  -w,  h, -d,   w,  h, -d,   w, -h, -d,
      -w,  h, -d,  -w,  h,  d,   w,  h,  d,   w,  h, -d,
      -w, -h, -d,   w, -h, -d,   w, -h,  d,  -w, -h,  d,
       w, -h, -d,   w,  h, -d,   w,  h,  d,   w, -h,  d,
      -w, -h, -d,  -w, -h,  d,  -w,  h,  d,  -w,  h, -d
    ];
    var normals = [
       0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
       0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1,
       0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
       0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
       1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
    ];
    var uv = [];
    for(var i=0;i<6;i++) {
      uv.push(0, 0,  1, 0,  1, 1,  0, 1);
    }
    var indices = [];
    for(var i=0;i<6;i++) {
      var offset = i * 4;
      indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    }
    this.positions = positions;
    this.normals = normals;
    this.uv = uv;
    this.indices = indices;
  }
}
export {
  Box
}

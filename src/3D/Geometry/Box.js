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
  }
}

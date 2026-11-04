class Pyramid {
  constructor(width = 1, height = 1, depth = 1, sides = 4) {
    // A pyramid needs at least three base vertices. Round fractional values
    // down so the geometry always has a whole number of sides.
    sides = Math.max(3, Math.floor(sides));

    var positions = [];
    var normals = [];
    var uv = [];
    var indices = [];
    var halfW = width / 2;
    var halfH = height / 2;
    var halfD = depth / 2;

    // Build each triangular side with its own vertices for a flat face normal.
    for (var i = 0; i < sides; i++) {
      var angle0 = (i * 2 * Math.PI) / sides;
      var angle1 = ((i + 1) * 2 * Math.PI) / sides;
      var x0 = halfW * Math.cos(angle0);
      var z0 = halfD * Math.sin(angle0);
      var x1 = halfW * Math.cos(angle1);
      var z1 = halfD * Math.sin(angle1);
      var centerX = (x0 + x1) / 2;
      var centerZ = (z0 + z1) / 2;
      var normalLength = Math.hypot(height * centerX, halfH * (z0 - z1));
      var nx = (height * centerX) / normalLength;
      var ny = (halfH * (z0 - z1)) / normalLength;
      var nz = (halfH * (x1 - x0)) / normalLength;
      var offset = positions.length / 3;

      positions.push(x0, -halfH, z0, x1, -halfH, z1, 0, halfH, 0);
      for (var vertex = 0; vertex < 3; vertex++) {
        normals.push(nx, ny, nz);
      }
      uv.push(0, 0, 1, 0, 0.5, 1);
      indices.push(offset, offset + 1, offset + 2);
    }

    // Triangulate the polygon base as a fan, with independent downward normals.
    var baseCenter = positions.length / 3;
    positions.push(0, -halfH, 0);
    normals.push(0, -1, 0);
    uv.push(0.5, 0.5);

    var baseStart = positions.length / 3;
    for (var j = 0; j < sides; j++) {
      var baseAngle = (j * 2 * Math.PI) / sides;
      positions.push(halfW * Math.cos(baseAngle), -halfH, halfD * Math.sin(baseAngle));
      normals.push(0, -1, 0);
      uv.push(0.5 + 0.5 * Math.cos(baseAngle), 0.5 + 0.5 * Math.sin(baseAngle));
    }

    for (var k = 0; k < sides; k++) {
      indices.push(baseCenter, baseStart + (k + 1) % sides, baseStart + k);
    }

    this.positions = positions;
    this.normals = normals;
    this.uv = uv;
    this.indices = indices;
  }
}

export {
  Pyramid
}

class Sphere {
  constructor(radius = 1, latBands = 24, longBands = 24) {
    var positions = [];
    var normals = [];
    var uv = [];
    var indices = [];

    // Include both ends of each range so every grid cell has matching vertices.
    for (var lat = 0; lat <= latBands; lat++) {
      var theta = (lat * Math.PI) / latBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var lon = 0; lon <= longBands; lon++) {
        var phi = (lon * 2 * Math.PI) / longBands;
        var x = Math.cos(phi) * sinTheta;
        var y = cosTheta;
        var z = Math.sin(phi) * sinTheta;

        normals.push(x, y, z);
        uv.push(1 - (lon / longBands), 1 - (lat / latBands));
        positions.push(radius * x, radius * y, radius * z);
      }
    }

    for (var lat = 0; lat < latBands; lat++) {
      for (var lon = 0; lon < longBands; lon++) {
        var first = (lat * (longBands + 1)) + lon;
        var second = first + longBands + 1;

        // Order triangles outward to match the vertex normals.
        indices.push(first, first + 1, second);
        indices.push(second, first + 1, second + 1);
      }
    }

    this.positions = positions;
    this.normals = normals;
    this.uv = uv;
    this.indices = indices;
  }
}

export {
  Sphere
};

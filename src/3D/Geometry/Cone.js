class Cone {
  constructor(radius=1, height=2, segments=24) {
    var positions = [];
    var normals = [];
    var uv = [];
    var indices = [];
    var halfH = height / 2;
    positions.push(0, halfH, 0);
    normals.push(0, 1, 0);
    uv.push(0.5, 1.0);
    for(var i=0;i<=segments;i++) {
      var angle = (i * 2 * Math.PI) / segments;
      var x = Math.sin(angle);
      var z = Math.cos(angle);
      positions.push(radius * x, -halfH, radius * z);
      var slantLen = Math.sqrt(radius * radius + height * height);
      normals.push((height / slantLen) * x, radius / slantLen, (height / slantLen) * z);
      uv.push(i / segments, 0.0);
    }
    for(var i=0;i<=segments;i++) {
      indices.push(0, i, i + 1);
    }
    var baseCenterIdx = positions.length / 3;
    positions.push(0, -halfH, 0);
    normals.push(0, -1, 0);
    uv.push(0.5, 0.5);
    var baseStartIdx = positions.length / 3;
    for(var i=0;i<=segments;i++) {
      var angle = (i * 2 * Math.PI) / segments;
      positions.push(radius * Math.cos(angle), -halfH, radius * Math.sin(angle));
      normals.push(0, -1, 0);
      uv.push(0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle));
    }
    for(var i=0;i<segments;i++) {
      indices.push(baseCenterIdx, baseStartIdx + i + 1, baseStartIdx + i);
    }
    this.positions = positions;
    this.normals = normals;
    this.uv = uv;
    this.indices = indices;
  }
}
export {
  Cone
}

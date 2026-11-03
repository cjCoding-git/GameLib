import { Object } from "./Object.js"
import { Transform } from "./Transform.js"
class Mesh extends Object {
  constructor(gameLib, geometryData, color=[1.0, 1.0, 1.0, 1.0]) {
    super(gameLib);
    this.transform = new Transform();
    this.color = color;
    this.geometry = geometryData;
    this.buffers = {};
  }
  setup() {
    var webgl = this._gl.webgl;
    this.buffers.position = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, this.buffers.position);
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(this.geometry.positions), webgl.STATIC_DRAW);
  }
}
export {
  Mesh
}

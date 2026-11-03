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
    var webgl = this.gl.webgl;
    this.buffers.position = webgl.createBuffer();
    webgl.bindBuffer(
  }
}
export {
  Mesh
}

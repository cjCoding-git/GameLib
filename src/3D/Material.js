class Material {
  constructor(shader) {
    this.program = shader;
    this.hasColor = false;
    this.color = null;
  }
  setColor(color) {
    this.color = color;
  }
}
export {
  Material
}

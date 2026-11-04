class Material {
  constructor(gameLib, shader) {
    this._gameLib = gameLib;
    this.program = shader;
    if(!this.program) {
      if(this._gameLib && this._gameLib.options && !this._gameLib.options.webGL2) {
        var vShader = this._gameLib.compileShader(Material.DEFAULT_VERTEX_SHADER_WEBGL_2);
        var fShader = this._gameLib.compileShader(Material.DEFAULT_FRAGMENT_SHADER_WEBGL_2);
        this.program = this._gameLib.createProgram(vShader, fShader);
      } else {
        var vShader = this._gameLib.compileShader(Material.DEFAULT_VERTEX_SHADER_WEBGL_1);
        var fShader = this._gameLib.compileShader(Material.DEFAULT_FRAGMENT_SHADER_WEBGL_1);
        this.program = this._gameLib.compileProgram(vShader, fShader);
      }
    }
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

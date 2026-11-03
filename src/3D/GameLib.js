import { GameLibCore } from "../Core/index.js"
import { GameLib3D } from "./index.js"
class GameLib extends GameLibCore.GameLibBase {
  constructor(renderCanvas, renderCtx, options) {
    super();
    if (GameLib3D.GameLib._instance != null) {
      delete this;
      return GameLib3D.GameLib._instance;
    } else {
      console.log("[GameLib] No GameLib3D instance found. Creating new instance.");
      this._canvas = renderCanvas;
      this._gl = renderCtx;
      this._objects = [];
      this._options = options;
      this._clearColor = [ 0.0, 0.0, 0.0, 1.0 ];
      this._camera = null;
      this._program = null;
      this.registerMainloop();
      GameLib3D.GameLib._instance = this;
    }
  }
  static getContext(canvas, webgl2=true) {
    if(webgl2) {
      return canvas.getContext('webgl2');
    } else {
      return canvas.getContext('webgl');
    }
  }
  get webgl() {
    return this._gl;
  }
  setClearColor(color) {
    this._clearColor = color;
  }
  compileShader(type, source) {
    var shader = this._gl.createShader(type);
    this._gl.shaderSource(shader, source);
    this._gl.compileShader(shader);
    if(!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
      console.warn("[GameLib] Shader compilation failed:", this._gl.getShaderInfoLog(shader));
      this._gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  createProgram(...shaders) {
    var program = this._gl.createProgram();
    for(var i=0;i<shaders.length;i++) {
      this._gl.attachShader(program, shaders[i]);
    }
    this._gl.linkProgram(program);
    if(!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
      console.warn("[GameLib] Program linking failed:", this._gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }
  useProgram(program) {
    this._program = program;
    this._gl.useProgram(program);
  }
  setCamera(camera) {
    this._camera = camera;
  }
  getAttributeLocation(program, name, forceMode=null) {
    var location;
    if((!forceMode && name.startsWith('a')) || forceMode == 'attribute') {
      location = this._gl.getAttribLocation(program, name);
    }
    if((!forceMode && name.startsWith('u')) || forceMode == 'uniform') {
      location = this._gl.getUniformLocation(program, name);
    }
    return location;
  }
  setProgramAttribute(program, name, buffer, num, type, normalize=false, stride=0, offset=0, forceMode=null) {
    if(!type) type = this._gl.FLOAT;
    var location = this.getAttributeLocation(program, name, forceMode);
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);
    this._gl.vertexAttribPointer(location, num, type, normalize, stride, offset);
    this._gl.enableVertexAttribArray(location);
  }
  addObject(object) {
    if(object instanceof GameLib3D.Object) {
      object.setup();
      this._objects.push(object);
    } else {
      throw new GameLibCore.Error("GameLib3D.GameLib.addObject(object) must be passed an instance of GameLib3D.Object!");
    }
  }
  update() {
    if(!this._active) return;
    this.callHook('pre-update');
    for(var i=0;i<this._objects.length;i++) {
      this._objects[i].update();
    }
    this.callHook('post-update');
  }
  clearCanvas() {
    this._gl.clearColor(...this._clearColor);
    this._gl.clearDepth(1.0);
    this._gl.enable(this._gl.DEPTH_TEST);
    this._gl.depthFunc(this._gl.LEQUAL);
    this._gl.enable(this._gl.BLEND);
    this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
  }
  draw() {
    if(!this._rendering) return;
    this.clearCanvas();
    this.callHook('pre-render');
    for(var i=0;i<this._objects.length;i++) {
      this._objects[i].draw(this._camera, this._program);
    }
    this.callHook('post-render');
  }
  mainloop() {
    this.update();
    this.draw();
    this.registerMainloop();
  }
  registerMainloop() {
    window.requestAnimationFrame(this.mainloop.bind(this));
  }
}
export {
  GameLib
}

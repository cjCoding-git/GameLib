import { GameLibCore } from "../Core/index.js"
import { GameLib3D } from "./index.js"
import { Object } from "./Object.js"
import { UIRenderer } from "./UI/UIRenderer.js"
import { UILoading } from "./UI/UILoading.js"
import { Group } from "./Group.js"
class GameLib extends GameLibCore.GameLibBase {
  constructor(renderCanvas, renderCtx, options) {
    super();
    if (GameLib3D.GameLib._instance != null) {
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
      this._uiRenderer = new UIRenderer(this);
      this._scene = "loading";
      this._loadingConfig = {};
      this._uiLoading = new UILoading(this);
      this._uiLoading.setConfig(this._loadingConfig);
      this._uiRenderer.addObject(this._uiLoading);
      this._listeners = {};
      this._skybox = null;
      this._lastTimestamp = GameLibCore.Utils.getPreciseTimestamp();
      this.fps = 0;
      this.registerMainloop();
      this._gl.clearColor(...this._clearColor);
      GameLib3D.GameLib._instance = this;
    }
  }
  updateFPS() {
    var currentTime = GameLibCore.Utils.getPreciseTimestamp();
    var deltaTime = currentTime - this._lastTimestamp;
    this.fps = 1000 / deltaTime;
    this._lastTimeStamp = currentTime;
  }
  normalizeSpeed(speed, expectedFramerate=60) {
    var framerateMultiplier = this.fps / expectedFramerate;
    return speed * framerateMultiplier;
  }
  setSkybox(skybox) {
    this._skybox = skybox;
  }
  getSkybox() {
    return this._skybox;
  }
  setLoadingConfig(config) {
    this._loadingConfig = config;
    this._uiLoading.setConfig(config);
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
  get options() {
    return this._options;
  }
  setClearColor(color) {
    this._clearColor = color;
  }
  getClearColor() {
    return this._clearColor;
  }
  getOpaqueClearColor() {
    var clearColor = this._clearColor;
    return [clearColor[0], clearColor[1], clearColor[2]];
  }
  compileShader(type, source) {
    if(typeof type == "string") {
      if(type == "vertex") {
        type = this._gl.VERTEX_SHADER;
      }
      if(type == "fragment") {
        type = this._gl.FRAGMENT_SHADER;
      }
    }
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
    if (location === null || location === -1) {
      return;
    }
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);
    this._gl.vertexAttribPointer(location, num, type, normalize, stride, offset);
    this._gl.enableVertexAttribArray(location);
  }
  addObject(object) {
    if(object instanceof Object || object instanceof Group) {
      object.id = GameLibCore.Utils.UUID();
      object.setup();
      this._objects.push(object);
      return object.id;
    } else {
      throw new GameLibCore.Error("GameLib3D.GameLib.addObject(object) must be passed an instance of Object!");
    }
  }
  getObjects() {
    return this._objects;
  }
  removeObject(id) {
    this._objects = this._objects.filter(object => object.id !== id);
  }
  update() {
    if(!this._active) return;
    this.callHook('pre-update');
    for(var i=0;i<this._objects.length;i++) {
      this._objects[i].update(this._camera);
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
      if(this._objects[i].scene === this._scene) {
        this._objects[i].draw(this._camera);
      }
    }
    if(this._skybox !== null) {
      var aspectRatio = this._canvas.width / this._canvas.height;
      this._skybox.render(this._camera.getProjectionMatrix(aspectRatio), this._camera.getViewMatrix());
    }
    this._uiRenderer.render(this._scene);
    this.callHook('post-render');
  }
  addUIObject(object) {
    return this._uiRenderer.addObject(object);
  }
  getUIObjects() {
    return this._uiRenderer.getObjects();
  }
  removeUIObject(id) {
    this._uiRenderer.removeObject(id);
  }
  mainloop() {
    this.update();
    this.draw();
    this.registerMainloop();
  }
  registerMainloop() {
    window.requestAnimationFrame(this.mainloop.bind(this));
  }
  stopLoading() {
    this._scene = "init";
  }
  setScene(scene) {
    this._scene = scene;
  }
  listen(type, callback) {
    if(!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(callback);
  }
  _fire(type) {
    if(!this._listeners[type]) return;
    for(var i=0;i<this._listeners[type].length;i++) {
      var listener = this._listeners[type][i];
      if(listener && typeof listener === "function") {
        listener();
      }
    }
  }
  resizeToWindow() {
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
    this._canvas.style.position = "fixed";
    this._canvas.style.top = "0";
    this._canvas.style.left = "0";
    this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
    this._fire('resize');
  }
  fillWindow() {
    window.addEventListener('resize', this.resizeToWindow.bind(this), false);
    this.resizeToWindow();
  }
  getLights(scene) {
    if(!scene) scene = this._scene;
    return this._objects.filter(object => object.isLight && object.scene === scene);
  }
}
export {
  GameLib
}

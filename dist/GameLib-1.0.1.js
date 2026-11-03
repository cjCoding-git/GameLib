(() => {
  // src/Core/Error.js
  var GameLibError = class extends Error {
    constructor(message, options) {
      super(message);
      this.name = "GameLibError";
    }
  };

  // src/Core/InputManager.js
  var InputManager = class {
    constructor() {
      if (GameLibCore2.InputManager._instance) {
        return GameLibCore2.InputManager._instance;
      } else {
        console.log("[GameLib] No InputManager instance found. Creating new instance...");
        this._keys = [];
        this._active = false;
        this.bindEvents();
        GameLibCore2.InputManager._instance = this;
      }
    }
    static KEYS = {
      "UP": 38,
      "DOWN": 40,
      "LEFT": 37,
      "RIGHT": 39,
      "A": 65,
      "D": 68,
      "S": 83,
      "W": 87
    };
    get keys() {
      return this._keys;
    }
    setActive(active) {
      this._active = active;
    }
    clearKeys() {
      this._keys = [];
    }
    keyUp(evt) {
      if (!this._active) {
        return;
      }
      this._keys = this._keys.filter((key2) => key2 != evt.keyCode);
    }
    keyDown(evt) {
      if (!this._active) {
        return;
      }
      if (this._keys.indexOf(evt.keyCode) == -1) {
        this._keys.push(evt.keyCode);
      }
    }
    isKeyDown(key2) {
      return this._keys.indexOf(key2) != -1;
    }
    static isKeyDown(key2) {
      if (GameLibCore2.InputManager._instance != null) {
        return GameLibCore2.InputManager._instance._keys.indexOf(key2) != -1;
      } else {
        throw new GameLibCore2.Error("An InputManager instance must exist to use GameLibCore.InputManager.isKeyDown(key)!");
      }
    }
    bindEvents() {
      window.addEventListener("keyup", this.keyUp.bind(this), false);
      window.addEventListener("keydown", this.keyDown.bind(this), false);
    }
  };

  // src/Core/AudioManager.js
  var AudioManager = class {
    constructor() {
      if (GameLibCore2.AudioManager._instance) {
        return GameLibCore2.AudioManager._instance;
      } else {
        console.log("[GameLib] No AudioManager instance found. Creating new instance...");
        this._musicPool = [];
        this._currentMusic = null;
        this._musicPaused = true;
        this.bindEvents();
        GameLibCore2.AudioManager._instance = this;
      }
    }
    bindEvents() {
      window.addEventListener("click", this.resumeMusic.bind(this), false);
      document.addEventListener("visibilitychange", this.visibilityChange.bind(this), false);
    }
    visibilityChange() {
      if (document.visibilityState != "visible") {
        if (this._currentMusic != null) {
          this._currentMusic.pause();
        }
      } else {
        this.resumeMusic();
      }
    }
    resumeMusic() {
      if (!this._musicPaused) {
        this._currentMusic.play();
      }
    }
    addSong(url) {
      var audio = new Audio();
      audio.onended = this.nextSong.bind(this);
      audio.src = url;
      audio.pause();
      this._musicPool.push(audio);
    }
    nextSong() {
      if (this._musicPool.length <= 0) {
        throw new GameLibCore2.Error("Music Pool is empty!");
        return;
      }
      if (this._currentMusic != null) {
        this._currentMusic.pause();
      }
      this._currentMusic = GameLibCore2.Utils.getRandomListItem(this._musicPool);
      this._currentMusic.currentTime = 0;
      this._currentMusic.play();
    }
    playMusic() {
      this._musicPaused = false;
      if (this._currentMusic == null) {
        this.nextSong();
      } else {
        this._currentMusic.play();
      }
    }
    pauseMusic() {
      this._musicPaused = true;
      if (this._currentMusic != null) {
        this._currentMusic.pause();
      }
    }
  };

  // src/Core/Utils.js
  var Utils = class {
    constructor() {
      throw new GameLibCore2.Error("Class Utils may not be constructed!");
    }
    static imagePromise(url) {
      return new Promise(function(resolve, reject) {
        var image = new Image();
        image.onload = (function() {
          resolve(image);
        });
        image.src = url;
      });
    }
    static getRandomListItem(list) {
      var index = Math.floor(Math.random() * list.length);
      return list[index];
    }
  };

  // src/Core/GameLibBase.js
  var GameLibBase = class {
    constructor() {
      this._active = false;
      this._rendering = false;
    }
    setActive(active) {
      this._active = active;
    }
    setRendering(rendering) {
      this._rendering = rendering;
    }
    addHook(event, hook) {
      if (!this._hooks[event]) {
        this._hooks[event] = [];
      }
      this._hooks[event].push(hook);
    }
    callHook(type) {
      if (!this._hooks[type]) return;
      var hooks = this._hooks[type];
      for (var i2 = 0; i2 < hooks; i2++) {
        hooks[i2]();
      }
    }
  };

  // src/Core/index.js
  var GameLibCore2 = class {
    constructor() {
      throw new GameLibError("Class GameLibCore may not be constructed!");
    }
    static Error = GameLibError;
    static Utils = Utils;
    static InputManager = InputManager;
    static AudioManager = AudioManager;
    static GameLibBase = GameLibBase;
  };

  // src/2D/Coord.js
  var Coord = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    move(dx, dy) {
      this.x += dx;
      this.y += dy;
    }
    moveTo(x, y) {
      this.x = x;
      this.y = y;
    }
  };

  // src/2D/Size.js
  var Size = class {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    mod(dw, dh) {
      this.width += dw;
      this.height += dh;
    }
    modTo(w, h) {
      this.width = w;
      this.height = h;
    }
  };

  // src/2D/Box.js
  var Box = class {
    constructor(coord, size) {
      this.coord = coord;
      this.size = size;
    }
    move(dx, dy) {
      this.coord.move(dx, dy);
    }
    moveTo(x, y) {
      this.coord.moveTo(x, y);
    }
    resize(dw, dh) {
      this.size.mod(dw, dh);
    }
    resizeTo(w, h) {
      this.size.modTo(w, h);
    }
    get x() {
      return this.coord.x;
    }
    get y() {
      return this.coord.y;
    }
    get width() {
      return this.size.width;
    }
    get height() {
      return this.size.height;
    }
    checkCollision(otherBox) {
      var checkCollisionInternal = (function(x1, y1, w1, h1, x2, y2, w2, h2) {
        var overlapX = x1 < x2 + w2 && x1 + w1 > x2;
        var overlapY = y1 < y2 + h2 && y1 + h1 > y2;
        var collision = overlapX && overlapY;
        return collision;
      });
      return checkCollisionInternal(this.coord.x, this.coord.y, this.size.width, this.size.height, otherBox.x, otherBox.y, otherBox.width, otherBox.height);
    }
  };

  // src/2D/Rotation.js
  var Rotation = class {
    constructor(deg) {
      this._deg = deg;
      this.rotateTo(this._deg);
    }
    static d2r(deg) {
      return deg * Math.PI / 180;
    }
    static r2d(rad) {
      return rad * (180 / Math.PI);
    }
    rotate(deg) {
      this.rotateTo(this._deg + deg);
    }
    rotateTo(deg) {
      this._deg = deg;
      if (this._deg >= 360) {
        this.rotateTo(this._deg - 360);
      }
      if (this._deg < 0) {
        this.rotateTo(this._deg + 360);
      }
    }
    valueOf() {
      return this._deg;
    }
    get degrees() {
      return this._deg;
    }
    get radians() {
      return GameLib2D.Rotation.d2r(this._deg);
    }
    getVelocityMod() {
      var rad = GameLib2D.Rotation.d2r(this._deg);
      var vx = Math.sin(rad);
      var vy = -Math.cos(rad);
      return [vx, vy];
    }
  };

  // src/2D/Renderable.js
  var Renderable = class {
    constructor() {
      this.gameLib = new GameLib2D.GameLib();
      this.gameLib.addRenderable(this);
      this._active = true;
      this._canvas = this.gameLib.canvas;
      this._ctx = this.gameLib.ctx;
      this.overlay = false;
    }
    shouldRender() {
      return true;
    }
    isActive() {
      return this._active;
    }
    setActive(active) {
      this._active = active;
    }
    draw() {
    }
  };

  // src/2D/GameLib.js
  var GameLib = class extends GameLibCore2.GameLibBase {
    constructor(renderCanvas, renderCtx, viewportCanvas, viewportCtx) {
      if (GameLib2D2.GameLib._instance != null) {
        delete this;
        return GameLib2D2.GameLib._instance;
      } else {
        console.log("[GameLib] No GameLib2D instance found. Creating new instance.");
        this._sprites = [];
        this.clearColor = "#dddddd";
        this._renderCanvas = renderCanvas;
        this._renderCtx = renderCtx;
        this._viewportCanvas = viewportCanvas;
        this._viewportCtx = viewportCtx;
        this._viewport = new GameLib2D2.Box(new GameLib2D2.Coord(0, 0), new GameLib2D2.Size(this._viewportCanvas.width, this._viewportCanvas.height));
        this._renderables = [];
        this._background = null;
        GameLib2D2.GameLib._instance = this;
      }
    }
    static getContext(canvas) {
      return canvas.getContext("2d", { "willReadFrequently": true });
    }
    static spriteImage(sprite, url) {
      var image = new Image();
      image.onload = (function() {
        sprite.image = image;
      }).bind(this);
      image.src = url;
    }
    addRenderable(renderable) {
      if (renderable instanceof GameLib2D2.Renderable) {
        this._renderables.push(renderable);
      } else {
        throw new TypeError("Parameter renderable must be an instance of GameLib2D.Renderable");
      }
    }
    get sprites() {
      return this._sprites;
    }
    get renderables() {
      return this._renderables;
    }
    get canvas() {
      return this._renderCanvas;
    }
    get ctx() {
      return this._renderCtx;
    }
    get viewportCanvas() {
      return this._viewportCanvas;
    }
    get viewportCtx() {
      return this._viewportCtx;
    }
    moveViewport(dx, dy) {
      this._viewport.move(dx, dy);
    }
    moveViewportTo(x, y) {
      this._viewport.moveTo(x, y);
    }
    moveViewportToSprite(sprite) {
      if (!(sprite instanceof GameLib2D2.Sprite)) {
        throw new GameLibCore2.Error("Parameter sprite must be an instance of GameLib2D.Sprite!");
      } else {
        var x = sprite.x - this._viewportCanvas.width / 2;
        var y = sprite.y - this._viewportCanvas.height / 2;
        var width = this._viewportCanvas.width;
        var height = this._viewportCanvas.height;
        if (x < 0) {
          x = 0;
        } else if (x + width > this._renderCanvas.width) {
          x = this._renderCanvas.width - width;
        }
        if (y < 0) {
          y = 0;
        } else if (y + height > this._renderCanvas.height) {
          y = this._renderCanvas.height - height;
        }
        this._viewport.moveTo(x, y);
      }
    }
    renderViewport() {
      var newImageData = this._renderCtx.getImageData(this._viewport.x, this._viewport.y, this._viewport.width, this._viewport.height);
      this._viewportCtx.putImageData(newImageData, 0, 0);
    }
    getSpritesOfType(spriteClass) {
      return this._sprites.filter((sprite) => sprite instanceof spriteClass);
    }
    getRenderablesOfType(renderableClass) {
      return this._renderables.filter((renderable) => renderable instanceof renderableClass);
    }
    addSprite(sprite) {
      if (sprite instanceof GameLib2D2.Sprite) {
        this._sprites.push(sprite);
      } else {
        throw new GameLibCore2.Error("Parameter sprite must be an instance of GameLib2D.Sprite");
      }
    }
    clearCanvas(clearViewport = true) {
      this._renderCtx.fillStyle = this.clearColor;
      this._renderCtx.fillRect(0, 0, this._renderCanvas.width, this._renderCanvas.height);
      if (clearViewport) {
        this._viewportCtx.fillStyle = this.clearColor;
        this._viewportCtx.fillRect(0, 0, this._viewportCanvas.width, this._viewportCanvas.height);
      }
    }
    mainloop() {
      this.update();
      this.draw();
      this.registerMainloop();
    }
    update() {
      if (!this._active) {
        return;
      }
      this.callHook("pre-update");
      this._sprites.forEach(function(sprite) {
        sprite.update();
      });
      this.callHook("post-update");
    }
    setBackground(image, repeat = "repeat") {
      this._background = this._renderCtx.createPattern(image, repeat);
    }
    renderBackground() {
      if (this._background != null) {
        this._renderCtx.fillStyle = this._background;
        this._renderCtx.fillRect(0, 0, this._renderCanvas.width, this._renderCanvas.height);
      }
    }
    drawGrid(size, color) {
      ctx.strokeStyle = color;
      for (var i2 = 0; i2 < this._renderCanvas.height; i2 += size) {
        ctx.beginPath();
        ctx.moveTo(0, i2);
        ctx.lineTo(this._renderCanvas.width, i2);
        ctx.closePath();
        ctx.stroke();
      }
      for (var i2 = 0; i2 < this._renderCanvas.width; i2 += size) {
        ctx.beginPath();
        ctx.moveTo(i2, 0);
        ctx.lineTo(i2, this._renderCanvas.height);
        ctx.closePath();
        ctx.stroke();
      }
    }
    draw() {
      if (!this._rendering) {
        return;
      }
      this.clearCanvas(false);
      this.callHook("pre-render");
      this.renderBackground();
      this._sprites.forEach((function(sprite) {
        if (sprite.checkCollision(this._viewport)) {
          sprite.draw();
        }
      }).bind(this));
      this._renderables.forEach((function(renderable) {
        if (!renderable.overlay) {
          if (renderable.isActive()) {
            if (renderable.shouldRender()) {
              renderable.draw();
            }
          }
        }
      }).bind(this));
      this.callHook("post-render");
      this.renderViewport();
      this._renderables.forEach((function(renderable) {
        if (renderable.overlay) {
          if (renderable.isActive()) {
            if (renderable.shouldRender()) {
              renderable.draw();
            }
          }
        }
      }).bind(this));
    }
    registerMainloop() {
      window.requestAnimationFrame(this.mainloop.bind(this));
    }
  };

  // src/2D/Sprite.js
  var Sprite = class extends Box {
    constructor(pos, size) {
      super(pos, size);
      this.image = null;
      this.fillColor = "#000000";
      this.gameLib = new GameLib();
      this.gameLib.addSprite(this);
      this.ctx = this.gameLib.ctx;
      this.triggers = [];
    }
    update() {
    }
    draw() {
      if (this.image != null) {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      } else {
        this.ctx.fillStyle = this.fillColor;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
    addTrigger(triggerID, callback) {
      this.triggers[triggerID] = callback;
    }
    trigger(triggerID) {
      if (this.triggers[triggerID]) {
        this.triggers[triggerID]();
      }
    }
    checkBounds() {
      if (this.x < 0) {
        this.moveTo(0, this.y);
        this.trigger("bounds");
      }
      if (this.x > this.gameLib.canvas.width - this.width) {
        this.moveTo(this.gameLib.canvas.width - this.width, this.y);
        this.trigger("bounds");
      }
      if (this.y < 0) {
        this.moveTo(this.x, 0);
        this.trigger("bounds");
      }
      if (this.y > this.gameLib.canvas.height - this.height) {
        this.moveTo(this.x, this.gameLib.canvas.height - this.height);
        this.trigger("bounds");
      }
    }
    drawHitbox() {
      this.ctx.strokeStyle = this.fillColor;
      this.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  };

  // src/2D/index.js
  var GameLib2D2 = class {
    constructor() {
      throw new GameLibCore.Error("Wrapper class GameLib2D may not be constructed!");
    }
    static Coord = Coord;
    static Size = Size;
    static Box = Box;
    static Rotation = Rotation;
    static Renderable = Renderable;
    static Sprite = Sprite;
    static GameLib = GameLib;
  };

  // src/3D/Utils.js
  var Utils2 = class {
    constructor() {
      throw new GameLibError("Class GameLib3D.Utils may not be constructed!");
    }
  };

  // src/3D/Object.js
  var Object2 = class {
    constructor(gameLib) {
      this._gameLib = gameLib;
      this._gl = this._gameLib.webgl;
    }
    setup() {
    }
    update() {
    }
    draw() {
    }
  };

  // src/3D/ShaderFactory/Node.js
  var Node = class {
    constructor() {
      this.canHaveChildren = false;
      this.canAddNode = false;
      this.canAddVar = false;
      this.canAddHeader = false;
      this._nodes = [];
      this._parent = null;
      this.text = null;
    }
    addNode(node) {
      if (!node.canAddNode) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
      }
      if (!this.canHaveChildren) {
        throw new GameLibCore2.Error("Trying to add children to a GameLib3D.ShaderFactory.Node that cannot contain children!");
      }
      node._parent = this;
      this._nodes.push(node);
    }
  };

  // src/3D/ShaderFactory/Modifiers/Variable.js
  var Variable = class {
    constructor({ input = false, output = false, uniform = false, attribute = false, varying = false, constant = false, precision = null } = {}) {
      this._input = input;
      this._output = output;
      this._uniform = uniform;
      this._attribute = attribute;
      this._varying = varying;
      this._constant = constant;
      this._precision = precision;
      this.text = null;
      this.update();
    }
    update() {
      var includeProps = ["_input", "_output", "_uniform", "_attribute", "_varying"];
      var matchedProps = 0;
      for (var i2 = 0; i2 < includeProps.length; i2++) {
        var prop = includeProps[i2];
        if (this[prop]) matchedProps += 1;
      }
      if (matchedProps > 1) {
        throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory.Modifiers.Variable has conflicting properties!");
      }
      this.text = "";
      if (this._constant) this.text += "const ";
      if (this._input) this.text += "in ";
      if (this._output) this.text += "out ";
      if (this._uniform) this.text += "uniform ";
      if (this._attribute) this.text += "attribute ";
      if (this._varying) this.text += "varying ";
      if (this._precision) this.text += `${this._precision} `;
    }
    get input() {
      return this._input;
    }
    set input(value) {
      this._input = value;
      this.update();
    }
    get output() {
      return this._output;
    }
    set output(value) {
      this._output = value;
      this.update();
    }
    get uniform() {
      return this._uniform;
    }
    set uniform(value) {
      this._uniform = value;
      this.update();
    }
    get attribute() {
      return this._attribute;
    }
    set attribute(value) {
      this._attribute = value;
      this.update();
    }
    get varying() {
      return this._varying;
    }
    set varying(value) {
      this._varying = value;
      this.update();
    }
    get constant() {
      return this._constant;
    }
    set constant(value) {
      this._constant = value;
      this.update();
    }
    get precision() {
      return this._precision;
    }
    set precision(value) {
      this._precision = value;
      this.update();
    }
  };

  // src/3D/ShaderFactory/Modifiers/index.js
  var Modifiers = class {
    constructor() {
      throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory.Modifiers may not be constructed!");
    }
    static Variable = Variable;
  };

  // src/3D/ShaderFactory/FunctionParam.js
  var FunctionParam = class {
    constructor(type, name, modifiers) {
      if (!modifiers || !Modifiers.Variable) modifiers = new Modifiers.Variable();
      modifiers.update();
      this._type = type;
      this._name = name;
      this._modifiers = modifiers;
      this.text = `${this._modifiers.text}${this._type} ${this._name}`;
    }
  };

  // src/3D/ShaderFactory/VariableTypes.js
  var VariableTypes = {
    "VECTOR": {
      "FLOAT": {
        "2": "vec2",
        "3": "vec3",
        "4": "vec4"
      },
      "DOUBLE": {
        "2": "dvec2",
        "3": "dvec3",
        "4": "dvec4"
      },
      "INT": {
        "2": "ivec2",
        "3": "ivec3",
        "4": "ivec4"
      },
      "UINT": {
        "2": "uvec2",
        "3": "uvec3",
        "4": "uvec4"
      },
      "BOOL": {
        "2": "bvec2",
        "3": "bvec3",
        "4": "bvec4"
      }
    },
    "MATRIX": {
      "2": "mat2",
      "3": "mat3",
      "4": "mat4",
      "custom": function(rows, cols) {
        return `mat${rows}x${cols}`;
      }
    },
    "FLOAT": "float",
    "DOUBLE": "double",
    "INT": "int",
    "UINT": "uint",
    "BOOL": "bool",
    "VOID": "void",
    "SAMPLER": {
      "2D": "sampler2D"
    }
  };

  // src/3D/ShaderFactory/PrecisionTypes.js
  var PrecisionTypes = {
    "LOW": "lowp",
    "MEDIUM": "mediump",
    "HIGH": "highp"
  };

  // src/3D/ShaderFactory/NodeTypes/NodeTypes.js
  var NodeTypes = class {
    constructor() {
      throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory.NodeTypes may not be constructed!");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Header.js
  NodeTypes.Header = class HeaderNode extends Node {
    constructor(type, ...data) {
      super();
      this.canAddHeader = true;
      this._type = type;
      this._data = data;
      var joinedData = this._data.join(" ");
      this.text = `#${this._type} ${joinedData}`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Variable.js
  NodeTypes.Variable = class VariableNode extends Node {
    constructor(type, name, modifiers = null, initialValue = null) {
      super();
      if (!modifiers || !(modifiers instanceof Modifiers.Variable)) modifiers = new Modifiers.Variable();
      modifiers.update();
      this.canAddNode = true;
      this.canAddVar = true;
      this._type = type;
      this._name = name;
      this._modifiers = modifiers;
      this._initialValue = initialValue;
      var initialValueText = "";
      if (this._initialValue !== null) {
        var valueString = this._initialValue.text;
        initialValueText = ` = ${valueString}`;
      }
      this.text = `${this._modifiers.text}${this._type} ${this._name}${initialValueText};`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Function.js
  NodeTypes.Function = class FunctionNode extends Node {
    constructor(type, name, params) {
      super();
      this.canAddNode = true;
      this.canHaveChildren = true;
      this._type = type;
      this._name = name;
      this._params = params;
      var paramsText = this._params.join(", ");
      this._startText = `${this._type} ${this._name}(${paramsText}) {
`;
      this._endText = "\n}";
      this.update();
    }
    update() {
      var nodeTexts = [];
      for (var i2 = 0; i2 < this._nodes.length; i2++) {
        nodeTexts.push(this._nodes[i2].text);
      }
      var nodesText = nodeTexts.join("\n");
      this.text = `${this._startText}${nodesText}${this._endText}`;
    }
    addNode(node) {
      if (!node.canAddNode) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
      }
      if (!this.canHaveChildren) {
        throw new GameLibCore2.Error("Trying to add children to a GameLib3D.ShaderFactory.Node that cannot contain children!");
      }
      node._parent = this;
      this._nodes.push(node);
      this.update();
    }
  };

  // src/3D/ShaderFactory/NodeTypes/MainFunction.js
  NodeTypes.MainFunction = class MainFunctionNode extends NodeTypes.Function {
    constructor() {
      super(VariableTypes.VOID, "main", []);
    }
  };

  // src/3D/ShaderFactory/NodeTypes/AssignVariable.js
  NodeTypes.AssignVariable = class AssignVariableNode extends Node {
    constructor(target, node) {
      super();
      this._target = target;
      this._node = node;
      this.canAddNode = true;
      this.text = `${this._target} = ${this._node.text};`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Constant.js
  NodeTypes.Constant = class ConstantNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = value;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Symbol.js
  NodeTypes.Symbol = class SymbolNode extends Node {
    constructor(name) {
      super();
      this._name = name;
      this.text = name;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Add.js
  NodeTypes.Add = class AddNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" + ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Subtract.js
  NodeTypes.Subtract = class SubtractNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" - ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Multiply.js
  NodeTypes.Multiply = class MultiplyNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" * ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Divide.js
  NodeTypes.Divide = class DivideNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" / ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Vector.js
  NodeTypes.Vector = class VectorNode extends Node {
    constructor(type, ...values) {
      super();
      this._type = type;
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var joinedValues = valueTexts.join(", ");
      this.text = `${this._type}(${joinedValues})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Normalize.js
  NodeTypes.Normalize = class NormalizeNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      var valueText = this._value.text;
      this.text = `normalize(${valueText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Precision.js
  NodeTypes.Precision = class PrecisionNode extends Node {
    constructor(type, precision) {
      super();
      this.canAddHeader = true;
      this._type = type;
      this._precision = precision;
      this.text = `precision ${this._precision} ${this._type};`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Dot.js
  NodeTypes.Dot = class DotNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `dot(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Max.js
  NodeTypes.Max = class MaxNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `max(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/XYZ.js
  NodeTypes.XYZ = class XYZNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text}).xyz`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Group.js
  NodeTypes.Group = class GroupNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Texture2D.js
  NodeTypes.Texture2D = class Texture2DNode extends Node {
    constructor(value1, value2) {
      super();
      this._value1 = value1;
      this._value2 = value2;
      this.text = `texture2D(${value1.text}, ${value2.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/RGB.js
  NodeTypes.RGB = class RGBNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text}).rgb`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/A.js
  NodeTypes.A = class ANode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text}).a`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Length.js
  NodeTypes.Length = class LengthNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `length(${this._value.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Exp2.js
  NodeTypes.Exp2 = class Exp2Node extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `exp2(${this._value.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Define.js
  NodeTypes.Define = class DefineNode extends Node {
    constructor(name, value) {
      super();
      this.canAddNode = true;
      this._name = name;
      this._value = value;
      this.text = `#define ${this._name} ${this._value.text}`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Negative.js
  NodeTypes.Negative = class NegativeNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `-${this._value.text}`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Clamp.js
  NodeTypes.Clamp = class ClampNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `clamp(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Mix.js
  NodeTypes.Mix = class MixNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `mix(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/Program.js
  var Program = class {
    constructor() {
      this._header = [];
      this._vars = [];
      this._nodes = [];
    }
    get header() {
      return this._header;
    }
    get vars() {
      return this._vars;
    }
    get nodes() {
      return this._nodes;
    }
    addNode(node) {
      if (!node.canAddNode) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
      }
      node._parent = this;
      this._nodes.push(node);
    }
    addVar(node) {
      if (!node.canAddVar) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node as a variable that has canAddVar set to false!");
      }
      node._parent = this;
      this._vars.push(node);
    }
    addHeader(node) {
      if (!node.canAddHeader) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node as a header that has canAddHeader set to false!");
      }
      node._parent = this;
      this._header.push(node);
    }
  };

  // src/3D/ShaderFactory/index.js
  var ShaderFactory = class {
    constructor() {
      throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory may not be constructed!");
    }
    static Node = Node;
    static Modifiers = Modifiers;
    static FunctionParam = FunctionParam;
    static VariableTypes = VariableTypes;
    static PrecisionTypes = PrecisionTypes;
    static NodeTypes = NodeTypes;
    static Program = Program;
    static compileFactory(shaderFactoryProgram) {
      var headers = shaderFactoryProgram.header;
      var headerTexts = [];
      for (var i2 = 0; i2 < headers.length; i2++) {
        headerTexts.push(headers[i2].text);
      }
      var headersText = headerTexts.join("\n");
      var vars = shaderFactoryProgram.vars;
      var varTexts = [];
      for (var i2 = 0; i2 < vars.length; i2++) {
        varTexts.push(vars[i2].text);
      }
      var varsText = varTexts.join("\n");
      var nodes = shaderFactoryProgram.nodes;
      var nodeTexts = [];
      for (var i2 = 0; i2 < nodes.length; i2++) {
        nodeTexts.push(nodes[i2].text);
      }
      var nodesText = nodeTexts.join("\n");
      var result = `${headersText}
${varsText}
${nodesText}`;
      return result;
    }
  };

  // src/3D/GameLib.js
  var GameLib2 = class extends GameLibCore2.GameLibBase {
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
        this._clearColor = [0, 0, 0, 1];
        this.registerMainloop();
        GameLib3D.GameLib._instance = this;
      }
    }
    static getContext(canvas, webgl2 = true) {
      if (webgl2) {
        return canvas.getContext("webgl2");
      } else {
        return canvas.getContext("webgl");
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
      if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
        console.warn("[GameLib] Shader compilation failed:", this._gl.getShaderInfoLog(shader));
        this._gl.deleteShader(shader);
        return null;
      }
      return shader;
    }
    createProgram(...shaders) {
      var program = this._gl.createProgram();
      for (var i2 = 0; i2 < shaders.length; i2++) {
        this._gl.attachShader(program, shaders[i2]);
      }
      this._gl.linkProgram(program);
      if (!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
        console.warn("[GameLib] Program linking failed:", this._gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    }
    useProgram(program) {
      this._gl.useProgram(program);
    }
    getAttributeLocation(program, name, forceMode = null) {
      var location;
      if (!forceMode && name.startsWith("a") || forceMode == "attribute") {
        location = this._gl.getAttribLocation(program, name);
      }
      if (!forceMode && name.startsWith("u") || forceMode == "uniform") {
        location = this._gl.getUniformLocation(program, name);
      }
      return location;
    }
    setProgramAttribute(program, name, buffer, num, type, normalize = false, stride = 0, offset = 0, forceMode = null) {
      if (!type) type = this._gl.FLOAT;
      var location = this.getAttributeLocation(program, name, forceMode);
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);
      this._gl.vertexAttribPointer(location, num, type, normalize, stride, offset);
      this._gl.enableVertexAttribArray(location);
    }
    addObject(object) {
      if (object instanceof GameLib3D.Object) {
        object.setup();
        this._objects.push(object);
      } else {
        throw new GameLibCore2.Error("GameLib3D.GameLib.addObject(object) must be passed an instance of GameLib3D.Object!");
      }
    }
    update() {
      if (!this._active) return;
      this.callHook("pre-update");
      for (var i2 = 0; i2 < this._objects.length; i2++) {
        this._objects[i2].update();
      }
      this.callHook("post-update");
    }
    clearCanvas() {
      this._gl.clearColor(...this._clearColor);
      this._gl.clearDepth(1);
      this._gl.enable(this._gl.DEPTH_TEST);
      this._gl.depthFunc(this._gl.LEQUAL);
      this._gl.enable(this._gl.BLEND);
      this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
      this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }
    draw() {
      if (!this._rendering) return;
      this.clearCanvas();
      this.callHook("pre-render");
      for (var i2 = 0; i2 < this._objects.length; i2++) {
        this._objects[i2].draw();
      }
      this.callHook("post-render");
    }
    mainloop() {
      this.update();
      this.draw();
      this.registerMainloop();
    }
    registerMainloop() {
      window.requestAnimationFrame(this.mainloop.bind(this));
    }
  };

  // src/3D/Matrix.js
  var EPSILON = 1e-6;
  var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
  var degree = Math.PI / 180;
  var radian = 180 / Math.PI;
  function create$6() {
    var out = new ARRAY_TYPE(9);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
    }
    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  }
  function create$5() {
    var out = new ARRAY_TYPE(16);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
    }
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  function clone$5(a) {
    var out = new ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function copy$5(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function fromValues$5(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    var out = new ARRAY_TYPE(16);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function set$5(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function identity$2(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function transpose(out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a03 = a[3];
      var a12 = a[6], a13 = a[7];
      var a23 = a[11];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a01;
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a02;
      out[9] = a12;
      out[11] = a[14];
      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
    } else {
      out[0] = a[0];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a[1];
      out[5] = a[5];
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a[2];
      out[9] = a[6];
      out[10] = a[10];
      out[11] = a[14];
      out[12] = a[3];
      out[13] = a[7];
      out[14] = a[11];
      out[15] = a[15];
    }
    return out;
  }
  function invert$2(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  function adjoint(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    out[0] = a11 * b11 - a12 * b10 + a13 * b09;
    out[1] = a02 * b10 - a01 * b11 - a03 * b09;
    out[2] = a31 * b05 - a32 * b04 + a33 * b03;
    out[3] = a22 * b04 - a21 * b05 - a23 * b03;
    out[4] = a12 * b08 - a10 * b11 - a13 * b07;
    out[5] = a00 * b11 - a02 * b08 + a03 * b07;
    out[6] = a32 * b02 - a30 * b05 - a33 * b01;
    out[7] = a20 * b05 - a22 * b02 + a23 * b01;
    out[8] = a10 * b10 - a11 * b08 + a13 * b06;
    out[9] = a01 * b08 - a00 * b10 - a03 * b06;
    out[10] = a30 * b04 - a31 * b02 + a33 * b00;
    out[11] = a21 * b02 - a20 * b04 - a23 * b00;
    out[12] = a11 * b07 - a10 * b09 - a12 * b06;
    out[13] = a00 * b09 - a01 * b07 + a02 * b06;
    out[14] = a31 * b01 - a30 * b03 - a32 * b00;
    out[15] = a20 * b03 - a21 * b01 + a22 * b00;
    return out;
  }
  function determinant(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = a00 * a11 - a01 * a10;
    var b1 = a00 * a12 - a02 * a10;
    var b2 = a01 * a12 - a02 * a11;
    var b3 = a20 * a31 - a21 * a30;
    var b4 = a20 * a32 - a22 * a30;
    var b5 = a21 * a32 - a22 * a31;
    var b6 = a00 * b5 - a01 * b4 + a02 * b3;
    var b7 = a10 * b5 - a11 * b4 + a12 * b3;
    var b8 = a20 * b2 - a21 * b1 + a22 * b0;
    var b9 = a30 * b2 - a31 * b1 + a32 * b0;
    return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
  }
  function multiply$5(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  function translate$1(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  }
  function scale$5(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function rotate$1(out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len = Math.sqrt(x * x + y * y + z * z);
    var s, c, t;
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    var b00, b01, b02;
    var b10, b11, b12;
    var b20, b21, b22;
    if (len < EPSILON) {
      return null;
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  }
  function rotateX$3(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
  }
  function rotateY$3(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
  }
  function rotateZ$3(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    if (a !== out) {
      out[8] = a[8];
      out[9] = a[9];
      out[10] = a[10];
      out[11] = a[11];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
  }
  function fromTranslation$1(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromScaling(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = v[1];
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = v[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotation$1(out, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len = Math.sqrt(x * x + y * y + z * z);
    var s, c, t;
    if (len < EPSILON) {
      return null;
    }
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    out[0] = x * x * t + c;
    out[1] = y * x * t + z * s;
    out[2] = z * x * t - y * s;
    out[3] = 0;
    out[4] = x * y * t - z * s;
    out[5] = y * y * t + c;
    out[6] = z * y * t + x * s;
    out[7] = 0;
    out[8] = x * z * t + y * s;
    out[9] = y * z * t - x * s;
    out[10] = z * z * t + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromXRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = s;
    out[7] = 0;
    out[8] = 0;
    out[9] = -s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromYRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = 0;
    out[2] = -s;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromZRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotationTranslation$1(out, q, v) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromQuat2(out, a) {
    var translation = new ARRAY_TYPE(3);
    var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
    var magnitude = bx * bx + by * by + bz * bz + bw * bw;
    if (magnitude > 0) {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
    } else {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
    }
    fromRotationTranslation$1(out, a, translation);
    return out;
  }
  function getTranslation$1(out, mat) {
    out[0] = mat[12];
    out[1] = mat[13];
    out[2] = mat[14];
    return out;
  }
  function getScaling(out, mat) {
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
    return out;
  }
  function getRotation(out, mat) {
    var scaling = new ARRAY_TYPE(3);
    getScaling(scaling, mat);
    var is1 = 1 / scaling[0];
    var is2 = 1 / scaling[1];
    var is3 = 1 / scaling[2];
    var sm11 = mat[0] * is1;
    var sm12 = mat[1] * is2;
    var sm13 = mat[2] * is3;
    var sm21 = mat[4] * is1;
    var sm22 = mat[5] * is2;
    var sm23 = mat[6] * is3;
    var sm31 = mat[8] * is1;
    var sm32 = mat[9] * is2;
    var sm33 = mat[10] * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1) * 2;
      out[3] = 0.25 * S;
      out[0] = (sm23 - sm32) / S;
      out[1] = (sm31 - sm13) / S;
      out[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
      out[3] = (sm23 - sm32) / S;
      out[0] = 0.25 * S;
      out[1] = (sm12 + sm21) / S;
      out[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
      out[3] = (sm31 - sm13) / S;
      out[0] = (sm12 + sm21) / S;
      out[1] = 0.25 * S;
      out[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
      out[3] = (sm12 - sm21) / S;
      out[0] = (sm31 + sm13) / S;
      out[1] = (sm23 + sm32) / S;
      out[2] = 0.25 * S;
    }
    return out;
  }
  function decompose(out_r, out_t, out_s, mat) {
    out_t[0] = mat[12];
    out_t[1] = mat[13];
    out_t[2] = mat[14];
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out_s[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    out_s[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    out_s[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
    var is1 = 1 / out_s[0];
    var is2 = 1 / out_s[1];
    var is3 = 1 / out_s[2];
    var sm11 = m11 * is1;
    var sm12 = m12 * is2;
    var sm13 = m13 * is3;
    var sm21 = m21 * is1;
    var sm22 = m22 * is2;
    var sm23 = m23 * is3;
    var sm31 = m31 * is1;
    var sm32 = m32 * is2;
    var sm33 = m33 * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1) * 2;
      out_r[3] = 0.25 * S;
      out_r[0] = (sm23 - sm32) / S;
      out_r[1] = (sm31 - sm13) / S;
      out_r[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
      out_r[3] = (sm23 - sm32) / S;
      out_r[0] = 0.25 * S;
      out_r[1] = (sm12 + sm21) / S;
      out_r[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
      out_r[3] = (sm31 - sm13) / S;
      out_r[0] = (sm12 + sm21) / S;
      out_r[1] = 0.25 * S;
      out_r[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
      out_r[3] = (sm12 - sm21) / S;
      out_r[0] = (sm31 + sm13) / S;
      out_r[1] = (sm23 + sm32) / S;
      out_r[2] = 0.25 * S;
    }
    return out_r;
  }
  function fromRotationTranslationScale(out, q, v, s) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    var ox = o[0];
    var oy = o[1];
    var oz = o[2];
    var out0 = (1 - (yy + zz)) * sx;
    var out1 = (xy + wz) * sx;
    var out2 = (xz - wy) * sx;
    var out4 = (xy - wz) * sy;
    var out5 = (1 - (xx + zz)) * sy;
    var out6 = (yz + wx) * sy;
    var out8 = (xz + wy) * sz;
    var out9 = (yz - wx) * sz;
    var out10 = (1 - (xx + yy)) * sz;
    out[0] = out0;
    out[1] = out1;
    out[2] = out2;
    out[3] = 0;
    out[4] = out4;
    out[5] = out5;
    out[6] = out6;
    out[7] = 0;
    out[8] = out8;
    out[9] = out9;
    out[10] = out10;
    out[11] = 0;
    out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
    out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
    out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
    out[15] = 1;
    return out;
  }
  function fromQuat(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function frustum(out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left);
    var tb = 1 / (top - bottom);
    var nf = 1 / (near - far);
    out[0] = near * 2 * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = near * 2 * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near * 2 * nf;
    out[15] = 0;
    return out;
  }
  function perspectiveNO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      var nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = 2 * far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }
    return out;
  }
  var perspective = perspectiveNO;
  function perspectiveZO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      var nf = 1 / (near - far);
      out[10] = far * nf;
      out[14] = far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -near;
    }
    return out;
  }
  function perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI / 180);
    var downTan = Math.tan(fov.downDegrees * Math.PI / 180);
    var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
    var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
    var xScale = 2 / (leftTan + rightTan);
    var yScale = 2 / (upTan + downTan);
    out[0] = xScale;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = yScale;
    out[6] = 0;
    out[7] = 0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = (upTan - downTan) * yScale * 0.5;
    out[10] = far / (near - far);
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near / (near - far);
    out[15] = 0;
    return out;
  }
  function orthoNO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }
  var ortho = orthoNO;
  function orthoZO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = near * nf;
    out[15] = 1;
    return out;
  }
  function lookAt(out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    var eyex = eye[0];
    var eyey = eye[1];
    var eyez = eye[2];
    var upx = up[0];
    var upy = up[1];
    var upz = up[2];
    var centerx = center[0];
    var centery = center[1];
    var centerz = center[2];
    if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
      return identity$2(out);
    }
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      len = 1 / len;
      x0 *= len;
      x1 *= len;
      x2 *= len;
    }
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len = 1 / len;
      y0 *= len;
      y1 *= len;
      y2 *= len;
    }
    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  }
  function targetTo(out, eye, target, up) {
    var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
    var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
    var len = z0 * z0 + z1 * z1 + z2 * z2;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      z0 *= len;
      z1 *= len;
      z2 *= len;
    }
    var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
    len = x0 * x0 + x1 * x1 + x2 * x2;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      x0 *= len;
      x1 *= len;
      x2 *= len;
    }
    out[0] = x0;
    out[1] = x1;
    out[2] = x2;
    out[3] = 0;
    out[4] = z1 * x2 - z2 * x1;
    out[5] = z2 * x0 - z0 * x2;
    out[6] = z0 * x1 - z1 * x0;
    out[7] = 0;
    out[8] = z0;
    out[9] = z1;
    out[10] = z2;
    out[11] = 0;
    out[12] = eyex;
    out[13] = eyey;
    out[14] = eyez;
    out[15] = 1;
    return out;
  }
  function str$5(a) {
    return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
  }
  function frob(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8] + a[9] * a[9] + a[10] * a[10] + a[11] * a[11] + a[12] * a[12] + a[13] * a[13] + a[14] * a[14] + a[15] * a[15]);
  }
  function add$5(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
  }
  function subtract$3(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
  }
  function multiplyScalar(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
  }
  function multiplyScalarAndAdd(out, a, b, scale) {
    out[0] = a[0] + b[0] * scale;
    out[1] = a[1] + b[1] * scale;
    out[2] = a[2] + b[2] * scale;
    out[3] = a[3] + b[3] * scale;
    out[4] = a[4] + b[4] * scale;
    out[5] = a[5] + b[5] * scale;
    out[6] = a[6] + b[6] * scale;
    out[7] = a[7] + b[7] * scale;
    out[8] = a[8] + b[8] * scale;
    out[9] = a[9] + b[9] * scale;
    out[10] = a[10] + b[10] * scale;
    out[11] = a[11] + b[11] * scale;
    out[12] = a[12] + b[12] * scale;
    out[13] = a[13] + b[13] * scale;
    out[14] = a[14] + b[14] * scale;
    out[15] = a[15] + b[15] * scale;
    return out;
  }
  function exactEquals$5(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
  }
  function equals$5(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
    var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
    var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
    var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
    var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1, Math.abs(a15), Math.abs(b15));
  }
  var mul$5 = multiply$5;
  var sub$3 = subtract$3;
  var mat4 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$5,
    clone: clone$5,
    copy: copy$5,
    fromValues: fromValues$5,
    set: set$5,
    identity: identity$2,
    transpose,
    invert: invert$2,
    adjoint,
    determinant,
    multiply: multiply$5,
    translate: translate$1,
    scale: scale$5,
    rotate: rotate$1,
    rotateX: rotateX$3,
    rotateY: rotateY$3,
    rotateZ: rotateZ$3,
    fromTranslation: fromTranslation$1,
    fromScaling,
    fromRotation: fromRotation$1,
    fromXRotation,
    fromYRotation,
    fromZRotation,
    fromRotationTranslation: fromRotationTranslation$1,
    fromQuat2,
    getTranslation: getTranslation$1,
    getScaling,
    getRotation,
    decompose,
    fromRotationTranslationScale,
    fromRotationTranslationScaleOrigin,
    fromQuat,
    frustum,
    perspectiveNO,
    perspective,
    perspectiveZO,
    perspectiveFromFieldOfView,
    orthoNO,
    ortho,
    orthoZO,
    lookAt,
    targetTo,
    str: str$5,
    frob,
    add: add$5,
    subtract: subtract$3,
    multiplyScalar,
    multiplyScalarAndAdd,
    exactEquals: exactEquals$5,
    equals: equals$5,
    mul: mul$5,
    sub: sub$3
  });
  function create$4() {
    var out = new ARRAY_TYPE(3);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    return out;
  }
  function length$4(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function fromValues$4(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function normalize$4(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len = x * x + y * y + z * z;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  }
  function dot$4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross$2(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2];
    var bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  var len$4 = length$4;
  var forEach$2 = (function() {
    var vec = create$4();
    return function(a, stride, offset, count, fn, arg) {
      var i2, l;
      if (!stride) {
        stride = 3;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i2 = offset; i2 < l; i2 += stride) {
        vec[0] = a[i2];
        vec[1] = a[i2 + 1];
        vec[2] = a[i2 + 2];
        fn(vec, vec, arg);
        a[i2] = vec[0];
        a[i2 + 1] = vec[1];
        a[i2 + 2] = vec[2];
      }
      return a;
    };
  })();
  function create$3() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    }
    return out;
  }
  function normalize$3(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
    return out;
  }
  var forEach$1 = (function() {
    var vec = create$3();
    return function(a, stride, offset, count, fn, arg) {
      var i2, l;
      if (!stride) {
        stride = 4;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i2 = offset; i2 < l; i2 += stride) {
        vec[0] = a[i2];
        vec[1] = a[i2 + 1];
        vec[2] = a[i2 + 2];
        vec[3] = a[i2 + 3];
        fn(vec, vec, arg);
        a[i2] = vec[0];
        a[i2 + 1] = vec[1];
        a[i2 + 2] = vec[2];
        a[i2 + 3] = vec[3];
      }
      return a;
    };
  })();
  function create$2() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    out[3] = 1;
    return out;
  }
  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }
  function slerp(out, a, b, t) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3];
    var bx = b[0], by = b[1], bz = b[2], bw = b[3];
    var omega, cosom, sinom, scale0, scale1;
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    if (cosom < 0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (1 - cosom > EPSILON) {
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  }
  function fromMat3(out, m) {
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;
    if (fTrace > 0) {
      fRoot = Math.sqrt(fTrace + 1);
      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      var i2 = 0;
      if (m[4] > m[0]) i2 = 1;
      if (m[8] > m[i2 * 3 + i2]) i2 = 2;
      var j = (i2 + 1) % 3;
      var k = (i2 + 2) % 3;
      fRoot = Math.sqrt(m[i2 * 3 + i2] - m[j * 3 + j] - m[k * 3 + k] + 1);
      out[i2] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i2] + m[i2 * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i2] + m[i2 * 3 + k]) * fRoot;
    }
    return out;
  }
  var normalize$2 = normalize$3;
  var rotationTo = (function() {
    var tmpvec3 = create$4();
    var xUnitVec3 = fromValues$4(1, 0, 0);
    var yUnitVec3 = fromValues$4(0, 1, 0);
    return function(out, a, b) {
      var dot = dot$4(a, b);
      if (dot < -0.999999) {
        cross$2(tmpvec3, xUnitVec3, a);
        if (len$4(tmpvec3) < 1e-6) cross$2(tmpvec3, yUnitVec3, a);
        normalize$4(tmpvec3, tmpvec3);
        setAxisAngle(out, tmpvec3, Math.PI);
        return out;
      } else if (dot > 0.999999) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
      } else {
        cross$2(tmpvec3, a, b);
        out[0] = tmpvec3[0];
        out[1] = tmpvec3[1];
        out[2] = tmpvec3[2];
        out[3] = 1 + dot;
        return normalize$2(out, out);
      }
    };
  })();
  var sqlerp = (function() {
    var temp1 = create$2();
    var temp2 = create$2();
    return function(out, a, b, c, d, t) {
      slerp(temp1, a, d, t);
      slerp(temp2, b, c, t);
      slerp(out, temp1, temp2, 2 * t * (1 - t));
      return out;
    };
  })();
  var setAxes = (function() {
    var matr = create$6();
    return function(out, view, right, up) {
      matr[0] = right[0];
      matr[3] = right[1];
      matr[6] = right[2];
      matr[1] = up[0];
      matr[4] = up[1];
      matr[7] = up[2];
      matr[2] = -view[0];
      matr[5] = -view[1];
      matr[8] = -view[2];
      return normalize$2(out, fromMat3(out, matr));
    };
  })();
  function create() {
    var out = new ARRAY_TYPE(2);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
    }
    return out;
  }
  var forEach = (function() {
    var vec = create();
    return function(a, stride, offset, count, fn, arg) {
      var i2, l;
      if (!stride) {
        stride = 2;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i2 = offset; i2 < l; i2 += stride) {
        vec[0] = a[i2];
        vec[1] = a[i2 + 1];
        fn(vec, vec, arg);
        a[i2] = vec[0];
        a[i2 + 1] = vec[1];
      }
      return a;
    };
  })();

  // src/3D/Position.js
  var Position = class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    translate(dx, dy, dz) {
      this.x += dx;
      this.y += dy;
      this.z += dz;
    }
  };

  // src/3D/Rotation.js
  var Rotation2 = class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    rotate(rx, ry, rz) {
      this.x += rx;
      this.y += ry;
      this.z += rz;
    }
  };

  // src/3D/Scale.js
  var Scale = class {
    constructor(x = 1, y = 1, z = 1) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  };

  // src/3D/Transform.js
  var Transform = class {
    constructor(position = new Position(), rotation = new Rotation2(), scale = new Scale()) {
      this.position = position;
      this.rotation = rotation;
      this.scale = scale;
    }
    translate(x, y, z) {
      this.position.translate(x, y, z);
    }
    rotate(x, y, z) {
      this.rotation.rotate(x, y, z);
    }
    getModelMatrix() {
      var matrix = mat4.create();
      mat4.translate(matrix, matrix, this.position);
      mat4.rotateX(matrix, matrix, this.rotation.x);
      mat4.rotateY(matrix, matrix, this.rotation.y);
      mat4.rotateZ(matrix, matrix, this.rotation.z);
      mat4.scale(matrix, matrix, [this.scale.x, this.scale.y, this.scale.x]);
      return matrix;
    }
    getNormalMatrix(modelViewMatrix) {
      var normalMatrix = mat4.create();
      mat4.invert(normalMatrix, modelViewMatrix);
      mat4.transpose(normalMatrix, normalMatrix);
      return normalMatrix;
    }
  };

  // src/3D/index.js
  var GameLib3D = class {
    constructor() {
      throw new GameLibCore2.Error("Wrapper class GameLib3D may not be constructed!");
    }
    static Utils = Utils2;
    static Object = Object2;
    static ShaderFactory = ShaderFactory;
    static GameLib = GameLib2;
    static mat4 = mat4;
    static Transform = Transform;
    static Position = Position;
    static Rotation = Rotation2;
    static Scale = Scale;
  };

  // src/index.js
  var libraryExports = {
    GameLibCore: GameLibCore2,
    GameLib2D: GameLib2D2,
    GameLib3D
  };
  for (i = 0; i < Object.keys(libraryExports).length; i++) {
    key = Object.keys(libraryExports)[i];
    self[key] = libraryExports[key];
  }
  var key;
  var i;
})();
/*!
@fileoverview gl-matrix - High performance matrix and vector operations
@author Brandon Jones
@author Colin MacKenzie IV
@version 3.4.4

Copyright (c) 2015-2025, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

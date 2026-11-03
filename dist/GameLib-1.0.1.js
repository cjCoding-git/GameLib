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

  // src/3D/index.js
  var GameLib3D = class {
    constructor() {
      throw new GameLibCore2.Error("Wrapper class GameLib3D may not be constructed!");
    }
    static Utils = Utils2;
    static Object = Object2;
    static ShaderFactory = ShaderFactory;
    static GameLib = GameLib2;
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

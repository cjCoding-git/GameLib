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

  // src/Core/index.js
  var GameLibCore2 = class {
    constructor() {
      throw new GameLibError("Class GameLibCore may not be constructed!");
    }
    static Error = GameLibError;
    static Utils = Utils;
    static InputManager = InputManager;
    static AudioManager = AudioManager;
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
  var GameLib = class {
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
        this.preUpdateHooks = [];
        this.postUpdateHooks = [];
        this.preRenderHooks = [];
        this.postRenderHooks = [];
        this._background = null;
        this._active = true;
        this._rendering = true;
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
    addHook(event, hook) {
      if (event == "pre-update") {
        this.preUpdateHooks.push(hook);
      }
      if (event == "post-update") {
        this.postUpdateHooks.push(hook);
      }
      if (event == "pre-render") {
        this.preRenderHooks.push(hook);
      }
      if (event == "post-render") {
        this.postRenderHooks.push(hook);
      }
    }
    setActive(active) {
      this._active = active;
    }
    setRendering(rendering) {
      this._rendering = rendering;
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
        throw new GameLibCore.Error("Parameter sprite must be an instance of GameLib2D.Sprite!");
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
        throw new GameLibCore.Error("Parameter sprite must be an instance of GameLib2D.Sprite");
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
      this.preUpdateHooks.forEach(function(hook) {
        hook();
      });
      this._sprites.forEach(function(sprite) {
        sprite.update();
      });
      this.postUpdateHooks.forEach(function(hook) {
        hook();
      });
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
      this.preRenderHooks.forEach(function(hook) {
        hook();
      });
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
      this.postRenderHooks.forEach(function(hook) {
        hook();
      });
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

  // src/3D/index.js
  var GameLib3D = class {
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

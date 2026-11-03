import { GameLib2D } from "./index.js"
class GameLib {
  constructor(renderCanvas, renderCtx, viewportCanvas, viewportCtx) {
    if (GameLib2D.GameLib._instance != null) {
      delete this;
      return GameLib2D.GameLib._instance;
    } else {
      console.log("[GameLib] No GameLib2D instance found. Creating new instance.");
      this._sprites = [];
      this.clearColor = "#dddddd";
      this._renderCanvas = renderCanvas;
      this._renderCtx = renderCtx;
      this._viewportCanvas = viewportCanvas;
      this._viewportCtx = viewportCtx;
      this._viewport = new GameLib2D.Box(new GameLib2D.Coord(0, 0), new GameLib2D.Size(this._viewportCanvas.width, this._viewportCanvas.height));
      this._renderables = [];
      this.preUpdateHooks = [];
      this.postUpdateHooks = [];
      this.preRenderHooks = [];
      this.postRenderHooks = [];
      this._background = null;
      this._active = true;
      this._rendering = true;
      GameLib2D.GameLib._instance = this;
    }
  }
  static getContext(canvas) {
    return canvas.getContext('2d', { 'willReadFrequently': true });
  }
  static spriteImage(sprite, url) {
    var image = new Image();
    image.onload = (function () {
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
    if (renderable instanceof GameLib2D.Renderable) {
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
    if (!(sprite instanceof GameLib2D.Sprite)) {
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
    return this._sprites.filter(sprite => sprite instanceof spriteClass);
  }
  getRenderablesOfType(renderableClass) {
    return this._renderables.filter(renderable => renderable instanceof renderableClass);
  }
  addSprite(sprite) {
    if (sprite instanceof GameLib2D.Sprite) {
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
    this.preUpdateHooks.forEach(function (hook) {
      hook();
    });
    this._sprites.forEach(function (sprite) {
      sprite.update();
    });
    this.postUpdateHooks.forEach(function (hook) {
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
    for (var i = 0; i < this._renderCanvas.height; i += size) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this._renderCanvas.width, i);
      ctx.closePath();
      ctx.stroke();
    }
    for (var i = 0; i < this._renderCanvas.width; i += size) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this._renderCanvas.height);
      ctx.closePath();
      ctx.stroke();
    }
  }
  draw() {
    if (!this._rendering) {
      return;
    }
    this.clearCanvas(false);
    this.preRenderHooks.forEach(function (hook) {
      hook();
    });
    this.renderBackground();
    this._sprites.forEach((function (sprite) {
      if (sprite.checkCollision(this._viewport)) {
        sprite.draw();
      }
    }).bind(this));
    this._renderables.forEach((function (renderable) {
      if (!renderable.overlay) {
        if (renderable.isActive()) {
          if (renderable.shouldRender()) {
            renderable.draw();
          }
        }
      }
    }).bind(this));
    this.postRenderHooks.forEach(function (hook) {
      hook();
    });
    this.renderViewport();
    this._renderables.forEach((function (renderable) {
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
}
export {
  GameLib
}

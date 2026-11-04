import { GameLibCore } from "../Core/index.js"
import { GameLib2D } from "./index.js"
import { Coord } from "./Coord.js"
import { Size } from "./Size.js"
import { Box } from "./Box.js"
import { Renderable } from "./Renderable.js"
import { Sprite } from "./Sprite.js"
import { Loading } from "./Loading.js"
class GameLib extends GameLibCore.GameLibBase {
  constructor(renderCanvas, renderCtx, viewportCanvas, viewportCtx) {
    if (GameLib2D.GameLib._instance != null) {
      return GameLib2D.GameLib._instance;
    } else {
      super();
      console.log("[GameLib] No GameLib instance found. Creating new instance.");
      this._scene = "loading";
      this._sprites = [];
      this.clearColor = "#dddddd";
      renderCanvas.setAttribute('style', 'image-rendering: pixelated;');
      this._renderCanvas = renderCanvas;
      this._renderCtx = renderCtx;
      viewportCanvas.setAttribute('style', 'image-rendering: pixelated;');
      this._viewportCanvas = viewportCanvas;
      this._viewportCtx = viewportCtx;
      this._viewport = new Box(new Coord(0, 0), new Size(this._viewportCanvas.width, this._viewportCanvas.height));
      this._renderables = [];
      this._background = {};
      this._active = true;
      this._rendering = true;
      this._loadingScreen = Loading.DEFAULT_CONFIG;
      this.oncontextmenu = null;
      window.addEventListener('click', this.checkButtons.bind(this), false);
      window.addEventListener('mousemove', this.hoverButtons.bind(this), false);
      window.addEventListener('contextmenu', this.contextMenu.bind(this), false);
      GameLib._instance = this;
    }
  }
  contextMenu(evt) {
    evt.preventDefault();
    evt.returnValue = '';
    if (this.oncontextmenu) {
      this.oncontextmenu(evt);
    }
  }
  static cursor(cursorType) {
    document.body.setAttribute('style', 'cursor: ' + cursorType + ';');
  }
  hoverButtons(evt) {
    var canvasRect = this._viewportCanvas.getBoundingClientRect();
    var buttons = this.getRenderablesOfType(Button);
    var calcXY = new Coord(evt.pageX - canvasRect.x, evt.pageY - canvasRect.y);
    if (calcXY.x <= canvasRect.width && calcXY.y <= canvasRect.height) {
      var buttonHover = false;
      buttons.forEach((function(button) {
        if (this._scene == button.scene && button.shouldRender() && button.isActive()) {
          if (button.handleHover(evt, calcXY)) {
            buttonHover = true;
          }
        }
      }).bind(this));
      if (!buttonHover) {
        GameLib.cursor("default");
      }
    }
  }
  checkButtons(evt) {
    var canvasRect = this._viewportCanvas.getBoundingClientRect();
    var buttons = this.getRenderablesOfType(Button);
    var calcXY = new Coord(evt.clientX - canvasRect.x, evt.clientY - canvasRect.y);
    if (calcXY.x <= canvasRect.width && calcXY.y <= canvasRect.height) {
      var buttonClicked = false;
      buttons.forEach((function(button) {
        if (!buttonClicked && this._scene == button.scene && button.shouldRender() && button.isActive()) {
          if (button.handleClick(evt, calcXY)) {
            buttonClicked = true;
          }
        }
      }).bind(this));
      this.hoverButtons(evt);
    }
  }
  setScene(scene) {
    this._scene = scene;
    GameLib.cursor("default");
  }
  getScene() {
    return this._scene;
  }
  static getContext(canvas) {
    return canvas.getContext('2d', {
      'willReadFrequently': true
    });
  }
  static spriteImage(sprite, url) {
    var image = new Image();
    image.onload = (function() {
      sprite.image = image;
    }).bind(this);
    image.src = url;
  }
  setActive(active) {
    this._active = active;
  }
  setRendering(rendering) {
    this._rendering = rendering;
  }
  addRenderable(renderable) {
    if (renderable instanceof Renderable) {
      this._renderables.push(renderable);
    } else {
      throw new GameLibCore.Error("Parameter renderable must be an instance of Renderable");
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
    if (!(sprite instanceof Sprite)) {
      throw new GameLibCore.Error("Parameter sprite must be an instance of Sprite!");
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
  clearRenderablesOfType(renderableClass) {
    this._renderables = this._renderables.filter(renderable => !(renderable instanceof renderableClass));
  }
  addSprite(sprite) {
    if (sprite instanceof Sprite) {
      this._sprites.push(sprite);
    } else {
      throw new GameLibCore.Error("Parameter sprite must be an instance of Sprite");
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
  stopLoading() {
    this._scene = "init";
  }
  update() {
    if (!this._active) {
      return;
    }
    this.callHook('pre-update');
    this._sprites.forEach((function(sprite) {
      if (this._scene == sprite.scene) {
        sprite.update();
      }
    }).bind(this));
    this.callHook('post-update');
  }
  setBackground(image, scene, repeat = "repeat") {
    this._background[scene] = this._renderCtx.createPattern(image, repeat);
  }
  setClearColor(color) {
    this.clearColor = color;
  }
  renderBackground() {
    if (this._background[this._scene] != null) {
      this._renderCtx.fillStyle = this._background[this._scene];
      this._renderCtx.fillRect(0, 0, this._renderCanvas.width, this._renderCanvas.height);
    }
  }
  drawGrid(size, color) {
    this._renderCtxstrokeStyle = color;
    for (var i = 0; i < this._renderCanvas.height; i += size) {
      this._renderCtxbeginPath();
      this._renderCtxmoveTo(0, i);
      this._renderCtxlineTo(this._renderCanvas.width, i);
      this._renderCtxclosePath();
      this._renderCtxstroke();
    }
    for (var i = 0; i < this._renderCanvas.width; i += size) {
      this._renderCtxbeginPath();
      this._renderCtxmoveTo(i, 0);
      this._renderCtxlineTo(i, this._renderCanvas.height);
      this._renderCtxclosePath();
      this._renderCtxstroke();
    }
  }
  draw() {
    if (!this._rendering) {
      return;
    }
    this.clearCanvas(false);
    this.callHook('pre-render');
    this.renderBackground();
    this._sprites.forEach((function(sprite) {
      if (sprite.checkCollision(this._viewport)) {
        if (this._scene == sprite.scene) {
          sprite.draw();
        }
      }
    }).bind(this));
    this._renderables.forEach((function(renderable) {
      if (!renderable.overlay) {
        if (renderable.isActive()) {
          if (renderable.shouldRender()) {
            if (this._scene == renderable.scene) {
              renderable.draw();
            }
          }
        }
      }
    }).bind(this));
    this.callHook('post-render');
    this.renderViewport();
    this._renderables.forEach((function(renderable) {
      if (renderable.overlay) {
        if (renderable.isActive()) {
          if (renderable.shouldRender()) {
            if (this._scene == renderable.scene) {
              renderable.draw();
            } else {
              renderable.overlaySkipped();
            }
          } else {
            renderable.overlaySkipped();
          }
        } else {
          renderable.overlaySkipped();
        }
      }
    }).bind(this));
    if (this._scene == "loading") {
      Loading.render(this._viewportCanvas, this._viewportCtx, this._loadingScreen);
    }
  }
  registerMainloop() {
    window.requestAnimationFrame(this.mainloop.bind(this));
  }
  setLoadingScreen(config) {
    this._loadingScreen = config;
  }
}
export {
  GameLib
}

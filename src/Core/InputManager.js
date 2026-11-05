import { GameLibCore } from "./index.js"
class InputManager {
  constructor() {
    if (GameLibCore.InputManager._instance) {
      return GameLibCore.InputManager._instance;
    } else {
      console.log("[GameLib] No InputManager instance found. Creating new instance...");
      this._keys = [];
      this._keyBinds = {};
      this._keyBindCallbacks = {};
      this._active = false;
      this._mouseX = -1;
      this._mouseY = -1;
      this._mouseListeners = [];
      this.bindEvents();
      GameLibCore.InputManager._instance = this;
    }
  }
  static KEYS = {
    'ESCAPE': 27,
    'BACKTICK': 192,
    'ONE': 49,
    'TWO': 50,
    'THREE': 51,
    'FOUR': 52,
    'FIVE': 53,
    'SIX': 54,
    'SEVEN': 55,
    'EIGHT': 56,
    'NINE': 57,
    'ZERO': 48,
    'MINUS': 189,
    'EQUALS': 187,
    'TAB': 9,
    'LEFTBRACKET': 219,
    'RIGHTBRACKET': 221,
    'BACKSLASH': 220,
    'META': 91,
    'SEMICOLON': 186,
    'APOSTROPE': 222,
    'ENTER': 13,
    'SHIFT': 16,
    'COMMA': 188,
    'PERIOD': 190,
    'SLASH': 191,
    'CONTROL': 17,
    'ALT': 18,
    'UP': 38,
    'DOWN': 40,
    'LEFT': 37,
    'RIGHT': 39,
    'SPACE': 32,
    'A': 65,
    'B': 66,
    'C': 67,
    'D': 68,
    'E': 69,
    'F': 70,
    'G': 71,
    'H': 72,
    'I': 73,
    'J': 74,
    'K': 75,
    'L': 76,
    'M': 77,
    'N': 78,
    'O': 79,
    'P': 80,
    'Q': 81,
    'R': 82,
    'S': 83,
    'W': 87,
    'X': 88,
    'Y': 89,
    'Z': 90
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
    this._keys = this._keys.filter(key => key != evt.keyCode);
    this._triggerKeyBind(evt.keyCode, 'up');
  }
  keyDown(evt) {
    if (!this._active) {
      return;
    }
    if (this._keys.indexOf(evt.keyCode) == -1) {
      this._keys.push(evt.keyCode);
    }
    this._triggerKeyBind(evt.keyCode, 'down');
  }
  _fireMouseListener(type) {
    for (var i = 0; i < this._mouseListeners.length; i++) {
      var listener = this._mouseListeners[i];
      if (listener.type === type) {
        if (listener.callback && typeof listener.callback === "function") {
          listener.callback();
        }
      }
    }
  }
  mouseMove(evt) {
    this._mouseX = evt.clientX;
    this._mouseY = evt.clientY;
    this._fireMouseListener('move');
  }
  mouseDown(evt) {
    this._mouseX = evt.clientX;
    this._mouseY = evt.clientY;
    this._fireMouseListener('down');
  }
  mouseUp(evt) {
    this._mouseX = evt.clientX;
    this._mouseY = evt.clientY;
    this._fireMouseListener('up');
  }
  click(evt) {
    this._mouseX = evt.clientX;
    this._mouseY = evt.clientY;
    this._fireMouseListener('click');
  }
  getMousePos() {
    return [this._mouseX, this._mouseY];
  }
  getCanvasMousePos(canvas) {
    var boundingRect = canvas.getBoundingClientRect();
    return [this._mouseX - boundingRect.x, this._mouseY - boundingRect.y];
  }
  _callBind(keyBindName) {
    if (this._keyBindCallbacks[keyBindName]) {
      for (var i = 0; i < this._keyBindCallbacks[keyBindName].length; i++) {
        var bindCallback = this._keyBindCallbacks[keyBindName][i];
        if (bindCallback && typeof bindCallback === "function") bindCallback();
      }
    }
  }
  _triggerKeyBind(key, type) {
    if (this._keyBinds[key]) {
      for (var i = 0; i < this._keyBinds.length; i++) {
        var keyBind = this._keyBinds[i];
        if (keyBind.type === type) {
          this.__callBind(this._keyBinds[i].name);
        }
      }
    }
  }
  isKeyDown(key) {
    return (this._keys.indexOf(key) != -1);
  }
  bindKey(key, type, name) {
    if (!this._keyBinds[key]) this._keyBinds[key] = [];
    this._keyBinds[key].push({
      name: name,
      type: type
    });
  }
  registerKeyBindCallback(name, callback) {
    if (!this._keyBindCallbacks[name]) this._keyBindCallbacks[name] = [];
    this._keyBindCallbacks[name].push({ callback: callback });
  }
  static isKeyDown(key) {
    if (GameLibCore.InputManager._instance != null) {
      return (GameLibCore.InputManager._instance._keys.indexOf(key) != -1);
    } else {
      throw new GameLibCore.Error("An InputManager instance must exist to use GameLibCore.InputManager.isKeyDown(key)!");
    }
  }
  addMouseListener(type, callback) {
    this._mouseListeners.push({
      type: type,
      callback: callback
    });
  }
  bindEvents() {
    window.addEventListener('keyup', this.keyUp.bind(this), false);
    window.addEventListener('keydown', this.keyDown.bind(this), false);
    window.addEventListener('mousemove', this.mouseMove.bind(this), false);
    window.addEventListener('mousedown', this.mouseDown.bind(this), false);
    window.addEventListener('mouseup', this.mouseUp.bind(this), false);
    window.addEventListener('click', this.click.bind(this), false);
  }
}
export {
  InputManager
}

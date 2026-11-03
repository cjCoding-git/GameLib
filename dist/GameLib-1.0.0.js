(() => {
  // src/Core/Error.js
  var GameLibError = class extends Error {
    constructor(message, options) {
      super(message);
      this.name = this.constructor.name;
    }
  };

  // src/Core/InputManager.js
  var InputManager = class {
    constructor() {
      if (GameLibCore.InputManager._instance) {
        return GameLibCore.InputManager._instance;
      } else {
        console.log("[GameLib] No InputManager instance found. Creating new instance...");
        this._keys = [];
        this._active = false;
        this.bindEvents();
        GameLibCore.InputManager._instance = this;
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
      if (GameLibCore.InputManager._instance != null) {
        return GameLibCore.InputManager._instance._keys.indexOf(key2) != -1;
      } else {
        throw new GameLibCore.Error("An InputManager instance must exist to use GameLibCore.InputManager.isKeyDown(key)!");
      }
    }
    bindEvents() {
      window.addEventListener("keyup", this.keyUp.bind(this), false);
      window.addEventListener("keydown", this.keyDown.bind(this), false);
    }
  };

  // src/Core/Utils.js
  var Utils = class {
    constructor() {
      throw new GameLibCore.Error("Class Utils may not be constructed!");
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
  var GameLibCore = class {
    constructor() {
      throw new GameLibError("Class GameLibCore may not be constructed!");
    }
    static Error = GameLibError;
    static Utils = Utils;
    static InputManager = InputManager;
    static AudioManager = void 0;
  };

  // src/2D/index.js
  var GameLib2D = class {
  };

  // src/3D/index.js
  var GameLib3D = class {
  };

  // src/index.js
  var libraryExports = {
    GameLibCore,
    GameLib2D,
    GameLib3D
  };
  for (i = 0; i < Object.keys(libraryExports).length; i++) {
    key = Object.keys(libraryExports)[i];
    self[key] = libraryExports[key];
  }
  var key;
  var i;
})();

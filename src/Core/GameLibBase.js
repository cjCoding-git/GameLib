class GameLibBase {
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
    if(!this._hooks[event]) {
      this._hooks[event] = [];
    }
    this._hooks[event].push(hook);
  }
  callHook(type) {
    if(!this._hooks[type]) return;
    var hooks = this._hooks[type];
    for(var i=0;i<hooks;i++) {
      hooks[i]();
    }
  }
}
export {
  GameLibBase
}

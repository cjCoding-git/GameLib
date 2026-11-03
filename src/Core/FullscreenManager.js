class FullscreenManager {
  constructor() {
    this._fullscreen = 0;
		this._pointerLocked = false;
		this.bindEvents();
  }
	bindEvents() {
		window.addEventListener('click', this.fullscreen.bind(this), false);
	}
}
export {
  FullscreenManager
}

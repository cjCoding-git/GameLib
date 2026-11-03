class FullscreenManager {
  constructor() {
    this._fullscreen = 0;
	this._pointerLocked = false;
	this.bindEvents();
  }
	bindEvents() {
		window.addEventListener('click', this.fullscreen.bind(this), false);
	}
	async fullscreen() {
		if(this._pointerLocked && document.pointerLockElement == null) {
			document.documentElement.requestPointerLock().catch(function(err) {});
		}
		if(this._fullscreen > 0 && document.fullscreenElement == null) {
			document.documentElement.requestFullscreen().catch(function(err) {});
		}
		if(this._fullscreen == 2 && document.fullscreenElement == null) {
			try {
				await navigator.keyboard.lock(['Escape']);
			} catch(err) {}
		}
	}
	setFullscreen(isFullscreen, locked=false) {
		if(isFullscreen) {
			document.documentElement.requestFullscreen();
			if(locked) {
				this._fullscreen = 2;
				navigator.keyboard.lock(['Escape']);
			} else {
				this._fullscreen = 1;
			}
		} else {
			this._fullscreen = 0;
			document.exitFullscreen();
		}
	}
	setPointerLocked(isLocked) {
		if(isLocked == true) {
			this._pointerLocked = true;
			document.documentElement.requestPointerLock();
		} else {
			this._pointerLocked = false;
			document.exitPointerLock();
		}
	}
}
export {
  FullscreenManager
}

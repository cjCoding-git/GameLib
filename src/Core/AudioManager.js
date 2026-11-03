import { GameLibCore } from "src/Core/index.js"
class AudioManager {
  constructor() {
    if(GameLibCore.AudioManager._instance) {
      return GameLibCore.AudioManager._instance;
    } else {
      console.log("[GameLib] No AudioManager instance found. Creating new instance...");
      this._musicPool = [];
      this._currentMusic = null;
      this._musicPaused = true;
      this.bindEvents();
      GameLibCore.AudioManager._instance = this;
    }
  }
  bindEvents() {
    window.addEventListener('click', this.resumeMusic.bind(this), false);
    document.addEventListener('visibilitychange', this.visibilityChange.bind(this), false);
  }
  visibilityChange() {
    if (document.visibilityState != 'visible') {
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
    audio.onended = (this.nextSong).bind(this);
    audio.src = url;
    audio.pause();
    this._musicPool.push(audio);
  }
  nextSong() {
    if (this._musicPool.length <= 0) {
      throw new GameLibCore.Error("Music Pool is empty!");
      return;
    }
    if (this._currentMusic != null) {
      this._currentMusic.pause();
    }
    this._currentMusic = GameLibCore.Utils.getRandomListItem(this._musicPool);
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
}

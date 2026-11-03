import { GameLibCore } from "./index.js"
class AudioManager {
  constructor() {
    if (GameLibCore.AudioManager._instance) {
      return GameLibCore.AudioManager._instance;
    } else {
      console.log("[GameLib] No AudioManager instance found. Creating new instance...");
      this._musicPool = [];
      this._loopingSoundPool = {};
      this._sfxPool = {};
      this._activeLoopingSoundPool = {};
      this._currentMusic = null;
      this._musicPaused = true;
      this._audioCtx = new AudioContext();
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
      this._audioCtx.suspend();
    } else {
      this._audioCtx.resume();
    }
  }
  async loadLoopingSound(name, url) {
    var resp = await fetch(url);
    var ab = await resp.arrayBuffer();
    this._loopingSoundPool[name] = await this._audioCtx.decodeAudioData(ab);
  }
  playLoopingSound(name) {
    if (this._loopingSoundPool[name] != null) {
      var source = this._audioCtx.createBufferSource();
      source.loop = true;
      source.buffer = this._loopingSoundPool[name];
      source.connect(this._audioCtx.destination);
      this._activeLoopingSoundPool[name] = source;
      source.start(0);
    } else {
      console.warn("[GameLib] Attempted to play a looping sound that does not exist!");
    }
  }
  stopLoopingSound(name) {
    if (this._activeLoopingSoundPool[name] != null) {
      this._activeLoopingSoundPool[name].stop();
      delete this._activeLoopingSoundPool[name];
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
  async loadSfx(name, url) {
    var resp = await fetch(url);
    var ab = await resp.arrayBuffer();
    this._sfxPool[name] = await this._audioCtx.decodeAudioData(ab);
  }
  playSfx(name, speed = 1, gain = 1.5) {
    if (this._sfxPool[name]) {
      var source = this._audioCtx.createBufferSource();
      source.buffer = this._sfxPool[name];
      source.playbackRate.value = speed;
      var gainNode = this._audioCtx.createGain();
      gainNode.gain.setValueAtTime(gain, 0);
      gainNode.connect(this._audioCtx.destination);
      source.connect(gainNode);
      source.start(0);
    } else {
      console.warn("[GameLib] Attempted to play SFX that does not exist!");
    }
  }
}
export {
  AudioManager
}

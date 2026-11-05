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
      this._musicSource = null;
      this._musicOffset = 0;
      this._musicStartedAt = 0;
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
    var data = await GameLibCore.AssetManager.shared.loadArrayBuffer(url);
    this._loopingSoundPool[name] = await this._audioCtx.decodeAudioData(data.slice(0));
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
  async addSong(url) {
    var data = await GameLibCore.AssetManager.shared.loadArrayBuffer(url);
    var buffer = await this._audioCtx.decodeAudioData(data.slice(0));
    this._musicPool.push(buffer);
  }
  stopCurrentMusicSource() {
    if (this._musicSource != null) {
      this._musicSource.onended = null;
      try {
        this._musicSource.stop();
      } catch (error) {
        // The source may have already ended.
      }
      this._musicSource.disconnect();
      this._musicSource = null;
    }
  }
  startCurrentMusic() {
    if (this._currentMusic == null || this._musicPaused || this._musicSource != null) {
      return;
    }

    var source = this._audioCtx.createBufferSource();
    source.buffer = this._currentMusic;
    source.connect(this._audioCtx.destination);
    source.onended = () => {
      if (this._musicSource === source) {
        this._musicSource = null;
        this._musicOffset = 0;
        if (!this._musicPaused) {
          this.nextSong();
        }
      }
    };

    this._musicSource = source;
    this._musicStartedAt = this._audioCtx.currentTime;
    source.start(0, this._musicOffset);
  }
  nextSong() {
    if (this._musicPool.length <= 0) {
      throw new GameLibCore.Error("Music Pool is empty!");
    }

    this.stopCurrentMusicSource();
    this._currentMusic = GameLibCore.Utils.getRandomListItem(this._musicPool);
    this._musicOffset = 0;
    this.startCurrentMusic();
  }
  async playMusic() {
    this._musicPaused = false;

    if (this._currentMusic == null) {
      if (this._musicPool.length <= 0) {
        this._musicPaused = true;
        throw new GameLibCore.Error("Music Pool is empty!");
      }
      this._currentMusic = GameLibCore.Utils.getRandomListItem(this._musicPool);
      this._musicOffset = 0;
    }

    if (this._audioCtx.state === 'suspended') {
      await this._audioCtx.resume();
    }
    this.startCurrentMusic();
  }
  async resumeMusic() {
    if (this._audioCtx.state === 'suspended') {
      await this._audioCtx.resume();
    }
    if (!this._musicPaused) {
      this.startCurrentMusic();
    }
  }
  pauseMusic() {
    this._musicPaused = true;
    if (this._musicSource != null) {
      this._musicOffset += this._audioCtx.currentTime - this._musicStartedAt;
      this._musicOffset %= this._currentMusic.duration;
      this.stopCurrentMusicSource();
    }
  }
  async loadSfx(name, url) {
    var data = await GameLibCore.AssetManager.shared.loadArrayBuffer(url);
    this._sfxPool[name] = await this._audioCtx.decodeAudioData(data.slice(0));
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

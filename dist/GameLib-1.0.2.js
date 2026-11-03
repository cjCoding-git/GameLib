(() => {
  // src/Core/Error.js
  var GameLibError = class extends Error {
    constructor(message, options) {
      super(message);
      this.name = "GameLibError";
    }
  };

  // src/Core/InputManager.js
  var InputManager = class {
    constructor() {
      if (GameLibCore2.InputManager._instance) {
        return GameLibCore2.InputManager._instance;
      } else {
        console.log("[GameLib] No InputManager instance found. Creating new instance...");
        this._keys = [];
        this._active = false;
        this.bindEvents();
        GameLibCore2.InputManager._instance = this;
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
      if (GameLibCore2.InputManager._instance != null) {
        return GameLibCore2.InputManager._instance._keys.indexOf(key2) != -1;
      } else {
        throw new GameLibCore2.Error("An InputManager instance must exist to use GameLibCore.InputManager.isKeyDown(key)!");
      }
    }
    bindEvents() {
      window.addEventListener("keyup", this.keyUp.bind(this), false);
      window.addEventListener("keydown", this.keyDown.bind(this), false);
    }
  };

  // src/Core/AudioManager.js
  var AudioManager = class {
    constructor() {
      if (GameLibCore2.AudioManager._instance) {
        return GameLibCore2.AudioManager._instance;
      } else {
        console.log("[GameLib] No AudioManager instance found. Creating new instance...");
        this._musicPool = [];
        this._loopingSoundPool = {};
        this._sfxPool = {};
        this._activeLoopingSoundPool = {};
        this._currentMusic = null;
        this._musicPaused = true;
        this.bindEvents();
        GameLibCore2.AudioManager._instance = this;
      }
    }
    bindEvents() {
      window.addEventListener("click", this.resumeMusic.bind(this), false);
      document.addEventListener("visibilitychange", this.visibilityChange.bind(this), false);
    }
    visibilityChange() {
      if (document.visibilityState != "visible") {
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
        console.warn("[GameLib] Attempted to play a looping sound that does not exits!");
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
      audio.onended = this.nextSong.bind(this);
      audio.src = url;
      audio.pause();
      this._musicPool.push(audio);
    }
    nextSong() {
      if (this._musicPool.length <= 0) {
        throw new GameLibCore2.Error("Music Pool is empty!");
        return;
      }
      if (this._currentMusic != null) {
        this._currentMusic.pause();
      }
      this._currentMusic = GameLibCore2.Utils.getRandomListItem(this._musicPool);
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
        console.warn("[GameLib] Attempted to play SFX that does not exit!");
      }
    }
  };

  // src/Core/Utils.js
  var Utils = class _Utils {
    constructor() {
      throw new GameLibCore2.Error("Class Utils may not be constructed!");
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
    static getRandomInt(min2, max2) {
      return Math.floor(Math.random() * (max2 - min2)) + min2;
    }
    static getRandomDigits(numberOfDigits) {
      var digits = "0123456789";
      var resultString = "";
      for (var i2 = 0; i2 < numberOfDigits; i2++) {
        var randomNumber = _Utils.getRandomInt(0, digits.length);
        var newDigit = digits.substring(randomNumber, randomNumber + 1);
        resultString += newDigit;
      }
      return resultString;
    }
  };

  // src/Core/GameLibBase.js
  var GameLibBase = class {
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
      if (!this._hooks[event]) {
        this._hooks[event] = [];
      }
      this._hooks[event].push(hook);
    }
    callHook(type) {
      if (!this._hooks[type]) return;
      var hooks = this._hooks[type];
      for (var i2 = 0; i2 < hooks; i2++) {
        hooks[i2]();
      }
    }
  };

  // src/Core/Storage.js
  var Storage = class {
    constructor(name, ...stores) {
      this._idb = indexedDB.open(name, 1);
      this._name = name;
      this._storeList = stores;
      this._stores = {};
      this._storeList.forEach((function(store) {
        this._stores[store.name] = store;
        store.setStorage(this);
      }).bind(this));
      this.onload = null;
      this._idb.onupgradeneeded = (function(evt) {
        this._storeList.forEach((function(store) {
          var objStore = evt.currentTarget.result.createObjectStore(store.name, { "keyPath": "key", "autoIncrement": false });
          objStore.createIndex("key", "key", { "unique": true });
          store.indexes.forEach((function(index) {
            objStore.createIndex(index, index, { "unique": false });
          }).bind(this));
        }).bind(this));
      }).bind(this);
      this._db = null;
      this._idb.onsuccess = (function(evt) {
        this._db = evt.target.result;
        this._storeList.forEach((function(store) {
          store.setGet(function(storeName) {
            var tx = this._storage._db.transaction(storeName, "readwrite");
            return tx.objectStore(storeName);
          });
        }));
        console.log("[GameLib] Initialized Database: " + this._name);
        if (this.onload) {
          this.onload();
        }
      }).bind(this);
    }
    delete() {
      indexedDB.deleteDatabase(this._name);
    }
    getStore(storeName) {
      return this._stores[storeName];
    }
  };

  // src/Core/Store.js
  var Store = class {
    constructor(name, ...indexes) {
      this._name = name;
      this._indexes = indexes;
      this._get = null;
      this._storage = null;
    }
    get name() {
      return this._name;
    }
    get indexes() {
      return this._indexes;
    }
    setStorage(storage) {
      this._storage = storage;
    }
    setGet(func) {
      this._get = func;
    }
    set(json) {
      this._get(this._name).put(json);
    }
    delete(key2) {
      this._get(this._name).delete(key2);
    }
    add(json) {
      this._get(this._name).add(json);
    }
    get(key2) {
      return new Promise((function(resolve, reject) {
        this._get(this._name).get(key2).onsuccess = function(evt) {
          if (evt.target.result) {
            resolve(evt.target.result.value);
          } else {
            resolve(null);
          }
        };
      }).bind(this));
    }
  };

  // src/Core/FullscreenManager.js
  var FullscreenManager = class {
    constructor() {
      this._fullscreen = 0;
      this._pointerLocked = false;
      this.bindEvents();
    }
    bindEvents() {
      window.addEventListener("click", this.fullscreen.bind(this), false);
    }
    async fullscreen() {
      if (this._pointerLocked && document.pointerLockElement == null) {
        document.documentElement.requestPointerLock().catch(function(err) {
        });
      }
      if (this._fullscreen > 0 && document.fullscreenElement == null) {
        document.documentElement.requestFullscreen().catch(function(err) {
        });
      }
      if (this._fullscreen == 2 && document.fullscreenElement == null) {
        try {
          await navigator.keyboard.lock(["Escape"]);
        } catch (err) {
        }
      }
    }
    setFullscreen(isFullscreen, locked = false) {
      if (isFullscreen) {
        document.documentElement.requestFullscreen();
        if (locked) {
          this._fullscreen = 2;
          navigator.keyboard.lock(["Escape"]);
        } else {
          this._fullscreen = 1;
        }
      } else {
        this._fullscreen = 0;
        document.exitFullscreen();
      }
    }
    setPointerLocked(isLocked) {
      if (isLocked == true) {
        this._pointerLocked = true;
        document.documentElement.requestPointerLock();
      } else {
        this._pointerLocked = false;
        document.exitPointerLock();
      }
    }
  };

  // src/Lib/PeerJS.js
  function $parcel$export(e, n, v, s) {
    Object.defineProperty(e, n, { get: v, set: s, enumerable: true, configurable: true });
  }
  function $parcel$interopDefault(a) {
    return a && a.__esModule ? a.default : a;
  }
  var $616ebdf1c4998439$export$f1c5f4c9cb95390b = class {
    constructor() {
      this.chunkedMTU = 16300;
      this._dataCount = 1;
      this.chunk = (blob) => {
        const chunks = [];
        const size = blob.byteLength;
        const total = Math.ceil(size / this.chunkedMTU);
        let index = 0;
        let start = 0;
        while (start < size) {
          const end = Math.min(size, start + this.chunkedMTU);
          const b = blob.slice(start, end);
          const chunk = {
            __peerData: this._dataCount,
            n: index,
            data: b,
            total
          };
          chunks.push(chunk);
          start = end;
          index++;
        }
        this._dataCount++;
        return chunks;
      };
    }
  };
  function $616ebdf1c4998439$export$52c89ebcdc4f53f2(bufs) {
    let size = 0;
    for (const buf of bufs) size += buf.byteLength;
    const result = new Uint8Array(size);
    let offset = 0;
    for (const buf of bufs) {
      result.set(buf, offset);
      offset += buf.byteLength;
    }
    return result;
  }
  var $bf7fb46c6d68ead7$var$$e8379818650e2442$export$93654d4f2d6cd524 = class {
    append_buffer(data) {
      this.flush();
      this._parts.push(data);
    }
    append(data) {
      this._pieces.push(data);
    }
    flush() {
      if (this._pieces.length > 0) {
        const buf = new Uint8Array(this._pieces);
        this._parts.push(buf);
        this._pieces = [];
      }
    }
    toArrayBuffer() {
      const buffer = [];
      for (const part of this._parts) buffer.push(part);
      return $bf7fb46c6d68ead7$var$$e8379818650e2442$var$concatArrayBuffers(buffer).buffer;
    }
    constructor() {
      this.encoder = new TextEncoder();
      this._pieces = [];
      this._parts = [];
    }
  };
  function $bf7fb46c6d68ead7$var$$e8379818650e2442$var$concatArrayBuffers(bufs) {
    let size = 0;
    for (const buf of bufs) size += buf.byteLength;
    const result = new Uint8Array(size);
    let offset = 0;
    for (const buf of bufs) {
      const view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      result.set(view, offset);
      offset += buf.byteLength;
    }
    return result;
  }
  function $bf7fb46c6d68ead7$export$417857010dc9287f(data) {
    const unpacker = new $bf7fb46c6d68ead7$var$$0cfd7828ad59115f$var$Unpacker(data);
    return unpacker.unpack();
  }
  function $bf7fb46c6d68ead7$export$2a703dbb0cb35339(data) {
    const packer = new $bf7fb46c6d68ead7$export$b9ec4b114aa40074();
    const res = packer.pack(data);
    if (res instanceof Promise) return res.then(() => packer.getBuffer());
    return packer.getBuffer();
  }
  var $bf7fb46c6d68ead7$var$$0cfd7828ad59115f$var$Unpacker = class {
    unpack() {
      const type = this.unpack_uint8();
      if (type < 128) return type;
      else if ((type ^ 224) < 32) return (type ^ 224) - 32;
      let size;
      if ((size = type ^ 160) <= 15) return this.unpack_raw(size);
      else if ((size = type ^ 176) <= 15) return this.unpack_string(size);
      else if ((size = type ^ 144) <= 15) return this.unpack_array(size);
      else if ((size = type ^ 128) <= 15) return this.unpack_map(size);
      switch (type) {
        case 192:
          return null;
        case 193:
          return void 0;
        case 194:
          return false;
        case 195:
          return true;
        case 202:
          return this.unpack_float();
        case 203:
          return this.unpack_double();
        case 204:
          return this.unpack_uint8();
        case 205:
          return this.unpack_uint16();
        case 206:
          return this.unpack_uint32();
        case 207:
          return this.unpack_uint64();
        case 208:
          return this.unpack_int8();
        case 209:
          return this.unpack_int16();
        case 210:
          return this.unpack_int32();
        case 211:
          return this.unpack_int64();
        case 212:
          return void 0;
        case 213:
          return void 0;
        case 214:
          return void 0;
        case 215:
          return void 0;
        case 216:
          size = this.unpack_uint16();
          return this.unpack_string(size);
        case 217:
          size = this.unpack_uint32();
          return this.unpack_string(size);
        case 218:
          size = this.unpack_uint16();
          return this.unpack_raw(size);
        case 219:
          size = this.unpack_uint32();
          return this.unpack_raw(size);
        case 220:
          size = this.unpack_uint16();
          return this.unpack_array(size);
        case 221:
          size = this.unpack_uint32();
          return this.unpack_array(size);
        case 222:
          size = this.unpack_uint16();
          return this.unpack_map(size);
        case 223:
          size = this.unpack_uint32();
          return this.unpack_map(size);
      }
    }
    unpack_uint8() {
      const byte = this.dataView[this.index] & 255;
      this.index++;
      return byte;
    }
    unpack_uint16() {
      const bytes = this.read(2);
      const uint16 = (bytes[0] & 255) * 256 + (bytes[1] & 255);
      this.index += 2;
      return uint16;
    }
    unpack_uint32() {
      const bytes = this.read(4);
      const uint32 = ((bytes[0] * 256 + bytes[1]) * 256 + bytes[2]) * 256 + bytes[3];
      this.index += 4;
      return uint32;
    }
    unpack_uint64() {
      const bytes = this.read(8);
      const uint64 = ((((((bytes[0] * 256 + bytes[1]) * 256 + bytes[2]) * 256 + bytes[3]) * 256 + bytes[4]) * 256 + bytes[5]) * 256 + bytes[6]) * 256 + bytes[7];
      this.index += 8;
      return uint64;
    }
    unpack_int8() {
      const uint8 = this.unpack_uint8();
      return uint8 < 128 ? uint8 : uint8 - 256;
    }
    unpack_int16() {
      const uint16 = this.unpack_uint16();
      return uint16 < 32768 ? uint16 : uint16 - 65536;
    }
    unpack_int32() {
      const uint32 = this.unpack_uint32();
      return uint32 < 2 ** 31 ? uint32 : uint32 - 2 ** 32;
    }
    unpack_int64() {
      const uint64 = this.unpack_uint64();
      return uint64 < 2 ** 63 ? uint64 : uint64 - 2 ** 64;
    }
    unpack_raw(size) {
      if (this.length < this.index + size) throw new Error(`BinaryPackFailure: index is out of range ${this.index} ${size} ${this.length}`);
      const buf = this.dataBuffer.slice(this.index, this.index + size);
      this.index += size;
      return buf;
    }
    unpack_string(size) {
      const bytes = this.read(size);
      let i2 = 0;
      let str2 = "";
      let c;
      let code;
      while (i2 < size) {
        c = bytes[i2];
        if (c < 160) {
          code = c;
          i2++;
        } else if ((c ^ 192) < 32) {
          code = (c & 31) << 6 | bytes[i2 + 1] & 63;
          i2 += 2;
        } else if ((c ^ 224) < 16) {
          code = (c & 15) << 12 | (bytes[i2 + 1] & 63) << 6 | bytes[i2 + 2] & 63;
          i2 += 3;
        } else {
          code = (c & 7) << 18 | (bytes[i2 + 1] & 63) << 12 | (bytes[i2 + 2] & 63) << 6 | bytes[i2 + 3] & 63;
          i2 += 4;
        }
        str2 += String.fromCodePoint(code);
      }
      this.index += size;
      return str2;
    }
    unpack_array(size) {
      const objects = new Array(size);
      for (let i2 = 0; i2 < size; i2++) objects[i2] = this.unpack();
      return objects;
    }
    unpack_map(size) {
      const map = {};
      for (let i2 = 0; i2 < size; i2++) {
        const key2 = this.unpack();
        map[key2] = this.unpack();
      }
      return map;
    }
    unpack_float() {
      const uint32 = this.unpack_uint32();
      const sign = uint32 >> 31;
      const exp2 = (uint32 >> 23 & 255) - 127;
      const fraction = uint32 & 8388607 | 8388608;
      return (sign === 0 ? 1 : -1) * fraction * 2 ** (exp2 - 23);
    }
    unpack_double() {
      const h32 = this.unpack_uint32();
      const l32 = this.unpack_uint32();
      const sign = h32 >> 31;
      const exp2 = (h32 >> 20 & 2047) - 1023;
      const hfrac = h32 & 1048575 | 1048576;
      const frac = hfrac * 2 ** (exp2 - 20) + l32 * 2 ** (exp2 - 52);
      return (sign === 0 ? 1 : -1) * frac;
    }
    read(length2) {
      const j = this.index;
      if (j + length2 <= this.length) return this.dataView.subarray(j, j + length2);
      else throw new Error("BinaryPackFailure: read index out of range");
    }
    constructor(data) {
      this.index = 0;
      this.dataBuffer = data;
      this.dataView = new Uint8Array(this.dataBuffer);
      this.length = this.dataBuffer.byteLength;
    }
  };
  var $bf7fb46c6d68ead7$export$b9ec4b114aa40074 = class {
    getBuffer() {
      return this._bufferBuilder.toArrayBuffer();
    }
    pack(value) {
      if (typeof value === "string") this.pack_string(value);
      else if (typeof value === "number") {
        if (Math.floor(value) === value) this.pack_integer(value);
        else this.pack_double(value);
      } else if (typeof value === "boolean") {
        if (value === true) this._bufferBuilder.append(195);
        else if (value === false) this._bufferBuilder.append(194);
      } else if (value === void 0) this._bufferBuilder.append(192);
      else if (typeof value === "object") {
        if (value === null) this._bufferBuilder.append(192);
        else {
          const constructor = value.constructor;
          if (value instanceof Array) {
            const res = this.pack_array(value);
            if (res instanceof Promise) return res.then(() => this._bufferBuilder.flush());
          } else if (value instanceof ArrayBuffer) this.pack_bin(new Uint8Array(value));
          else if ("BYTES_PER_ELEMENT" in value) {
            const v = value;
            this.pack_bin(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
          } else if (value instanceof Date) this.pack_string(value.toString());
          else if (value instanceof Blob) return value.arrayBuffer().then((buffer) => {
            this.pack_bin(new Uint8Array(buffer));
            this._bufferBuilder.flush();
          });
          else if (constructor == Object || constructor.toString().startsWith("class")) {
            const res = this.pack_object(value);
            if (res instanceof Promise) return res.then(() => this._bufferBuilder.flush());
          } else throw new Error(`Type "${constructor.toString()}" not yet supported`);
        }
      } else throw new Error(`Type "${typeof value}" not yet supported`);
      this._bufferBuilder.flush();
    }
    pack_bin(blob) {
      const length2 = blob.length;
      if (length2 <= 15) this.pack_uint8(160 + length2);
      else if (length2 <= 65535) {
        this._bufferBuilder.append(218);
        this.pack_uint16(length2);
      } else if (length2 <= 4294967295) {
        this._bufferBuilder.append(219);
        this.pack_uint32(length2);
      } else throw new Error("Invalid length");
      this._bufferBuilder.append_buffer(blob);
    }
    pack_string(str2) {
      const encoded = this._textEncoder.encode(str2);
      const length2 = encoded.length;
      if (length2 <= 15) this.pack_uint8(176 + length2);
      else if (length2 <= 65535) {
        this._bufferBuilder.append(216);
        this.pack_uint16(length2);
      } else if (length2 <= 4294967295) {
        this._bufferBuilder.append(217);
        this.pack_uint32(length2);
      } else throw new Error("Invalid length");
      this._bufferBuilder.append_buffer(encoded);
    }
    pack_array(ary) {
      const length2 = ary.length;
      if (length2 <= 15) this.pack_uint8(144 + length2);
      else if (length2 <= 65535) {
        this._bufferBuilder.append(220);
        this.pack_uint16(length2);
      } else if (length2 <= 4294967295) {
        this._bufferBuilder.append(221);
        this.pack_uint32(length2);
      } else throw new Error("Invalid length");
      const packNext = (index) => {
        if (index < length2) {
          const res = this.pack(ary[index]);
          if (res instanceof Promise) return res.then(() => packNext(index + 1));
          return packNext(index + 1);
        }
      };
      return packNext(0);
    }
    pack_integer(num) {
      if (num >= -32 && num <= 127) this._bufferBuilder.append(num & 255);
      else if (num >= 0 && num <= 255) {
        this._bufferBuilder.append(204);
        this.pack_uint8(num);
      } else if (num >= -128 && num <= 127) {
        this._bufferBuilder.append(208);
        this.pack_int8(num);
      } else if (num >= 0 && num <= 65535) {
        this._bufferBuilder.append(205);
        this.pack_uint16(num);
      } else if (num >= -32768 && num <= 32767) {
        this._bufferBuilder.append(209);
        this.pack_int16(num);
      } else if (num >= 0 && num <= 4294967295) {
        this._bufferBuilder.append(206);
        this.pack_uint32(num);
      } else if (num >= -2147483648 && num <= 2147483647) {
        this._bufferBuilder.append(210);
        this.pack_int32(num);
      } else if (num >= -9223372036854776e3 && num <= 9223372036854776e3) {
        this._bufferBuilder.append(211);
        this.pack_int64(num);
      } else if (num >= 0 && num <= 18446744073709552e3) {
        this._bufferBuilder.append(207);
        this.pack_uint64(num);
      } else throw new Error("Invalid integer");
    }
    pack_double(num) {
      let sign = 0;
      if (num < 0) {
        sign = 1;
        num = -num;
      }
      const exp2 = Math.floor(Math.log(num) / Math.LN2);
      const frac0 = num / 2 ** exp2 - 1;
      const frac1 = Math.floor(frac0 * 2 ** 52);
      const b32 = 2 ** 32;
      const h32 = sign << 31 | exp2 + 1023 << 20 | frac1 / b32 & 1048575;
      const l32 = frac1 % b32;
      this._bufferBuilder.append(203);
      this.pack_int32(h32);
      this.pack_int32(l32);
    }
    pack_object(obj) {
      const keys = Object.keys(obj);
      const length2 = keys.length;
      if (length2 <= 15) this.pack_uint8(128 + length2);
      else if (length2 <= 65535) {
        this._bufferBuilder.append(222);
        this.pack_uint16(length2);
      } else if (length2 <= 4294967295) {
        this._bufferBuilder.append(223);
        this.pack_uint32(length2);
      } else throw new Error("Invalid length");
      const packNext = (index) => {
        if (index < keys.length) {
          const prop = keys[index];
          if (obj.hasOwnProperty(prop)) {
            this.pack(prop);
            const res = this.pack(obj[prop]);
            if (res instanceof Promise) return res.then(() => packNext(index + 1));
          }
          return packNext(index + 1);
        }
      };
      return packNext(0);
    }
    pack_uint8(num) {
      this._bufferBuilder.append(num);
    }
    pack_uint16(num) {
      this._bufferBuilder.append(num >> 8);
      this._bufferBuilder.append(num & 255);
    }
    pack_uint32(num) {
      const n = num & 4294967295;
      this._bufferBuilder.append((n & 4278190080) >>> 24);
      this._bufferBuilder.append((n & 16711680) >>> 16);
      this._bufferBuilder.append((n & 65280) >>> 8);
      this._bufferBuilder.append(n & 255);
    }
    pack_uint64(num) {
      const high = num / 2 ** 32;
      const low = num % 2 ** 32;
      this._bufferBuilder.append((high & 4278190080) >>> 24);
      this._bufferBuilder.append((high & 16711680) >>> 16);
      this._bufferBuilder.append((high & 65280) >>> 8);
      this._bufferBuilder.append(high & 255);
      this._bufferBuilder.append((low & 4278190080) >>> 24);
      this._bufferBuilder.append((low & 16711680) >>> 16);
      this._bufferBuilder.append((low & 65280) >>> 8);
      this._bufferBuilder.append(low & 255);
    }
    pack_int8(num) {
      this._bufferBuilder.append(num & 255);
    }
    pack_int16(num) {
      this._bufferBuilder.append((num & 65280) >> 8);
      this._bufferBuilder.append(num & 255);
    }
    pack_int32(num) {
      this._bufferBuilder.append(num >>> 24 & 255);
      this._bufferBuilder.append((num & 16711680) >>> 16);
      this._bufferBuilder.append((num & 65280) >>> 8);
      this._bufferBuilder.append(num & 255);
    }
    pack_int64(num) {
      const high = Math.floor(num / 2 ** 32);
      const low = num % 2 ** 32;
      this._bufferBuilder.append((high & 4278190080) >>> 24);
      this._bufferBuilder.append((high & 16711680) >>> 16);
      this._bufferBuilder.append((high & 65280) >>> 8);
      this._bufferBuilder.append(high & 255);
      this._bufferBuilder.append((low & 4278190080) >>> 24);
      this._bufferBuilder.append((low & 16711680) >>> 16);
      this._bufferBuilder.append((low & 65280) >>> 8);
      this._bufferBuilder.append(low & 255);
    }
    constructor() {
      this._bufferBuilder = new $bf7fb46c6d68ead7$var$$e8379818650e2442$export$93654d4f2d6cd524();
      this._textEncoder = new TextEncoder();
    }
  };
  var $9fea4db837311579$var$logDisabled_ = true;
  var $9fea4db837311579$var$deprecationWarnings_ = true;
  function $9fea4db837311579$export$e3c02be309be1f23(uastring, expr, pos) {
    const match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
  }
  function $9fea4db837311579$export$1f48841962b828b1(window1, eventNameToWrap, wrapper) {
    if (!window1.RTCPeerConnection) return;
    const proto = window1.RTCPeerConnection.prototype;
    const nativeAddEventListener = proto.addEventListener;
    proto.addEventListener = function(nativeEventName, cb) {
      if (nativeEventName !== eventNameToWrap) return nativeAddEventListener.apply(this, arguments);
      const wrappedCallback = (e) => {
        const modifiedEvent = wrapper(e);
        if (modifiedEvent) {
          if (cb.handleEvent) cb.handleEvent(modifiedEvent);
          else cb(modifiedEvent);
        }
      };
      this._eventMap = this._eventMap || {};
      if (!this._eventMap[eventNameToWrap]) this._eventMap[eventNameToWrap] = /* @__PURE__ */ new Map();
      this._eventMap[eventNameToWrap].set(cb, wrappedCallback);
      return nativeAddEventListener.apply(this, [
        nativeEventName,
        wrappedCallback
      ]);
    };
    const nativeRemoveEventListener = proto.removeEventListener;
    proto.removeEventListener = function(nativeEventName, cb) {
      if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[eventNameToWrap]) return nativeRemoveEventListener.apply(this, arguments);
      if (!this._eventMap[eventNameToWrap].has(cb)) return nativeRemoveEventListener.apply(this, arguments);
      const unwrappedCb = this._eventMap[eventNameToWrap].get(cb);
      this._eventMap[eventNameToWrap].delete(cb);
      if (this._eventMap[eventNameToWrap].size === 0) delete this._eventMap[eventNameToWrap];
      if (Object.keys(this._eventMap).length === 0) delete this._eventMap;
      return nativeRemoveEventListener.apply(this, [
        nativeEventName,
        unwrappedCb
      ]);
    };
    Object.defineProperty(proto, "on" + eventNameToWrap, {
      get() {
        return this["_on" + eventNameToWrap];
      },
      set(cb) {
        if (this["_on" + eventNameToWrap]) {
          this.removeEventListener(eventNameToWrap, this["_on" + eventNameToWrap]);
          delete this["_on" + eventNameToWrap];
        }
        if (cb) this.addEventListener(eventNameToWrap, this["_on" + eventNameToWrap] = cb);
      },
      enumerable: true,
      configurable: true
    });
  }
  function $9fea4db837311579$export$afbfee8cc06fd3e4(bool) {
    if (typeof bool !== "boolean") return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
    $9fea4db837311579$var$logDisabled_ = bool;
    return bool ? "adapter.js logging disabled" : "adapter.js logging enabled";
  }
  function $9fea4db837311579$export$51516be4b019e41e(bool) {
    if (typeof bool !== "boolean") return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
    $9fea4db837311579$var$deprecationWarnings_ = !bool;
    return "adapter.js deprecation warnings " + (bool ? "disabled" : "enabled");
  }
  function $9fea4db837311579$export$bef1f36f5486a6a3() {
    if (typeof window === "object") {
      if ($9fea4db837311579$var$logDisabled_) return;
      if (typeof console !== "undefined" && typeof console.log === "function") console.log.apply(console, arguments);
    }
  }
  function $9fea4db837311579$export$cdd73fc4100a6ef4(oldMethod, newMethod) {
    if (!$9fea4db837311579$var$deprecationWarnings_) return;
    console.warn(oldMethod + " is deprecated, please use " + newMethod + " instead.");
  }
  function $9fea4db837311579$export$2d31490a0c05f094(window1) {
    const result = {
      browser: null,
      version: null
    };
    if (typeof window1 === "undefined" || !window1.navigator || !window1.navigator.userAgent) {
      result.browser = "Not a browser.";
      return result;
    }
    const { navigator: navigator2 } = window1;
    if (navigator2.userAgentData && navigator2.userAgentData.brands) {
      const chromium = navigator2.userAgentData.brands.find((brand) => {
        return brand.brand === "Chromium";
      });
      if (chromium) return {
        browser: "chrome",
        version: parseInt(chromium.version, 10)
      };
    }
    if (navigator2.mozGetUserMedia) {
      result.browser = "firefox";
      result.version = $9fea4db837311579$export$e3c02be309be1f23(navigator2.userAgent, /Firefox\/(\d+)\./, 1);
    } else if (navigator2.webkitGetUserMedia || window1.isSecureContext === false && window1.webkitRTCPeerConnection) {
      result.browser = "chrome";
      result.version = $9fea4db837311579$export$e3c02be309be1f23(navigator2.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
    } else if (window1.RTCPeerConnection && navigator2.userAgent.match(/AppleWebKit\/(\d+)\./)) {
      result.browser = "safari";
      result.version = $9fea4db837311579$export$e3c02be309be1f23(navigator2.userAgent, /AppleWebKit\/(\d+)\./, 1);
      result.supportsUnifiedPlan = window1.RTCRtpTransceiver && "currentDirection" in window1.RTCRtpTransceiver.prototype;
    } else {
      result.browser = "Not a supported browser.";
      return result;
    }
    return result;
  }
  function $9fea4db837311579$var$isObject(val) {
    return Object.prototype.toString.call(val) === "[object Object]";
  }
  function $9fea4db837311579$export$15384eac40dc88c8(data) {
    if (!$9fea4db837311579$var$isObject(data)) return data;
    return Object.keys(data).reduce(function(accumulator, key2) {
      const isObj = $9fea4db837311579$var$isObject(data[key2]);
      const value = isObj ? $9fea4db837311579$export$15384eac40dc88c8(data[key2]) : data[key2];
      const isEmptyObject = isObj && !Object.keys(value).length;
      if (value === void 0 || isEmptyObject) return accumulator;
      return Object.assign(accumulator, {
        [key2]: value
      });
    }, {});
  }
  function $9fea4db837311579$export$571b373e75babb58(stats, base, resultSet) {
    if (!base || resultSet.has(base.id)) return;
    resultSet.set(base.id, base);
    Object.keys(base).forEach((name) => {
      if (name.endsWith("Id")) $9fea4db837311579$export$571b373e75babb58(stats, stats.get(base[name]), resultSet);
      else if (name.endsWith("Ids")) base[name].forEach((id) => {
        $9fea4db837311579$export$571b373e75babb58(stats, stats.get(id), resultSet);
      });
    });
  }
  function $9fea4db837311579$export$93439ffc3f787d51(result, track, outbound) {
    const streamStatsType = outbound ? "outbound-rtp" : "inbound-rtp";
    const filteredResult = /* @__PURE__ */ new Map();
    if (track === null) return filteredResult;
    const trackStats = [];
    result.forEach((value) => {
      if (value.type === "track" && value.trackIdentifier === track.id) trackStats.push(value);
    });
    trackStats.forEach((trackStat) => {
      result.forEach((stats) => {
        if (stats.type === streamStatsType && stats.trackId === trackStat.id) $9fea4db837311579$export$571b373e75babb58(result, stats, filteredResult);
      });
    });
    return filteredResult;
  }
  var $fb04e59b477f17ce$exports = {};
  $parcel$export($fb04e59b477f17ce$exports, "shimMediaStream", () => $fb04e59b477f17ce$export$33ee24e7a300bcd1);
  $parcel$export($fb04e59b477f17ce$exports, "shimOnTrack", () => $fb04e59b477f17ce$export$f358708f68ab068);
  $parcel$export($fb04e59b477f17ce$exports, "shimGetSendersWithDtmf", () => $fb04e59b477f17ce$export$a41a030a2842f5d6);
  $parcel$export($fb04e59b477f17ce$exports, "shimSenderReceiverGetStats", () => $fb04e59b477f17ce$export$f2f0f2338114eb4b);
  $parcel$export($fb04e59b477f17ce$exports, "shimAddTrackRemoveTrackWithNative", () => $fb04e59b477f17ce$export$30e3cdd46f8d5100);
  $parcel$export($fb04e59b477f17ce$exports, "shimAddTrackRemoveTrack", () => $fb04e59b477f17ce$export$9588259fcf4ebc91);
  $parcel$export($fb04e59b477f17ce$exports, "shimPeerConnection", () => $fb04e59b477f17ce$export$852a08dda9a55ea7);
  $parcel$export($fb04e59b477f17ce$exports, "fixNegotiationNeeded", () => $fb04e59b477f17ce$export$341293bbeaae37cb);
  $parcel$export($fb04e59b477f17ce$exports, "shimGetUserMedia", () => $de41d89a4eaa283f$export$1ed4910f4d37dc5e);
  var $de41d89a4eaa283f$var$logging = $9fea4db837311579$export$bef1f36f5486a6a3;
  function $de41d89a4eaa283f$export$1ed4910f4d37dc5e(window2, browserDetails) {
    const navigator2 = window2 && window2.navigator;
    if (!navigator2.mediaDevices) return;
    const constraintsToChrome_ = function(c) {
      if (typeof c !== "object" || c.mandatory || c.optional) return c;
      const cc = {};
      Object.keys(c).forEach((key2) => {
        if (key2 === "require" || key2 === "advanced" || key2 === "mediaSource") return;
        const r = typeof c[key2] === "object" ? c[key2] : {
          ideal: c[key2]
        };
        if (r.exact !== void 0 && typeof r.exact === "number") r.min = r.max = r.exact;
        const oldname_ = function(prefix, name) {
          if (prefix) return prefix + name.charAt(0).toUpperCase() + name.slice(1);
          return name === "deviceId" ? "sourceId" : name;
        };
        if (r.ideal !== void 0) {
          cc.optional = cc.optional || [];
          let oc = {};
          if (typeof r.ideal === "number") {
            oc[oldname_("min", key2)] = r.ideal;
            cc.optional.push(oc);
            oc = {};
            oc[oldname_("max", key2)] = r.ideal;
            cc.optional.push(oc);
          } else {
            oc[oldname_("", key2)] = r.ideal;
            cc.optional.push(oc);
          }
        }
        if (r.exact !== void 0 && typeof r.exact !== "number") {
          cc.mandatory = cc.mandatory || {};
          cc.mandatory[oldname_("", key2)] = r.exact;
        } else [
          "min",
          "max"
        ].forEach((mix) => {
          if (r[mix] !== void 0) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key2)] = r[mix];
          }
        });
      });
      if (c.advanced) cc.optional = (cc.optional || []).concat(c.advanced);
      return cc;
    };
    const shimConstraints_ = function(constraints, func) {
      if (browserDetails.version >= 61) return func(constraints);
      constraints = JSON.parse(JSON.stringify(constraints));
      if (constraints && typeof constraints.audio === "object") {
        const remap = function(obj, a, b) {
          if (a in obj && !(b in obj)) {
            obj[b] = obj[a];
            delete obj[a];
          }
        };
        constraints = JSON.parse(JSON.stringify(constraints));
        remap(constraints.audio, "autoGainControl", "googAutoGainControl");
        remap(constraints.audio, "noiseSuppression", "googNoiseSuppression");
        constraints.audio = constraintsToChrome_(constraints.audio);
      }
      if (constraints && typeof constraints.video === "object") {
        let face = constraints.video.facingMode;
        face = face && (typeof face === "object" ? face : {
          ideal: face
        });
        const getSupportedFacingModeLies = browserDetails.version < 66;
        if (face && (face.exact === "user" || face.exact === "environment" || face.ideal === "user" || face.ideal === "environment") && !(navigator2.mediaDevices.getSupportedConstraints && navigator2.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
          delete constraints.video.facingMode;
          let matches;
          if (face.exact === "environment" || face.ideal === "environment") matches = [
            "back",
            "rear"
          ];
          else if (face.exact === "user" || face.ideal === "user") matches = [
            "front"
          ];
          if (matches)
            return navigator2.mediaDevices.enumerateDevices().then((devices) => {
              devices = devices.filter((d) => d.kind === "videoinput");
              let dev = devices.find((d) => matches.some((match) => d.label.toLowerCase().includes(match)));
              if (!dev && devices.length && matches.includes("back")) dev = devices[devices.length - 1];
              if (dev) constraints.video.deviceId = face.exact ? {
                exact: dev.deviceId
              } : {
                ideal: dev.deviceId
              };
              constraints.video = constraintsToChrome_(constraints.video);
              $de41d89a4eaa283f$var$logging("chrome: " + JSON.stringify(constraints));
              return func(constraints);
            });
        }
        constraints.video = constraintsToChrome_(constraints.video);
      }
      $de41d89a4eaa283f$var$logging("chrome: " + JSON.stringify(constraints));
      return func(constraints);
    };
    const shimError_ = function(e) {
      if (browserDetails.version >= 64) return e;
      return {
        name: {
          PermissionDeniedError: "NotAllowedError",
          PermissionDismissedError: "NotAllowedError",
          InvalidStateError: "NotAllowedError",
          DevicesNotFoundError: "NotFoundError",
          ConstraintNotSatisfiedError: "OverconstrainedError",
          TrackStartError: "NotReadableError",
          MediaDeviceFailedDueToShutdown: "NotAllowedError",
          MediaDeviceKillSwitchOn: "NotAllowedError",
          TabCaptureError: "AbortError",
          ScreenCaptureError: "AbortError",
          DeviceCaptureError: "AbortError"
        }[e.name] || e.name,
        message: e.message,
        constraint: e.constraint || e.constraintName,
        toString() {
          return this.name + (this.message && ": ") + this.message;
        }
      };
    };
    const getUserMedia_ = function(constraints, onSuccess, onError) {
      shimConstraints_(constraints, (c) => {
        navigator2.webkitGetUserMedia(c, onSuccess, (e) => {
          if (onError) onError(shimError_(e));
        });
      });
    };
    navigator2.getUserMedia = getUserMedia_.bind(navigator2);
    if (navigator2.mediaDevices.getUserMedia) {
      const origGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
      navigator2.mediaDevices.getUserMedia = function(cs) {
        return shimConstraints_(cs, (c) => origGetUserMedia(c).then((stream) => {
          if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach((track) => {
              track.stop();
            });
            throw new DOMException("", "NotFoundError");
          }
          return stream;
        }, (e) => Promise.reject(shimError_(e))));
      };
    }
  }
  function $fb04e59b477f17ce$export$33ee24e7a300bcd1(window2) {
    window2.MediaStream = window2.MediaStream || window2.webkitMediaStream;
  }
  function $fb04e59b477f17ce$export$f358708f68ab068(window2) {
    if (typeof window2 === "object" && window2.RTCPeerConnection && !("ontrack" in window2.RTCPeerConnection.prototype)) {
      Object.defineProperty(window2.RTCPeerConnection.prototype, "ontrack", {
        get() {
          return this._ontrack;
        },
        set(f) {
          if (this._ontrack) this.removeEventListener("track", this._ontrack);
          this.addEventListener("track", this._ontrack = f);
        },
        enumerable: true,
        configurable: true
      });
      const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
      window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
        if (!this._ontrackpoly) {
          this._ontrackpoly = (e) => {
            e.stream.addEventListener("addtrack", (te) => {
              let receiver;
              if (window2.RTCPeerConnection.prototype.getReceivers) receiver = this.getReceivers().find((r) => r.track && r.track.id === te.track.id);
              else receiver = {
                track: te.track
              };
              const event = new Event("track");
              event.track = te.track;
              event.receiver = receiver;
              event.transceiver = {
                receiver
              };
              event.streams = [
                e.stream
              ];
              this.dispatchEvent(event);
            });
            e.stream.getTracks().forEach((track) => {
              let receiver;
              if (window2.RTCPeerConnection.prototype.getReceivers) receiver = this.getReceivers().find((r) => r.track && r.track.id === track.id);
              else receiver = {
                track
              };
              const event = new Event("track");
              event.track = track;
              event.receiver = receiver;
              event.transceiver = {
                receiver
              };
              event.streams = [
                e.stream
              ];
              this.dispatchEvent(event);
            });
          };
          this.addEventListener("addstream", this._ontrackpoly);
        }
        return origSetRemoteDescription.apply(this, arguments);
      };
    } else
      $9fea4db837311579$export$1f48841962b828b1(window2, "track", (e) => {
        if (!e.transceiver) Object.defineProperty(e, "transceiver", {
          value: {
            receiver: e.receiver
          }
        });
        return e;
      });
  }
  function $fb04e59b477f17ce$export$a41a030a2842f5d6(window2) {
    if (typeof window2 === "object" && window2.RTCPeerConnection && !("getSenders" in window2.RTCPeerConnection.prototype) && "createDTMFSender" in window2.RTCPeerConnection.prototype) {
      const shimSenderWithDtmf = function(pc, track) {
        return {
          track,
          get dtmf() {
            if (this._dtmf === void 0) {
              if (track.kind === "audio") this._dtmf = pc.createDTMFSender(track);
              else this._dtmf = null;
            }
            return this._dtmf;
          },
          _pc: pc
        };
      };
      if (!window2.RTCPeerConnection.prototype.getSenders) {
        window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
          this._senders = this._senders || [];
          return this._senders.slice();
        };
        const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
        window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
          let sender = origAddTrack.apply(this, arguments);
          if (!sender) {
            sender = shimSenderWithDtmf(this, track);
            this._senders.push(sender);
          }
          return sender;
        };
        const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
        window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
          origRemoveTrack.apply(this, arguments);
          const idx = this._senders.indexOf(sender);
          if (idx !== -1) this._senders.splice(idx, 1);
        };
      }
      const origAddStream = window2.RTCPeerConnection.prototype.addStream;
      window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
        this._senders = this._senders || [];
        origAddStream.apply(this, [
          stream
        ]);
        stream.getTracks().forEach((track) => {
          this._senders.push(shimSenderWithDtmf(this, track));
        });
      };
      const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
      window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
        this._senders = this._senders || [];
        origRemoveStream.apply(this, [
          stream
        ]);
        stream.getTracks().forEach((track) => {
          const sender = this._senders.find((s) => s.track === track);
          if (sender) this._senders.splice(this._senders.indexOf(sender), 1);
        });
      };
    } else if (typeof window2 === "object" && window2.RTCPeerConnection && "getSenders" in window2.RTCPeerConnection.prototype && "createDTMFSender" in window2.RTCPeerConnection.prototype && window2.RTCRtpSender && !("dtmf" in window2.RTCRtpSender.prototype)) {
      const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
      window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach((sender) => sender._pc = this);
        return senders;
      };
      Object.defineProperty(window2.RTCRtpSender.prototype, "dtmf", {
        get() {
          if (this._dtmf === void 0) {
            if (this.track.kind === "audio") this._dtmf = this._pc.createDTMFSender(this.track);
            else this._dtmf = null;
          }
          return this._dtmf;
        }
      });
    }
  }
  function $fb04e59b477f17ce$export$f2f0f2338114eb4b(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender && window2.RTCRtpReceiver)) return;
    if (!("getStats" in window2.RTCRtpSender.prototype)) {
      const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
      if (origGetSenders) window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach((sender) => sender._pc = this);
        return senders;
      };
      const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
      if (origAddTrack) window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
        const sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
      window2.RTCRtpSender.prototype.getStats = function getStats() {
        const sender = this;
        return this._pc.getStats().then((result) => (
          /* Note: this will include stats of all senders that
          *   send a track with the same id as sender.track as
          *   it is not possible to identify the RTCRtpSender.
          */
          $9fea4db837311579$export$93439ffc3f787d51(result, sender.track, true)
        ));
      };
    }
    if (!("getStats" in window2.RTCRtpReceiver.prototype)) {
      const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
      if (origGetReceivers) window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
        const receivers = origGetReceivers.apply(this, []);
        receivers.forEach((receiver) => receiver._pc = this);
        return receivers;
      };
      $9fea4db837311579$export$1f48841962b828b1(window2, "track", (e) => {
        e.receiver._pc = e.srcElement;
        return e;
      });
      window2.RTCRtpReceiver.prototype.getStats = function getStats() {
        const receiver = this;
        return this._pc.getStats().then((result) => $9fea4db837311579$export$93439ffc3f787d51(result, receiver.track, false));
      };
    }
    if (!("getStats" in window2.RTCRtpSender.prototype && "getStats" in window2.RTCRtpReceiver.prototype)) return;
    const origGetStats = window2.RTCPeerConnection.prototype.getStats;
    window2.RTCPeerConnection.prototype.getStats = function getStats() {
      if (arguments.length > 0 && arguments[0] instanceof window2.MediaStreamTrack) {
        const track = arguments[0];
        let sender;
        let receiver;
        let err;
        this.getSenders().forEach((s) => {
          if (s.track === track) {
            if (sender) err = true;
            else sender = s;
          }
        });
        this.getReceivers().forEach((r) => {
          if (r.track === track) {
            if (receiver) err = true;
            else receiver = r;
          }
          return r.track === track;
        });
        if (err || sender && receiver) return Promise.reject(new DOMException("There are more than one sender or receiver for the track.", "InvalidAccessError"));
        else if (sender) return sender.getStats();
        else if (receiver) return receiver.getStats();
        return Promise.reject(new DOMException("There is no sender or receiver for the track.", "InvalidAccessError"));
      }
      return origGetStats.apply(this, arguments);
    };
  }
  function $fb04e59b477f17ce$export$30e3cdd46f8d5100(window2) {
    window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      return Object.keys(this._shimmedLocalStreams).map((streamId) => this._shimmedLocalStreams[streamId][0]);
    };
    const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
    window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
      if (!stream) return origAddTrack.apply(this, arguments);
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      const sender = origAddTrack.apply(this, arguments);
      if (!this._shimmedLocalStreams[stream.id]) this._shimmedLocalStreams[stream.id] = [
        stream,
        sender
      ];
      else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) this._shimmedLocalStreams[stream.id].push(sender);
      return sender;
    };
    const origAddStream = window2.RTCPeerConnection.prototype.addStream;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      stream.getTracks().forEach((track) => {
        const alreadyExists = this.getSenders().find((s) => s.track === track);
        if (alreadyExists) throw new DOMException("Track already exists.", "InvalidAccessError");
      });
      const existingSenders = this.getSenders();
      origAddStream.apply(this, arguments);
      const newSenders = this.getSenders().filter((newSender) => existingSenders.indexOf(newSender) === -1);
      this._shimmedLocalStreams[stream.id] = [
        stream
      ].concat(newSenders);
    };
    const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      delete this._shimmedLocalStreams[stream.id];
      return origRemoveStream.apply(this, arguments);
    };
    const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
    window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      if (sender) Object.keys(this._shimmedLocalStreams).forEach((streamId) => {
        const idx = this._shimmedLocalStreams[streamId].indexOf(sender);
        if (idx !== -1) this._shimmedLocalStreams[streamId].splice(idx, 1);
        if (this._shimmedLocalStreams[streamId].length === 1) delete this._shimmedLocalStreams[streamId];
      });
      return origRemoveTrack.apply(this, arguments);
    };
  }
  function $fb04e59b477f17ce$export$9588259fcf4ebc91(window2, browserDetails) {
    if (!window2.RTCPeerConnection) return;
    if (window2.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) return $fb04e59b477f17ce$export$30e3cdd46f8d5100(window2);
    const origGetLocalStreams = window2.RTCPeerConnection.prototype.getLocalStreams;
    window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      const nativeStreams = origGetLocalStreams.apply(this);
      this._reverseStreams = this._reverseStreams || {};
      return nativeStreams.map((stream) => this._reverseStreams[stream.id]);
    };
    const origAddStream = window2.RTCPeerConnection.prototype.addStream;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};
      stream.getTracks().forEach((track) => {
        const alreadyExists = this.getSenders().find((s) => s.track === track);
        if (alreadyExists) throw new DOMException("Track already exists.", "InvalidAccessError");
      });
      if (!this._reverseStreams[stream.id]) {
        const newStream = new window2.MediaStream(stream.getTracks());
        this._streams[stream.id] = newStream;
        this._reverseStreams[newStream.id] = stream;
        stream = newStream;
      }
      origAddStream.apply(this, [
        stream
      ]);
    };
    const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};
      origRemoveStream.apply(this, [
        this._streams[stream.id] || stream
      ]);
      delete this._reverseStreams[this._streams[stream.id] ? this._streams[stream.id].id : stream.id];
      delete this._streams[stream.id];
    };
    window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
      if (this.signalingState === "closed") throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
      const streams = [].slice.call(arguments, 1);
      if (streams.length !== 1 || !streams[0].getTracks().find((t) => t === track))
        throw new DOMException("The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.", "NotSupportedError");
      const alreadyExists = this.getSenders().find((s) => s.track === track);
      if (alreadyExists) throw new DOMException("Track already exists.", "InvalidAccessError");
      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};
      const oldStream = this._streams[stream.id];
      if (oldStream) {
        oldStream.addTrack(track);
        Promise.resolve().then(() => {
          this.dispatchEvent(new Event("negotiationneeded"));
        });
      } else {
        const newStream = new window2.MediaStream([
          track
        ]);
        this._streams[stream.id] = newStream;
        this._reverseStreams[newStream.id] = stream;
        this.addStream(newStream);
      }
      return this.getSenders().find((s) => s.track === track);
    };
    function replaceInternalStreamId(pc, description) {
      let sdp = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach((internalId) => {
        const externalStream = pc._reverseStreams[internalId];
        const internalStream = pc._streams[externalStream.id];
        sdp = sdp.replace(new RegExp(internalStream.id, "g"), externalStream.id);
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp
      });
    }
    function replaceExternalStreamId(pc, description) {
      let sdp = description.sdp;
      Object.keys(pc._reverseStreams || []).forEach((internalId) => {
        const externalStream = pc._reverseStreams[internalId];
        const internalStream = pc._streams[externalStream.id];
        sdp = sdp.replace(new RegExp(externalStream.id, "g"), internalStream.id);
      });
      return new RTCSessionDescription({
        type: description.type,
        sdp
      });
    }
    [
      "createOffer",
      "createAnswer"
    ].forEach(function(method) {
      const nativeMethod = window2.RTCPeerConnection.prototype[method];
      const methodObj = {
        [method]() {
          const args = arguments;
          const isLegacyCall = arguments.length && typeof arguments[0] === "function";
          if (isLegacyCall) return nativeMethod.apply(this, [
            (description) => {
              const desc = replaceInternalStreamId(this, description);
              args[0].apply(null, [
                desc
              ]);
            },
            (err) => {
              if (args[1]) args[1].apply(null, err);
            },
            arguments[2]
          ]);
          return nativeMethod.apply(this, arguments).then((description) => replaceInternalStreamId(this, description));
        }
      };
      window2.RTCPeerConnection.prototype[method] = methodObj[method];
    });
    const origSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
    window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
      if (!arguments.length || !arguments[0].type) return origSetLocalDescription.apply(this, arguments);
      arguments[0] = replaceExternalStreamId(this, arguments[0]);
      return origSetLocalDescription.apply(this, arguments);
    };
    const origLocalDescription = Object.getOwnPropertyDescriptor(window2.RTCPeerConnection.prototype, "localDescription");
    Object.defineProperty(window2.RTCPeerConnection.prototype, "localDescription", {
      get() {
        const description = origLocalDescription.get.apply(this);
        if (description.type === "") return description;
        return replaceInternalStreamId(this, description);
      }
    });
    window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
      if (this.signalingState === "closed") throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
      if (!sender._pc) throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.", "TypeError");
      const isLocal = sender._pc === this;
      if (!isLocal) throw new DOMException("Sender was not created by this connection.", "InvalidAccessError");
      this._streams = this._streams || {};
      let stream;
      Object.keys(this._streams).forEach((streamid) => {
        const hasTrack = this._streams[streamid].getTracks().find((track) => sender.track === track);
        if (hasTrack) stream = this._streams[streamid];
      });
      if (stream) {
        if (stream.getTracks().length === 1)
          this.removeStream(this._reverseStreams[stream.id]);
        else
          stream.removeTrack(sender.track);
        this.dispatchEvent(new Event("negotiationneeded"));
      }
    };
  }
  function $fb04e59b477f17ce$export$852a08dda9a55ea7(window2, browserDetails) {
    if (!window2.RTCPeerConnection && window2.webkitRTCPeerConnection)
      window2.RTCPeerConnection = window2.webkitRTCPeerConnection;
    if (!window2.RTCPeerConnection) return;
    if (browserDetails.version < 53) [
      "setLocalDescription",
      "setRemoteDescription",
      "addIceCandidate"
    ].forEach(function(method) {
      const nativeMethod = window2.RTCPeerConnection.prototype[method];
      const methodObj = {
        [method]() {
          arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        }
      };
      window2.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }
  function $fb04e59b477f17ce$export$341293bbeaae37cb(window2, browserDetails) {
    $9fea4db837311579$export$1f48841962b828b1(window2, "negotiationneeded", (e) => {
      const pc = e.target;
      if (browserDetails.version < 72 || pc.getConfiguration && pc.getConfiguration().sdpSemantics === "plan-b") {
        if (pc.signalingState !== "stable") return;
      }
      return e;
    });
  }
  var $215e6581d7a09c61$exports = {};
  $parcel$export($215e6581d7a09c61$exports, "shimOnTrack", () => $215e6581d7a09c61$export$f358708f68ab068);
  $parcel$export($215e6581d7a09c61$exports, "shimPeerConnection", () => $215e6581d7a09c61$export$852a08dda9a55ea7);
  $parcel$export($215e6581d7a09c61$exports, "shimSenderGetStats", () => $215e6581d7a09c61$export$f0525502095c04ef);
  $parcel$export($215e6581d7a09c61$exports, "shimReceiverGetStats", () => $215e6581d7a09c61$export$83d69126527b1171);
  $parcel$export($215e6581d7a09c61$exports, "shimRemoveStream", () => $215e6581d7a09c61$export$825e523ef749bd8c);
  $parcel$export($215e6581d7a09c61$exports, "shimRTCDataChannel", () => $215e6581d7a09c61$export$ff9cb3bc8990e8f7);
  $parcel$export($215e6581d7a09c61$exports, "shimAddTransceiver", () => $215e6581d7a09c61$export$70c77533b6e9908d);
  $parcel$export($215e6581d7a09c61$exports, "shimGetParameters", () => $215e6581d7a09c61$export$66238223c298fbaa);
  $parcel$export($215e6581d7a09c61$exports, "shimCreateOffer", () => $215e6581d7a09c61$export$51beccf0e777b843);
  $parcel$export($215e6581d7a09c61$exports, "shimCreateAnswer", () => $215e6581d7a09c61$export$df0b46e7cef08150);
  $parcel$export($215e6581d7a09c61$exports, "shimGetUserMedia", () => $6c9e5f7e9edd1e60$export$1ed4910f4d37dc5e);
  $parcel$export($215e6581d7a09c61$exports, "shimGetDisplayMedia", () => $c12684406b986df8$export$97270b87351d9c04);
  function $6c9e5f7e9edd1e60$export$1ed4910f4d37dc5e(window2, browserDetails) {
    const navigator2 = window2 && window2.navigator;
    const MediaStreamTrack = window2 && window2.MediaStreamTrack;
    navigator2.getUserMedia = function(constraints, onSuccess, onError) {
      $9fea4db837311579$export$cdd73fc4100a6ef4("navigator.getUserMedia", "navigator.mediaDevices.getUserMedia");
      navigator2.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
    };
    if (!(browserDetails.version > 55 && "autoGainControl" in navigator2.mediaDevices.getSupportedConstraints())) {
      const remap = function(obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };
      const nativeGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
      navigator2.mediaDevices.getUserMedia = function(c) {
        if (typeof c === "object" && typeof c.audio === "object") {
          c = JSON.parse(JSON.stringify(c));
          remap(c.audio, "autoGainControl", "mozAutoGainControl");
          remap(c.audio, "noiseSuppression", "mozNoiseSuppression");
        }
        return nativeGetUserMedia(c);
      };
      if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
        const nativeGetSettings = MediaStreamTrack.prototype.getSettings;
        MediaStreamTrack.prototype.getSettings = function() {
          const obj = nativeGetSettings.apply(this, arguments);
          remap(obj, "mozAutoGainControl", "autoGainControl");
          remap(obj, "mozNoiseSuppression", "noiseSuppression");
          return obj;
        };
      }
      if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
        const nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
        MediaStreamTrack.prototype.applyConstraints = function(c) {
          if (this.kind === "audio" && typeof c === "object") {
            c = JSON.parse(JSON.stringify(c));
            remap(c, "autoGainControl", "mozAutoGainControl");
            remap(c, "noiseSuppression", "mozNoiseSuppression");
          }
          return nativeApplyConstraints.apply(this, [
            c
          ]);
        };
      }
    }
  }
  function $c12684406b986df8$export$97270b87351d9c04(window2, preferredMediaSource) {
    if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) return;
    if (!window2.navigator.mediaDevices) return;
    window2.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
      if (!(constraints && constraints.video)) {
        const err = new DOMException("getDisplayMedia without video constraints is undefined");
        err.name = "NotFoundError";
        err.code = 8;
        return Promise.reject(err);
      }
      if (constraints.video === true) constraints.video = {
        mediaSource: preferredMediaSource
      };
      else constraints.video.mediaSource = preferredMediaSource;
      return window2.navigator.mediaDevices.getUserMedia(constraints);
    };
  }
  function $215e6581d7a09c61$export$f358708f68ab068(window2) {
    if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
      get() {
        return {
          receiver: this.receiver
        };
      }
    });
  }
  function $215e6581d7a09c61$export$852a08dda9a55ea7(window2, browserDetails) {
    if (typeof window2 !== "object" || !(window2.RTCPeerConnection || window2.mozRTCPeerConnection)) return;
    if (!window2.RTCPeerConnection && window2.mozRTCPeerConnection)
      window2.RTCPeerConnection = window2.mozRTCPeerConnection;
    if (browserDetails.version < 53)
      [
        "setLocalDescription",
        "setRemoteDescription",
        "addIceCandidate"
      ].forEach(function(method) {
        const nativeMethod = window2.RTCPeerConnection.prototype[method];
        const methodObj = {
          [method]() {
            arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          }
        };
        window2.RTCPeerConnection.prototype[method] = methodObj[method];
      });
    const modernStatsTypes = {
      inboundrtp: "inbound-rtp",
      outboundrtp: "outbound-rtp",
      candidatepair: "candidate-pair",
      localcandidate: "local-candidate",
      remotecandidate: "remote-candidate"
    };
    const nativeGetStats = window2.RTCPeerConnection.prototype.getStats;
    window2.RTCPeerConnection.prototype.getStats = function getStats() {
      const [selector, onSucc, onErr] = arguments;
      return nativeGetStats.apply(this, [
        selector || null
      ]).then((stats) => {
        if (browserDetails.version < 53 && !onSucc)
          try {
            stats.forEach((stat) => {
              stat.type = modernStatsTypes[stat.type] || stat.type;
            });
          } catch (e) {
            if (e.name !== "TypeError") throw e;
            stats.forEach((stat, i2) => {
              stats.set(i2, Object.assign({}, stat, {
                type: modernStatsTypes[stat.type] || stat.type
              }));
            });
          }
        return stats;
      }).then(onSucc, onErr);
    };
  }
  function $215e6581d7a09c61$export$f0525502095c04ef(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) return;
    if (window2.RTCRtpSender && "getStats" in window2.RTCRtpSender.prototype) return;
    const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach((sender) => sender._pc = this);
      return senders;
    };
    const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
      const sender = origAddTrack.apply(this, arguments);
      sender._pc = this;
      return sender;
    };
    window2.RTCRtpSender.prototype.getStats = function getStats() {
      return this.track ? this._pc.getStats(this.track) : Promise.resolve(/* @__PURE__ */ new Map());
    };
  }
  function $215e6581d7a09c61$export$83d69126527b1171(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) return;
    if (window2.RTCRtpSender && "getStats" in window2.RTCRtpReceiver.prototype) return;
    const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
      const receivers = origGetReceivers.apply(this, []);
      receivers.forEach((receiver) => receiver._pc = this);
      return receivers;
    };
    $9fea4db837311579$export$1f48841962b828b1(window2, "track", (e) => {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window2.RTCRtpReceiver.prototype.getStats = function getStats() {
      return this._pc.getStats(this.track);
    };
  }
  function $215e6581d7a09c61$export$825e523ef749bd8c(window2) {
    if (!window2.RTCPeerConnection || "removeStream" in window2.RTCPeerConnection.prototype) return;
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      $9fea4db837311579$export$cdd73fc4100a6ef4("removeStream", "removeTrack");
      this.getSenders().forEach((sender) => {
        if (sender.track && stream.getTracks().includes(sender.track)) this.removeTrack(sender);
      });
    };
  }
  function $215e6581d7a09c61$export$ff9cb3bc8990e8f7(window2) {
    if (window2.DataChannel && !window2.RTCDataChannel) window2.RTCDataChannel = window2.DataChannel;
  }
  function $215e6581d7a09c61$export$70c77533b6e9908d(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection)) return;
    const origAddTransceiver = window2.RTCPeerConnection.prototype.addTransceiver;
    if (origAddTransceiver) window2.RTCPeerConnection.prototype.addTransceiver = function addTransceiver() {
      this.setParametersPromises = [];
      let sendEncodings = arguments[1] && arguments[1].sendEncodings;
      if (sendEncodings === void 0) sendEncodings = [];
      sendEncodings = [
        ...sendEncodings
      ];
      const shouldPerformCheck = sendEncodings.length > 0;
      if (shouldPerformCheck)
        sendEncodings.forEach((encodingParam) => {
          if ("rid" in encodingParam) {
            const ridRegex = /^[a-z0-9]{0,16}$/i;
            if (!ridRegex.test(encodingParam.rid)) throw new TypeError("Invalid RID value provided.");
          }
          if ("scaleResolutionDownBy" in encodingParam) {
            if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1)) throw new RangeError("scale_resolution_down_by must be >= 1.0");
          }
          if ("maxFramerate" in encodingParam) {
            if (!(parseFloat(encodingParam.maxFramerate) >= 0)) throw new RangeError("max_framerate must be >= 0.0");
          }
        });
      const transceiver = origAddTransceiver.apply(this, arguments);
      if (shouldPerformCheck) {
        const { sender } = transceiver;
        const params = sender.getParameters();
        if (!("encodings" in params) || // Avoid being fooled by patched getParameters() below.
        params.encodings.length === 1 && Object.keys(params.encodings[0]).length === 0) {
          params.encodings = sendEncodings;
          sender.sendEncodings = sendEncodings;
          this.setParametersPromises.push(sender.setParameters(params).then(() => {
            delete sender.sendEncodings;
          }).catch(() => {
            delete sender.sendEncodings;
          }));
        }
      }
      return transceiver;
    };
  }
  function $215e6581d7a09c61$export$66238223c298fbaa(window2) {
    if (!(typeof window2 === "object" && window2.RTCRtpSender)) return;
    const origGetParameters = window2.RTCRtpSender.prototype.getParameters;
    if (origGetParameters) window2.RTCRtpSender.prototype.getParameters = function getParameters() {
      const params = origGetParameters.apply(this, arguments);
      if (!("encodings" in params)) params.encodings = [].concat(this.sendEncodings || [
        {}
      ]);
      return params;
    };
  }
  function $215e6581d7a09c61$export$51beccf0e777b843(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection)) return;
    const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
    window2.RTCPeerConnection.prototype.createOffer = function createOffer() {
      if (this.setParametersPromises && this.setParametersPromises.length) return Promise.all(this.setParametersPromises).then(() => {
        return origCreateOffer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
      return origCreateOffer.apply(this, arguments);
    };
  }
  function $215e6581d7a09c61$export$df0b46e7cef08150(window2) {
    if (!(typeof window2 === "object" && window2.RTCPeerConnection)) return;
    const origCreateAnswer = window2.RTCPeerConnection.prototype.createAnswer;
    window2.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
      if (this.setParametersPromises && this.setParametersPromises.length) return Promise.all(this.setParametersPromises).then(() => {
        return origCreateAnswer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
      return origCreateAnswer.apply(this, arguments);
    };
  }
  var $c1f641ee5a6f6c8f$exports = {};
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimLocalStreamsAPI", () => $c1f641ee5a6f6c8f$export$8df41282f4fdcea2);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimRemoteStreamsAPI", () => $c1f641ee5a6f6c8f$export$762aa4cbb4f2f857);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimCallbacksAPI", () => $c1f641ee5a6f6c8f$export$da31df245debdd3);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimGetUserMedia", () => $c1f641ee5a6f6c8f$export$1ed4910f4d37dc5e);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimConstraints", () => $c1f641ee5a6f6c8f$export$494a01ac68ba81ac);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimRTCIceServerUrls", () => $c1f641ee5a6f6c8f$export$671a8b47b41b6f41);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimTrackEventTransceiver", () => $c1f641ee5a6f6c8f$export$85d53da088cb1b14);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimCreateOfferLegacy", () => $c1f641ee5a6f6c8f$export$d444266503fdd2d4);
  $parcel$export($c1f641ee5a6f6c8f$exports, "shimAudioContext", () => $c1f641ee5a6f6c8f$export$857cd739a7b795d2);
  function $c1f641ee5a6f6c8f$export$8df41282f4fdcea2(window2) {
    if (typeof window2 !== "object" || !window2.RTCPeerConnection) return;
    if (!("getLocalStreams" in window2.RTCPeerConnection.prototype)) window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      if (!this._localStreams) this._localStreams = [];
      return this._localStreams;
    };
    if (!("addStream" in window2.RTCPeerConnection.prototype)) {
      const _addTrack = window2.RTCPeerConnection.prototype.addTrack;
      window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
        if (!this._localStreams) this._localStreams = [];
        if (!this._localStreams.includes(stream)) this._localStreams.push(stream);
        stream.getAudioTracks().forEach((track) => _addTrack.call(this, track, stream));
        stream.getVideoTracks().forEach((track) => _addTrack.call(this, track, stream));
      };
      window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, ...streams) {
        if (streams) streams.forEach((stream) => {
          if (!this._localStreams) this._localStreams = [
            stream
          ];
          else if (!this._localStreams.includes(stream)) this._localStreams.push(stream);
        });
        return _addTrack.apply(this, arguments);
      };
    }
    if (!("removeStream" in window2.RTCPeerConnection.prototype)) window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      if (!this._localStreams) this._localStreams = [];
      const index = this._localStreams.indexOf(stream);
      if (index === -1) return;
      this._localStreams.splice(index, 1);
      const tracks = stream.getTracks();
      this.getSenders().forEach((sender) => {
        if (tracks.includes(sender.track)) this.removeTrack(sender);
      });
    };
  }
  function $c1f641ee5a6f6c8f$export$762aa4cbb4f2f857(window2) {
    if (typeof window2 !== "object" || !window2.RTCPeerConnection) return;
    if (!("getRemoteStreams" in window2.RTCPeerConnection.prototype)) window2.RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
      return this._remoteStreams ? this._remoteStreams : [];
    };
    if (!("onaddstream" in window2.RTCPeerConnection.prototype)) {
      Object.defineProperty(window2.RTCPeerConnection.prototype, "onaddstream", {
        get() {
          return this._onaddstream;
        },
        set(f) {
          if (this._onaddstream) {
            this.removeEventListener("addstream", this._onaddstream);
            this.removeEventListener("track", this._onaddstreampoly);
          }
          this.addEventListener("addstream", this._onaddstream = f);
          this.addEventListener("track", this._onaddstreampoly = (e) => {
            e.streams.forEach((stream) => {
              if (!this._remoteStreams) this._remoteStreams = [];
              if (this._remoteStreams.includes(stream)) return;
              this._remoteStreams.push(stream);
              const event = new Event("addstream");
              event.stream = stream;
              this.dispatchEvent(event);
            });
          });
        }
      });
      const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
      window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
        const pc = this;
        if (!this._onaddstreampoly) this.addEventListener("track", this._onaddstreampoly = function(e) {
          e.streams.forEach((stream) => {
            if (!pc._remoteStreams) pc._remoteStreams = [];
            if (pc._remoteStreams.indexOf(stream) >= 0) return;
            pc._remoteStreams.push(stream);
            const event = new Event("addstream");
            event.stream = stream;
            pc.dispatchEvent(event);
          });
        });
        return origSetRemoteDescription.apply(pc, arguments);
      };
    }
  }
  function $c1f641ee5a6f6c8f$export$da31df245debdd3(window2) {
    if (typeof window2 !== "object" || !window2.RTCPeerConnection) return;
    const prototype = window2.RTCPeerConnection.prototype;
    const origCreateOffer = prototype.createOffer;
    const origCreateAnswer = prototype.createAnswer;
    const setLocalDescription = prototype.setLocalDescription;
    const setRemoteDescription = prototype.setRemoteDescription;
    const addIceCandidate = prototype.addIceCandidate;
    prototype.createOffer = function createOffer(successCallback, failureCallback) {
      const options = arguments.length >= 2 ? arguments[2] : arguments[0];
      const promise = origCreateOffer.apply(this, [
        options
      ]);
      if (!failureCallback) return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.createAnswer = function createAnswer(successCallback, failureCallback) {
      const options = arguments.length >= 2 ? arguments[2] : arguments[0];
      const promise = origCreateAnswer.apply(this, [
        options
      ]);
      if (!failureCallback) return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    let withCallback = function(description, successCallback, failureCallback) {
      const promise = setLocalDescription.apply(this, [
        description
      ]);
      if (!failureCallback) return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setLocalDescription = withCallback;
    withCallback = function(description, successCallback, failureCallback) {
      const promise = setRemoteDescription.apply(this, [
        description
      ]);
      if (!failureCallback) return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.setRemoteDescription = withCallback;
    withCallback = function(candidate, successCallback, failureCallback) {
      const promise = addIceCandidate.apply(this, [
        candidate
      ]);
      if (!failureCallback) return promise;
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };
    prototype.addIceCandidate = withCallback;
  }
  function $c1f641ee5a6f6c8f$export$1ed4910f4d37dc5e(window2) {
    const navigator2 = window2 && window2.navigator;
    if (navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
      const mediaDevices = navigator2.mediaDevices;
      const _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
      navigator2.mediaDevices.getUserMedia = (constraints) => {
        return _getUserMedia($c1f641ee5a6f6c8f$export$494a01ac68ba81ac(constraints));
      };
    }
    if (!navigator2.getUserMedia && navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) navigator2.getUserMedia = (function getUserMedia(constraints, cb, errcb) {
      navigator2.mediaDevices.getUserMedia(constraints).then(cb, errcb);
    }).bind(navigator2);
  }
  function $c1f641ee5a6f6c8f$export$494a01ac68ba81ac(constraints) {
    if (constraints && constraints.video !== void 0) return Object.assign({}, constraints, {
      video: $9fea4db837311579$export$15384eac40dc88c8(constraints.video)
    });
    return constraints;
  }
  function $c1f641ee5a6f6c8f$export$671a8b47b41b6f41(window2) {
    if (!window2.RTCPeerConnection) return;
    const OrigPeerConnection = window2.RTCPeerConnection;
    window2.RTCPeerConnection = function RTCPeerConnection2(pcConfig, pcConstraints) {
      if (pcConfig && pcConfig.iceServers) {
        const newIceServers = [];
        for (let i2 = 0; i2 < pcConfig.iceServers.length; i2++) {
          let server = pcConfig.iceServers[i2];
          if (server.urls === void 0 && server.url) {
            $9fea4db837311579$export$cdd73fc4100a6ef4("RTCIceServer.url", "RTCIceServer.urls");
            server = JSON.parse(JSON.stringify(server));
            server.urls = server.url;
            delete server.url;
            newIceServers.push(server);
          } else newIceServers.push(pcConfig.iceServers[i2]);
        }
        pcConfig.iceServers = newIceServers;
      }
      return new OrigPeerConnection(pcConfig, pcConstraints);
    };
    window2.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
    if ("generateCertificate" in OrigPeerConnection) Object.defineProperty(window2.RTCPeerConnection, "generateCertificate", {
      get() {
        return OrigPeerConnection.generateCertificate;
      }
    });
  }
  function $c1f641ee5a6f6c8f$export$85d53da088cb1b14(window2) {
    if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
      get() {
        return {
          receiver: this.receiver
        };
      }
    });
  }
  function $c1f641ee5a6f6c8f$export$d444266503fdd2d4(window2) {
    const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
    window2.RTCPeerConnection.prototype.createOffer = function createOffer(offerOptions) {
      if (offerOptions) {
        if (typeof offerOptions.offerToReceiveAudio !== "undefined")
          offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
        const audioTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "audio");
        if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
          if (audioTransceiver.direction === "sendrecv") {
            if (audioTransceiver.setDirection) audioTransceiver.setDirection("sendonly");
            else audioTransceiver.direction = "sendonly";
          } else if (audioTransceiver.direction === "recvonly") {
            if (audioTransceiver.setDirection) audioTransceiver.setDirection("inactive");
            else audioTransceiver.direction = "inactive";
          }
        } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) this.addTransceiver("audio", {
          direction: "recvonly"
        });
        if (typeof offerOptions.offerToReceiveVideo !== "undefined")
          offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
        const videoTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "video");
        if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
          if (videoTransceiver.direction === "sendrecv") {
            if (videoTransceiver.setDirection) videoTransceiver.setDirection("sendonly");
            else videoTransceiver.direction = "sendonly";
          } else if (videoTransceiver.direction === "recvonly") {
            if (videoTransceiver.setDirection) videoTransceiver.setDirection("inactive");
            else videoTransceiver.direction = "inactive";
          }
        } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) this.addTransceiver("video", {
          direction: "recvonly"
        });
      }
      return origCreateOffer.apply(this, arguments);
    };
  }
  function $c1f641ee5a6f6c8f$export$857cd739a7b795d2(window2) {
    if (typeof window2 !== "object" || window2.AudioContext) return;
    window2.AudioContext = window2.webkitAudioContext;
  }
  var $5151b78094cea2ba$exports = {};
  $parcel$export($5151b78094cea2ba$exports, "shimRTCIceCandidate", () => $5151b78094cea2ba$export$cf133661e444ccfe);
  $parcel$export($5151b78094cea2ba$exports, "shimRTCIceCandidateRelayProtocol", () => $5151b78094cea2ba$export$fdafb8d8280e29b5);
  $parcel$export($5151b78094cea2ba$exports, "shimMaxMessageSize", () => $5151b78094cea2ba$export$a99147c78a56edc4);
  $parcel$export($5151b78094cea2ba$exports, "shimSendThrowTypeError", () => $5151b78094cea2ba$export$d461c8d5c5db5da7);
  $parcel$export($5151b78094cea2ba$exports, "shimConnectionState", () => $5151b78094cea2ba$export$63bb816cc75460);
  $parcel$export($5151b78094cea2ba$exports, "removeExtmapAllowMixed", () => $5151b78094cea2ba$export$a57d114344295149);
  $parcel$export($5151b78094cea2ba$exports, "shimAddIceCandidateNullOrEmpty", () => $5151b78094cea2ba$export$51d5e40b48c771c7);
  $parcel$export($5151b78094cea2ba$exports, "shimParameterlessSetLocalDescription", () => $5151b78094cea2ba$export$7170d04e59f9d553);
  var $5d0e6002f6ec24ec$exports = {};
  var $5d0e6002f6ec24ec$var$SDPUtils = {};
  $5d0e6002f6ec24ec$var$SDPUtils.generateIdentifier = function() {
    return Math.random().toString(36).substring(2, 12);
  };
  $5d0e6002f6ec24ec$var$SDPUtils.localCName = $5d0e6002f6ec24ec$var$SDPUtils.generateIdentifier();
  $5d0e6002f6ec24ec$var$SDPUtils.splitLines = function(blob) {
    return blob.trim().split("\n").map((line) => line.trim());
  };
  $5d0e6002f6ec24ec$var$SDPUtils.splitSections = function(blob) {
    const parts = blob.split("\nm=");
    return parts.map((part, index) => (index > 0 ? "m=" + part : part).trim() + "\r\n");
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getDescription = function(blob) {
    const sections = $5d0e6002f6ec24ec$var$SDPUtils.splitSections(blob);
    return sections && sections[0];
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getMediaSections = function(blob) {
    const sections = $5d0e6002f6ec24ec$var$SDPUtils.splitSections(blob);
    sections.shift();
    return sections;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix = function(blob, prefix) {
    return $5d0e6002f6ec24ec$var$SDPUtils.splitLines(blob).filter((line) => line.indexOf(prefix) === 0);
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseCandidate = function(line) {
    let parts;
    if (line.indexOf("a=candidate:") === 0) parts = line.substring(12).split(" ");
    else parts = line.substring(10).split(" ");
    const candidate = {
      foundation: parts[0],
      component: {
        1: "rtp",
        2: "rtcp"
      }[parts[1]] || parts[1],
      protocol: parts[2].toLowerCase(),
      priority: parseInt(parts[3], 10),
      ip: parts[4],
      address: parts[4],
      port: parseInt(parts[5], 10),
      // skip parts[6] == 'typ'
      type: parts[7]
    };
    for (let i2 = 8; i2 < parts.length; i2 += 2) switch (parts[i2]) {
      case "raddr":
        candidate.relatedAddress = parts[i2 + 1];
        break;
      case "rport":
        candidate.relatedPort = parseInt(parts[i2 + 1], 10);
        break;
      case "tcptype":
        candidate.tcpType = parts[i2 + 1];
        break;
      case "ufrag":
        candidate.ufrag = parts[i2 + 1];
        candidate.usernameFragment = parts[i2 + 1];
        break;
      default:
        if (candidate[parts[i2]] === void 0) candidate[parts[i2]] = parts[i2 + 1];
        break;
    }
    return candidate;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeCandidate = function(candidate) {
    const sdp = [];
    sdp.push(candidate.foundation);
    const component = candidate.component;
    if (component === "rtp") sdp.push(1);
    else if (component === "rtcp") sdp.push(2);
    else sdp.push(component);
    sdp.push(candidate.protocol.toUpperCase());
    sdp.push(candidate.priority);
    sdp.push(candidate.address || candidate.ip);
    sdp.push(candidate.port);
    const type = candidate.type;
    sdp.push("typ");
    sdp.push(type);
    if (type !== "host" && candidate.relatedAddress && candidate.relatedPort) {
      sdp.push("raddr");
      sdp.push(candidate.relatedAddress);
      sdp.push("rport");
      sdp.push(candidate.relatedPort);
    }
    if (candidate.tcpType && candidate.protocol.toLowerCase() === "tcp") {
      sdp.push("tcptype");
      sdp.push(candidate.tcpType);
    }
    if (candidate.usernameFragment || candidate.ufrag) {
      sdp.push("ufrag");
      sdp.push(candidate.usernameFragment || candidate.ufrag);
    }
    return "candidate:" + sdp.join(" ");
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseIceOptions = function(line) {
    return line.substring(14).split(" ");
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseRtpMap = function(line) {
    let parts = line.substring(9).split(" ");
    const parsed = {
      payloadType: parseInt(parts.shift(), 10)
    };
    parts = parts[0].split("/");
    parsed.name = parts[0];
    parsed.clockRate = parseInt(parts[1], 10);
    parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
    parsed.numChannels = parsed.channels;
    return parsed;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeRtpMap = function(codec) {
    let pt = codec.payloadType;
    if (codec.preferredPayloadType !== void 0) pt = codec.preferredPayloadType;
    const channels = codec.channels || codec.numChannels || 1;
    return "a=rtpmap:" + pt + " " + codec.name + "/" + codec.clockRate + (channels !== 1 ? "/" + channels : "") + "\r\n";
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseExtmap = function(line) {
    const parts = line.substring(9).split(" ");
    return {
      id: parseInt(parts[0], 10),
      direction: parts[0].indexOf("/") > 0 ? parts[0].split("/")[1] : "sendrecv",
      uri: parts[1],
      attributes: parts.slice(2).join(" ")
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeExtmap = function(headerExtension) {
    return "a=extmap:" + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== "sendrecv" ? "/" + headerExtension.direction : "") + " " + headerExtension.uri + (headerExtension.attributes ? " " + headerExtension.attributes : "") + "\r\n";
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseFmtp = function(line) {
    const parsed = {};
    let kv;
    const parts = line.substring(line.indexOf(" ") + 1).split(";");
    for (let j = 0; j < parts.length; j++) {
      kv = parts[j].trim().split("=");
      parsed[kv[0].trim()] = kv[1];
    }
    return parsed;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeFmtp = function(codec) {
    let line = "";
    let pt = codec.payloadType;
    if (codec.preferredPayloadType !== void 0) pt = codec.preferredPayloadType;
    if (codec.parameters && Object.keys(codec.parameters).length) {
      const params = [];
      Object.keys(codec.parameters).forEach((param) => {
        if (codec.parameters[param] !== void 0) params.push(param + "=" + codec.parameters[param]);
        else params.push(param);
      });
      line += "a=fmtp:" + pt + " " + params.join(";") + "\r\n";
    }
    return line;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseRtcpFb = function(line) {
    const parts = line.substring(line.indexOf(" ") + 1).split(" ");
    return {
      type: parts.shift(),
      parameter: parts.join(" ")
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeRtcpFb = function(codec) {
    let lines = "";
    let pt = codec.payloadType;
    if (codec.preferredPayloadType !== void 0) pt = codec.preferredPayloadType;
    if (codec.rtcpFeedback && codec.rtcpFeedback.length)
      codec.rtcpFeedback.forEach((fb) => {
        lines += "a=rtcp-fb:" + pt + " " + fb.type + (fb.parameter && fb.parameter.length ? " " + fb.parameter : "") + "\r\n";
      });
    return lines;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseSsrcMedia = function(line) {
    const sp = line.indexOf(" ");
    const parts = {
      ssrc: parseInt(line.substring(7, sp), 10)
    };
    const colon = line.indexOf(":", sp);
    if (colon > -1) {
      parts.attribute = line.substring(sp + 1, colon);
      parts.value = line.substring(colon + 1);
    } else parts.attribute = line.substring(sp + 1);
    return parts;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseSsrcGroup = function(line) {
    const parts = line.substring(13).split(" ");
    return {
      semantics: parts.shift(),
      ssrcs: parts.map((ssrc) => parseInt(ssrc, 10))
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getMid = function(mediaSection) {
    const mid = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=mid:")[0];
    if (mid) return mid.substring(6);
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseFingerprint = function(line) {
    const parts = line.substring(14).split(" ");
    return {
      algorithm: parts[0].toLowerCase(),
      value: parts[1].toUpperCase()
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
    const lines = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection + sessionpart, "a=fingerprint:");
    return {
      role: "auto",
      fingerprints: lines.map($5d0e6002f6ec24ec$var$SDPUtils.parseFingerprint)
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeDtlsParameters = function(params, setupType) {
    let sdp = "a=setup:" + setupType + "\r\n";
    params.fingerprints.forEach((fp) => {
      sdp += "a=fingerprint:" + fp.algorithm + " " + fp.value + "\r\n";
    });
    return sdp;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseCryptoLine = function(line) {
    const parts = line.substring(9).split(" ");
    return {
      tag: parseInt(parts[0], 10),
      cryptoSuite: parts[1],
      keyParams: parts[2],
      sessionParams: parts.slice(3)
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeCryptoLine = function(parameters) {
    return "a=crypto:" + parameters.tag + " " + parameters.cryptoSuite + " " + (typeof parameters.keyParams === "object" ? $5d0e6002f6ec24ec$var$SDPUtils.writeCryptoKeyParams(parameters.keyParams) : parameters.keyParams) + (parameters.sessionParams ? " " + parameters.sessionParams.join(" ") : "") + "\r\n";
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseCryptoKeyParams = function(keyParams) {
    if (keyParams.indexOf("inline:") !== 0) return null;
    const parts = keyParams.substring(7).split("|");
    return {
      keyMethod: "inline",
      keySalt: parts[0],
      lifeTime: parts[1],
      mkiValue: parts[2] ? parts[2].split(":")[0] : void 0,
      mkiLength: parts[2] ? parts[2].split(":")[1] : void 0
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeCryptoKeyParams = function(keyParams) {
    return keyParams.keyMethod + ":" + keyParams.keySalt + (keyParams.lifeTime ? "|" + keyParams.lifeTime : "") + (keyParams.mkiValue && keyParams.mkiLength ? "|" + keyParams.mkiValue + ":" + keyParams.mkiLength : "");
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getCryptoParameters = function(mediaSection, sessionpart) {
    const lines = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection + sessionpart, "a=crypto:");
    return lines.map($5d0e6002f6ec24ec$var$SDPUtils.parseCryptoLine);
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
    const ufrag = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection + sessionpart, "a=ice-ufrag:")[0];
    const pwd = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection + sessionpart, "a=ice-pwd:")[0];
    if (!(ufrag && pwd)) return null;
    return {
      usernameFragment: ufrag.substring(12),
      password: pwd.substring(10)
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeIceParameters = function(params) {
    let sdp = "a=ice-ufrag:" + params.usernameFragment + "\r\na=ice-pwd:" + params.password + "\r\n";
    if (params.iceLite) sdp += "a=ice-lite\r\n";
    return sdp;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseRtpParameters = function(mediaSection) {
    const description = {
      codecs: [],
      headerExtensions: [],
      fecMechanisms: [],
      rtcp: []
    };
    const lines = $5d0e6002f6ec24ec$var$SDPUtils.splitLines(mediaSection);
    const mline = lines[0].split(" ");
    description.profile = mline[2];
    for (let i2 = 3; i2 < mline.length; i2++) {
      const pt = mline[i2];
      const rtpmapline = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=rtpmap:" + pt + " ")[0];
      if (rtpmapline) {
        const codec = $5d0e6002f6ec24ec$var$SDPUtils.parseRtpMap(rtpmapline);
        const fmtps = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=fmtp:" + pt + " ");
        codec.parameters = fmtps.length ? $5d0e6002f6ec24ec$var$SDPUtils.parseFmtp(fmtps[0]) : {};
        codec.rtcpFeedback = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=rtcp-fb:" + pt + " ").map($5d0e6002f6ec24ec$var$SDPUtils.parseRtcpFb);
        description.codecs.push(codec);
        switch (codec.name.toUpperCase()) {
          case "RED":
          case "ULPFEC":
            description.fecMechanisms.push(codec.name.toUpperCase());
            break;
          default:
            break;
        }
      }
    }
    $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=extmap:").forEach((line) => {
      description.headerExtensions.push($5d0e6002f6ec24ec$var$SDPUtils.parseExtmap(line));
    });
    const wildcardRtcpFb = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=rtcp-fb:* ").map($5d0e6002f6ec24ec$var$SDPUtils.parseRtcpFb);
    description.codecs.forEach((codec) => {
      wildcardRtcpFb.forEach((fb) => {
        const duplicate = codec.rtcpFeedback.find((existingFeedback) => {
          return existingFeedback.type === fb.type && existingFeedback.parameter === fb.parameter;
        });
        if (!duplicate) codec.rtcpFeedback.push(fb);
      });
    });
    return description;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeRtpDescription = function(kind, caps) {
    let sdp = "";
    sdp += "m=" + kind + " ";
    sdp += caps.codecs.length > 0 ? "9" : "0";
    sdp += " " + (caps.profile || "UDP/TLS/RTP/SAVPF") + " ";
    sdp += caps.codecs.map((codec) => {
      if (codec.preferredPayloadType !== void 0) return codec.preferredPayloadType;
      return codec.payloadType;
    }).join(" ") + "\r\n";
    sdp += "c=IN IP4 0.0.0.0\r\n";
    sdp += "a=rtcp:9 IN IP4 0.0.0.0\r\n";
    caps.codecs.forEach((codec) => {
      sdp += $5d0e6002f6ec24ec$var$SDPUtils.writeRtpMap(codec);
      sdp += $5d0e6002f6ec24ec$var$SDPUtils.writeFmtp(codec);
      sdp += $5d0e6002f6ec24ec$var$SDPUtils.writeRtcpFb(codec);
    });
    let maxptime = 0;
    caps.codecs.forEach((codec) => {
      if (codec.maxptime > maxptime) maxptime = codec.maxptime;
    });
    if (maxptime > 0) sdp += "a=maxptime:" + maxptime + "\r\n";
    if (caps.headerExtensions) caps.headerExtensions.forEach((extension) => {
      sdp += $5d0e6002f6ec24ec$var$SDPUtils.writeExtmap(extension);
    });
    return sdp;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
    const encodingParameters = [];
    const description = $5d0e6002f6ec24ec$var$SDPUtils.parseRtpParameters(mediaSection);
    const hasRed = description.fecMechanisms.indexOf("RED") !== -1;
    const hasUlpfec = description.fecMechanisms.indexOf("ULPFEC") !== -1;
    const ssrcs = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map((line) => $5d0e6002f6ec24ec$var$SDPUtils.parseSsrcMedia(line)).filter((parts) => parts.attribute === "cname");
    const primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
    let secondarySsrc;
    const flows = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=ssrc-group:FID").map((line) => {
      const parts = line.substring(17).split(" ");
      return parts.map((part) => parseInt(part, 10));
    });
    if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) secondarySsrc = flows[0][1];
    description.codecs.forEach((codec) => {
      if (codec.name.toUpperCase() === "RTX" && codec.parameters.apt) {
        let encParam = {
          ssrc: primarySsrc,
          codecPayloadType: parseInt(codec.parameters.apt, 10)
        };
        if (primarySsrc && secondarySsrc) encParam.rtx = {
          ssrc: secondarySsrc
        };
        encodingParameters.push(encParam);
        if (hasRed) {
          encParam = JSON.parse(JSON.stringify(encParam));
          encParam.fec = {
            ssrc: primarySsrc,
            mechanism: hasUlpfec ? "red+ulpfec" : "red"
          };
          encodingParameters.push(encParam);
        }
      }
    });
    if (encodingParameters.length === 0 && primarySsrc) encodingParameters.push({
      ssrc: primarySsrc
    });
    let bandwidth = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "b=");
    if (bandwidth.length) {
      if (bandwidth[0].indexOf("b=TIAS:") === 0) bandwidth = parseInt(bandwidth[0].substring(7), 10);
      else if (bandwidth[0].indexOf("b=AS:") === 0)
        bandwidth = parseInt(bandwidth[0].substring(5), 10) * 950 - 16e3;
      else bandwidth = void 0;
      encodingParameters.forEach((params) => {
        params.maxBitrate = bandwidth;
      });
    }
    return encodingParameters;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseRtcpParameters = function(mediaSection) {
    const rtcpParameters = {};
    const remoteSsrc = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map((line) => $5d0e6002f6ec24ec$var$SDPUtils.parseSsrcMedia(line)).filter((obj) => obj.attribute === "cname")[0];
    if (remoteSsrc) {
      rtcpParameters.cname = remoteSsrc.value;
      rtcpParameters.ssrc = remoteSsrc.ssrc;
    }
    const rsize = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=rtcp-rsize");
    rtcpParameters.reducedSize = rsize.length > 0;
    rtcpParameters.compound = rsize.length === 0;
    const mux = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=rtcp-mux");
    rtcpParameters.mux = mux.length > 0;
    return rtcpParameters;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeRtcpParameters = function(rtcpParameters) {
    let sdp = "";
    if (rtcpParameters.reducedSize) sdp += "a=rtcp-rsize\r\n";
    if (rtcpParameters.mux) sdp += "a=rtcp-mux\r\n";
    if (rtcpParameters.ssrc !== void 0 && rtcpParameters.cname) sdp += "a=ssrc:" + rtcpParameters.ssrc + " cname:" + rtcpParameters.cname + "\r\n";
    return sdp;
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseMsid = function(mediaSection) {
    let parts;
    const spec = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=msid:");
    if (spec.length === 1) {
      parts = spec[0].substring(7).split(" ");
      return {
        stream: parts[0],
        track: parts[1]
      };
    }
    const planB = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map((line) => $5d0e6002f6ec24ec$var$SDPUtils.parseSsrcMedia(line)).filter((msidParts) => msidParts.attribute === "msid");
    if (planB.length > 0) {
      parts = planB[0].value.split(" ");
      return {
        stream: parts[0],
        track: parts[1]
      };
    }
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseSctpDescription = function(mediaSection) {
    const mline = $5d0e6002f6ec24ec$var$SDPUtils.parseMLine(mediaSection);
    const maxSizeLine = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=max-message-size:");
    let maxMessageSize;
    if (maxSizeLine.length > 0) maxMessageSize = parseInt(maxSizeLine[0].substring(19), 10);
    if (isNaN(maxMessageSize)) maxMessageSize = 65536;
    const sctpPort = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=sctp-port:");
    if (sctpPort.length > 0) return {
      port: parseInt(sctpPort[0].substring(12), 10),
      protocol: mline.fmt,
      maxMessageSize
    };
    const sctpMapLines = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "a=sctpmap:");
    if (sctpMapLines.length > 0) {
      const parts = sctpMapLines[0].substring(10).split(" ");
      return {
        port: parseInt(parts[0], 10),
        protocol: parts[1],
        maxMessageSize
      };
    }
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeSctpDescription = function(media, sctp) {
    let output = [];
    if (media.protocol !== "DTLS/SCTP") output = [
      "m=" + media.kind + " 9 " + media.protocol + " " + sctp.protocol + "\r\n",
      "c=IN IP4 0.0.0.0\r\n",
      "a=sctp-port:" + sctp.port + "\r\n"
    ];
    else output = [
      "m=" + media.kind + " 9 " + media.protocol + " " + sctp.port + "\r\n",
      "c=IN IP4 0.0.0.0\r\n",
      "a=sctpmap:" + sctp.port + " " + sctp.protocol + " 65535\r\n"
    ];
    if (sctp.maxMessageSize !== void 0) output.push("a=max-message-size:" + sctp.maxMessageSize + "\r\n");
    return output.join("");
  };
  $5d0e6002f6ec24ec$var$SDPUtils.generateSessionId = function() {
    return Math.random().toString().substr(2, 22);
  };
  $5d0e6002f6ec24ec$var$SDPUtils.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
    let sessionId;
    const version = sessVer !== void 0 ? sessVer : 2;
    if (sessId) sessionId = sessId;
    else sessionId = $5d0e6002f6ec24ec$var$SDPUtils.generateSessionId();
    const user = sessUser || "thisisadapterortc";
    return "v=0\r\no=" + user + " " + sessionId + " " + version + " IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getDirection = function(mediaSection, sessionpart) {
    const lines = $5d0e6002f6ec24ec$var$SDPUtils.splitLines(mediaSection);
    for (let i2 = 0; i2 < lines.length; i2++) switch (lines[i2]) {
      case "a=sendrecv":
      case "a=sendonly":
      case "a=recvonly":
      case "a=inactive":
        return lines[i2].substring(2);
      default:
    }
    if (sessionpart) return $5d0e6002f6ec24ec$var$SDPUtils.getDirection(sessionpart);
    return "sendrecv";
  };
  $5d0e6002f6ec24ec$var$SDPUtils.getKind = function(mediaSection) {
    const lines = $5d0e6002f6ec24ec$var$SDPUtils.splitLines(mediaSection);
    const mline = lines[0].split(" ");
    return mline[0].substring(2);
  };
  $5d0e6002f6ec24ec$var$SDPUtils.isRejected = function(mediaSection) {
    return mediaSection.split(" ", 2)[1] === "0";
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseMLine = function(mediaSection) {
    const lines = $5d0e6002f6ec24ec$var$SDPUtils.splitLines(mediaSection);
    const parts = lines[0].substring(2).split(" ");
    return {
      kind: parts[0],
      port: parseInt(parts[1], 10),
      protocol: parts[2],
      fmt: parts.slice(3).join(" ")
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.parseOLine = function(mediaSection) {
    const line = $5d0e6002f6ec24ec$var$SDPUtils.matchPrefix(mediaSection, "o=")[0];
    const parts = line.substring(2).split(" ");
    return {
      username: parts[0],
      sessionId: parts[1],
      sessionVersion: parseInt(parts[2], 10),
      netType: parts[3],
      addressType: parts[4],
      address: parts[5]
    };
  };
  $5d0e6002f6ec24ec$var$SDPUtils.isValidSDP = function(blob) {
    if (typeof blob !== "string" || blob.length === 0) return false;
    const lines = $5d0e6002f6ec24ec$var$SDPUtils.splitLines(blob);
    for (let i2 = 0; i2 < lines.length; i2++) {
      if (lines[i2].length < 2 || lines[i2].charAt(1) !== "=") return false;
    }
    return true;
  };
  $5d0e6002f6ec24ec$exports = $5d0e6002f6ec24ec$var$SDPUtils;
  function $5151b78094cea2ba$export$cf133661e444ccfe(window2) {
    if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "foundation" in window2.RTCIceCandidate.prototype) return;
    const NativeRTCIceCandidate = window2.RTCIceCandidate;
    window2.RTCIceCandidate = function RTCIceCandidate(args) {
      if (typeof args === "object" && args.candidate && args.candidate.indexOf("a=") === 0) {
        args = JSON.parse(JSON.stringify(args));
        args.candidate = args.candidate.substring(2);
      }
      if (args.candidate && args.candidate.length) {
        const nativeCandidate = new NativeRTCIceCandidate(args);
        const parsedCandidate = (0, /* @__PURE__ */ $parcel$interopDefault($5d0e6002f6ec24ec$exports)).parseCandidate(args.candidate);
        for (const key2 in parsedCandidate) if (!(key2 in nativeCandidate)) Object.defineProperty(nativeCandidate, key2, {
          value: parsedCandidate[key2]
        });
        nativeCandidate.toJSON = function toJSON() {
          return {
            candidate: nativeCandidate.candidate,
            sdpMid: nativeCandidate.sdpMid,
            sdpMLineIndex: nativeCandidate.sdpMLineIndex,
            usernameFragment: nativeCandidate.usernameFragment
          };
        };
        return nativeCandidate;
      }
      return new NativeRTCIceCandidate(args);
    };
    window2.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;
    $9fea4db837311579$export$1f48841962b828b1(window2, "icecandidate", (e) => {
      if (e.candidate) Object.defineProperty(e, "candidate", {
        value: new window2.RTCIceCandidate(e.candidate),
        writable: "false"
      });
      return e;
    });
  }
  function $5151b78094cea2ba$export$fdafb8d8280e29b5(window2) {
    if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "relayProtocol" in window2.RTCIceCandidate.prototype) return;
    $9fea4db837311579$export$1f48841962b828b1(window2, "icecandidate", (e) => {
      if (e.candidate) {
        const parsedCandidate = (0, /* @__PURE__ */ $parcel$interopDefault($5d0e6002f6ec24ec$exports)).parseCandidate(e.candidate.candidate);
        if (parsedCandidate.type === "relay")
          e.candidate.relayProtocol = {
            0: "tls",
            1: "tcp",
            2: "udp"
          }[parsedCandidate.priority >> 24];
      }
      return e;
    });
  }
  function $5151b78094cea2ba$export$a99147c78a56edc4(window2, browserDetails) {
    if (!window2.RTCPeerConnection) return;
    if (!("sctp" in window2.RTCPeerConnection.prototype)) Object.defineProperty(window2.RTCPeerConnection.prototype, "sctp", {
      get() {
        return typeof this._sctp === "undefined" ? null : this._sctp;
      }
    });
    const sctpInDescription = function(description) {
      if (!description || !description.sdp) return false;
      const sections = (0, /* @__PURE__ */ $parcel$interopDefault($5d0e6002f6ec24ec$exports)).splitSections(description.sdp);
      sections.shift();
      return sections.some((mediaSection) => {
        const mLine = (0, /* @__PURE__ */ $parcel$interopDefault($5d0e6002f6ec24ec$exports)).parseMLine(mediaSection);
        return mLine && mLine.kind === "application" && mLine.protocol.indexOf("SCTP") !== -1;
      });
    };
    const getRemoteFirefoxVersion = function(description) {
      const match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
      if (match === null || match.length < 2) return -1;
      const version = parseInt(match[1], 10);
      return version !== version ? -1 : version;
    };
    const getCanSendMaxMessageSize = function(remoteIsFirefox) {
      let canSendMaxMessageSize = 65536;
      if (browserDetails.browser === "firefox") {
        if (browserDetails.version < 57) {
          if (remoteIsFirefox === -1)
            canSendMaxMessageSize = 16384;
          else
            canSendMaxMessageSize = 2147483637;
        } else if (browserDetails.version < 60)
          canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
        else
          canSendMaxMessageSize = 2147483637;
      }
      return canSendMaxMessageSize;
    };
    const getMaxMessageSize = function(description, remoteIsFirefox) {
      let maxMessageSize = 65536;
      if (browserDetails.browser === "firefox" && browserDetails.version === 57) maxMessageSize = 65535;
      const match = (0, /* @__PURE__ */ $parcel$interopDefault($5d0e6002f6ec24ec$exports)).matchPrefix(description.sdp, "a=max-message-size:");
      if (match.length > 0) maxMessageSize = parseInt(match[0].substring(19), 10);
      else if (browserDetails.browser === "firefox" && remoteIsFirefox !== -1)
        maxMessageSize = 2147483637;
      return maxMessageSize;
    };
    const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      this._sctp = null;
      if (browserDetails.browser === "chrome" && browserDetails.version >= 76) {
        const { sdpSemantics } = this.getConfiguration();
        if (sdpSemantics === "plan-b") Object.defineProperty(this, "sctp", {
          get() {
            return typeof this._sctp === "undefined" ? null : this._sctp;
          },
          enumerable: true,
          configurable: true
        });
      }
      if (sctpInDescription(arguments[0])) {
        const isFirefox = getRemoteFirefoxVersion(arguments[0]);
        const canSendMMS = getCanSendMaxMessageSize(isFirefox);
        const remoteMMS = getMaxMessageSize(arguments[0], isFirefox);
        let maxMessageSize;
        if (canSendMMS === 0 && remoteMMS === 0) maxMessageSize = Number.POSITIVE_INFINITY;
        else if (canSendMMS === 0 || remoteMMS === 0) maxMessageSize = Math.max(canSendMMS, remoteMMS);
        else maxMessageSize = Math.min(canSendMMS, remoteMMS);
        const sctp = {};
        Object.defineProperty(sctp, "maxMessageSize", {
          get() {
            return maxMessageSize;
          }
        });
        this._sctp = sctp;
      }
      return origSetRemoteDescription.apply(this, arguments);
    };
  }
  function $5151b78094cea2ba$export$d461c8d5c5db5da7(window2) {
    if (!(window2.RTCPeerConnection && "createDataChannel" in window2.RTCPeerConnection.prototype)) return;
    function wrapDcSend(dc, pc) {
      const origDataChannelSend = dc.send;
      dc.send = function send() {
        const data = arguments[0];
        const length2 = data.length || data.size || data.byteLength;
        if (dc.readyState === "open" && pc.sctp && length2 > pc.sctp.maxMessageSize) throw new TypeError("Message too large (can send a maximum of " + pc.sctp.maxMessageSize + " bytes)");
        return origDataChannelSend.apply(dc, arguments);
      };
    }
    const origCreateDataChannel = window2.RTCPeerConnection.prototype.createDataChannel;
    window2.RTCPeerConnection.prototype.createDataChannel = function createDataChannel() {
      const dataChannel = origCreateDataChannel.apply(this, arguments);
      wrapDcSend(dataChannel, this);
      return dataChannel;
    };
    $9fea4db837311579$export$1f48841962b828b1(window2, "datachannel", (e) => {
      wrapDcSend(e.channel, e.target);
      return e;
    });
  }
  function $5151b78094cea2ba$export$63bb816cc75460(window2) {
    if (!window2.RTCPeerConnection || "connectionState" in window2.RTCPeerConnection.prototype) return;
    const proto = window2.RTCPeerConnection.prototype;
    Object.defineProperty(proto, "connectionState", {
      get() {
        return {
          completed: "connected",
          checking: "connecting"
        }[this.iceConnectionState] || this.iceConnectionState;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(proto, "onconnectionstatechange", {
      get() {
        return this._onconnectionstatechange || null;
      },
      set(cb) {
        if (this._onconnectionstatechange) {
          this.removeEventListener("connectionstatechange", this._onconnectionstatechange);
          delete this._onconnectionstatechange;
        }
        if (cb) this.addEventListener("connectionstatechange", this._onconnectionstatechange = cb);
      },
      enumerable: true,
      configurable: true
    });
    [
      "setLocalDescription",
      "setRemoteDescription"
    ].forEach((method) => {
      const origMethod = proto[method];
      proto[method] = function() {
        if (!this._connectionstatechangepoly) {
          this._connectionstatechangepoly = (e) => {
            const pc = e.target;
            if (pc._lastConnectionState !== pc.connectionState) {
              pc._lastConnectionState = pc.connectionState;
              const newEvent = new Event("connectionstatechange", e);
              pc.dispatchEvent(newEvent);
            }
            return e;
          };
          this.addEventListener("iceconnectionstatechange", this._connectionstatechangepoly);
        }
        return origMethod.apply(this, arguments);
      };
    });
  }
  function $5151b78094cea2ba$export$a57d114344295149(window2, browserDetails) {
    if (!window2.RTCPeerConnection) return;
    if (browserDetails.browser === "chrome" && browserDetails.version >= 71) return;
    if (browserDetails.browser === "safari" && browserDetails.version >= 605) return;
    const nativeSRD = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(desc) {
      if (desc && desc.sdp && desc.sdp.indexOf("\na=extmap-allow-mixed") !== -1) {
        const sdp = desc.sdp.split("\n").filter((line) => {
          return line.trim() !== "a=extmap-allow-mixed";
        }).join("\n");
        if (window2.RTCSessionDescription && desc instanceof window2.RTCSessionDescription) arguments[0] = new window2.RTCSessionDescription({
          type: desc.type,
          sdp
        });
        else desc.sdp = sdp;
      }
      return nativeSRD.apply(this, arguments);
    };
  }
  function $5151b78094cea2ba$export$51d5e40b48c771c7(window2, browserDetails) {
    if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) return;
    const nativeAddIceCandidate = window2.RTCPeerConnection.prototype.addIceCandidate;
    if (!nativeAddIceCandidate || nativeAddIceCandidate.length === 0) return;
    window2.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
      if (!arguments[0]) {
        if (arguments[1]) arguments[1].apply(null);
        return Promise.resolve();
      }
      if ((browserDetails.browser === "chrome" && browserDetails.version < 78 || browserDetails.browser === "firefox" && browserDetails.version < 68 || browserDetails.browser === "safari") && arguments[0] && arguments[0].candidate === "") return Promise.resolve();
      return nativeAddIceCandidate.apply(this, arguments);
    };
  }
  function $5151b78094cea2ba$export$7170d04e59f9d553(window2, browserDetails) {
    if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) return;
    const nativeSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
    if (!nativeSetLocalDescription || nativeSetLocalDescription.length === 0) return;
    window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
      let desc = arguments[0] || {};
      if (typeof desc !== "object" || desc.type && desc.sdp) return nativeSetLocalDescription.apply(this, arguments);
      desc = {
        type: desc.type,
        sdp: desc.sdp
      };
      if (!desc.type) switch (this.signalingState) {
        case "stable":
        case "have-local-offer":
        case "have-remote-pranswer":
          desc.type = "offer";
          break;
        default:
          desc.type = "answer";
          break;
      }
      if (desc.sdp || desc.type !== "offer" && desc.type !== "answer") return nativeSetLocalDescription.apply(this, [
        desc
      ]);
      const func = desc.type === "offer" ? this.createOffer : this.createAnswer;
      return func.apply(this).then((d) => nativeSetLocalDescription.apply(this, [
        d
      ]));
    };
  }
  function $b657217e95eb14d8$export$e77bf46c04ac7d12({ window: window2 } = {}, options = {
    shimChrome: true,
    shimFirefox: true,
    shimSafari: true
  }) {
    const logging = $9fea4db837311579$export$bef1f36f5486a6a3;
    const browserDetails = $9fea4db837311579$export$2d31490a0c05f094(window2);
    const adapter = {
      browserDetails,
      commonShim: $5151b78094cea2ba$exports,
      extractVersion: $9fea4db837311579$export$e3c02be309be1f23,
      disableLog: $9fea4db837311579$export$afbfee8cc06fd3e4,
      disableWarnings: $9fea4db837311579$export$51516be4b019e41e,
      sdp: (
        // Expose sdp as a convenience. For production apps include directly.
        $5d0e6002f6ec24ec$exports
      )
    };
    switch (browserDetails.browser) {
      case "chrome":
        if (!$fb04e59b477f17ce$exports || !$fb04e59b477f17ce$exports.shimPeerConnection || !options.shimChrome) {
          logging("Chrome shim is not included in this adapter release.");
          return adapter;
        }
        if (browserDetails.version === null) {
          logging("Chrome shim can not determine version, not shimming.");
          return adapter;
        }
        logging("adapter.js shimming chrome.");
        adapter.browserShim = $fb04e59b477f17ce$exports;
        $5151b78094cea2ba$export$51d5e40b48c771c7(window2, browserDetails);
        $5151b78094cea2ba$export$7170d04e59f9d553(window2, browserDetails);
        $fb04e59b477f17ce$exports.shimGetUserMedia(window2, browserDetails);
        $fb04e59b477f17ce$exports.shimMediaStream(window2, browserDetails);
        $fb04e59b477f17ce$exports.shimPeerConnection(window2, browserDetails);
        $fb04e59b477f17ce$exports.shimOnTrack(window2, browserDetails);
        $fb04e59b477f17ce$exports.shimAddTrackRemoveTrack(window2, browserDetails);
        $fb04e59b477f17ce$exports.shimGetSendersWithDtmf(window2, browserDetails);
        $fb04e59b477f17ce$exports.shimSenderReceiverGetStats(window2, browserDetails);
        $fb04e59b477f17ce$exports.fixNegotiationNeeded(window2, browserDetails);
        $5151b78094cea2ba$export$cf133661e444ccfe(window2, browserDetails);
        $5151b78094cea2ba$export$fdafb8d8280e29b5(window2, browserDetails);
        $5151b78094cea2ba$export$63bb816cc75460(window2, browserDetails);
        $5151b78094cea2ba$export$a99147c78a56edc4(window2, browserDetails);
        $5151b78094cea2ba$export$d461c8d5c5db5da7(window2, browserDetails);
        $5151b78094cea2ba$export$a57d114344295149(window2, browserDetails);
        break;
      case "firefox":
        if (!$215e6581d7a09c61$exports || !$215e6581d7a09c61$exports.shimPeerConnection || !options.shimFirefox) {
          logging("Firefox shim is not included in this adapter release.");
          return adapter;
        }
        logging("adapter.js shimming firefox.");
        adapter.browserShim = $215e6581d7a09c61$exports;
        $5151b78094cea2ba$export$51d5e40b48c771c7(window2, browserDetails);
        $5151b78094cea2ba$export$7170d04e59f9d553(window2, browserDetails);
        $215e6581d7a09c61$exports.shimGetUserMedia(window2, browserDetails);
        $215e6581d7a09c61$exports.shimPeerConnection(window2, browserDetails);
        $215e6581d7a09c61$exports.shimOnTrack(window2, browserDetails);
        $215e6581d7a09c61$exports.shimRemoveStream(window2, browserDetails);
        $215e6581d7a09c61$exports.shimSenderGetStats(window2, browserDetails);
        $215e6581d7a09c61$exports.shimReceiverGetStats(window2, browserDetails);
        $215e6581d7a09c61$exports.shimRTCDataChannel(window2, browserDetails);
        $215e6581d7a09c61$exports.shimAddTransceiver(window2, browserDetails);
        $215e6581d7a09c61$exports.shimGetParameters(window2, browserDetails);
        $215e6581d7a09c61$exports.shimCreateOffer(window2, browserDetails);
        $215e6581d7a09c61$exports.shimCreateAnswer(window2, browserDetails);
        $5151b78094cea2ba$export$cf133661e444ccfe(window2, browserDetails);
        $5151b78094cea2ba$export$63bb816cc75460(window2, browserDetails);
        $5151b78094cea2ba$export$a99147c78a56edc4(window2, browserDetails);
        $5151b78094cea2ba$export$d461c8d5c5db5da7(window2, browserDetails);
        break;
      case "safari":
        if (!$c1f641ee5a6f6c8f$exports || !options.shimSafari) {
          logging("Safari shim is not included in this adapter release.");
          return adapter;
        }
        logging("adapter.js shimming safari.");
        adapter.browserShim = $c1f641ee5a6f6c8f$exports;
        $5151b78094cea2ba$export$51d5e40b48c771c7(window2, browserDetails);
        $5151b78094cea2ba$export$7170d04e59f9d553(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimRTCIceServerUrls(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimCreateOfferLegacy(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimCallbacksAPI(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimLocalStreamsAPI(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimRemoteStreamsAPI(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimTrackEventTransceiver(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimGetUserMedia(window2, browserDetails);
        $c1f641ee5a6f6c8f$exports.shimAudioContext(window2, browserDetails);
        $5151b78094cea2ba$export$cf133661e444ccfe(window2, browserDetails);
        $5151b78094cea2ba$export$fdafb8d8280e29b5(window2, browserDetails);
        $5151b78094cea2ba$export$a99147c78a56edc4(window2, browserDetails);
        $5151b78094cea2ba$export$d461c8d5c5db5da7(window2, browserDetails);
        $5151b78094cea2ba$export$a57d114344295149(window2, browserDetails);
        break;
      default:
        logging("Unsupported browser!");
        break;
    }
    return adapter;
  }
  var $90c50c10bd6fa8b4$var$adapter = (0, $b657217e95eb14d8$export$e77bf46c04ac7d12)({
    window: typeof window === "undefined" ? void 0 : window
  });
  var $90c50c10bd6fa8b4$export$2e2bcd8739ae039 = $90c50c10bd6fa8b4$var$adapter;
  var $a9bc9397a7d36afa$var$webRTCAdapter = (
    //@ts-ignore
    (0, $90c50c10bd6fa8b4$export$2e2bcd8739ae039).default || (0, $90c50c10bd6fa8b4$export$2e2bcd8739ae039)
  );
  var $a9bc9397a7d36afa$export$25be9502477c137d = new class {
    isWebRTCSupported() {
      return typeof RTCPeerConnection !== "undefined";
    }
    isBrowserSupported() {
      const browser = this.getBrowser();
      const version = this.getVersion();
      const validBrowser = this.supportedBrowsers.includes(browser);
      if (!validBrowser) return false;
      if (browser === "chrome") return version >= this.minChromeVersion;
      if (browser === "firefox") return version >= this.minFirefoxVersion;
      if (browser === "safari") return !this.isIOS && version >= this.minSafariVersion;
      return false;
    }
    getBrowser() {
      return $a9bc9397a7d36afa$var$webRTCAdapter.browserDetails.browser;
    }
    getVersion() {
      return $a9bc9397a7d36afa$var$webRTCAdapter.browserDetails.version || 0;
    }
    isUnifiedPlanSupported() {
      const browser = this.getBrowser();
      const version = $a9bc9397a7d36afa$var$webRTCAdapter.browserDetails.version || 0;
      if (browser === "chrome" && version < this.minChromeVersion) return false;
      if (browser === "firefox" && version >= this.minFirefoxVersion) return true;
      if (!window.RTCRtpTransceiver || !("currentDirection" in RTCRtpTransceiver.prototype)) return false;
      let tempPc;
      let supported = false;
      try {
        tempPc = new RTCPeerConnection();
        tempPc.addTransceiver("audio");
        supported = true;
      } catch (e) {
      } finally {
        if (tempPc) tempPc.close();
      }
      return supported;
    }
    toString() {
      return `Supports:
    browser:${this.getBrowser()}
    version:${this.getVersion()}
    isIOS:${this.isIOS}
    isWebRTCSupported:${this.isWebRTCSupported()}
    isBrowserSupported:${this.isBrowserSupported()}
    isUnifiedPlanSupported:${this.isUnifiedPlanSupported()}`;
    }
    constructor() {
      this.isIOS = typeof navigator !== "undefined" ? [
        "iPad",
        "iPhone",
        "iPod"
      ].includes(navigator.platform) : false;
      this.supportedBrowsers = [
        "firefox",
        "chrome",
        "safari"
      ];
      this.minFirefoxVersion = 59;
      this.minChromeVersion = 72;
      this.minSafariVersion = 605;
    }
  }();
  var $fce54fbdd74b2319$export$f35f128fd59ea256 = (id) => {
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
  };
  var $008766fe99f03c2f$export$4e61f672936bec77 = () => Math.random().toString(36).slice(2);
  var $01f0d223090cb1f8$var$DEFAULT_CONFIG = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      },
      {
        urls: [
          "turn:eu-0.turn.peerjs.com:3478",
          "turn:us-0.turn.peerjs.com:3478"
        ],
        username: "peerjs",
        credential: "peerjsp"
      }
    ],
    sdpSemantics: "unified-plan"
  };
  var $01f0d223090cb1f8$export$f8f26dd395d7e1bd = class extends (0, $616ebdf1c4998439$export$f1c5f4c9cb95390b) {
    noop() {
    }
    blobToArrayBuffer(blob, cb) {
      const fr = new FileReader();
      fr.onload = function(evt) {
        if (evt.target) cb(evt.target.result);
      };
      fr.readAsArrayBuffer(blob);
      return fr;
    }
    binaryStringToArrayBuffer(binary) {
      const byteArray = new Uint8Array(binary.length);
      for (let i2 = 0; i2 < binary.length; i2++) byteArray[i2] = binary.charCodeAt(i2) & 255;
      return byteArray.buffer;
    }
    isSecure() {
      return location.protocol === "https:";
    }
    constructor(...args) {
      super(...args), this.CLOUD_HOST = "0.peerjs.com", this.CLOUD_PORT = 443, // Browsers that need chunking:
      this.chunkedBrowsers = {
        Chrome: 1,
        chrome: 1
      }, // Returns browser-agnostic default config
      this.defaultConfig = $01f0d223090cb1f8$var$DEFAULT_CONFIG, this.browser = (0, $a9bc9397a7d36afa$export$25be9502477c137d).getBrowser(), this.browserVersion = (0, $a9bc9397a7d36afa$export$25be9502477c137d).getVersion(), this.pack = $bf7fb46c6d68ead7$export$2a703dbb0cb35339, this.unpack = $bf7fb46c6d68ead7$export$417857010dc9287f, /**
      * A hash of WebRTC features mapped to booleans that correspond to whether the feature is supported by the current browser.
      *
      * :::caution
      * Only the properties documented here are guaranteed to be present on `util.supports`
      * :::
      */
      this.supports = (function() {
        const supported = {
          browser: (0, $a9bc9397a7d36afa$export$25be9502477c137d).isBrowserSupported(),
          webRTC: (0, $a9bc9397a7d36afa$export$25be9502477c137d).isWebRTCSupported(),
          audioVideo: false,
          data: false,
          binaryBlob: false,
          reliable: false
        };
        if (!supported.webRTC) return supported;
        let pc;
        try {
          pc = new RTCPeerConnection($01f0d223090cb1f8$var$DEFAULT_CONFIG);
          supported.audioVideo = true;
          let dc;
          try {
            dc = pc.createDataChannel("_PEERJSTEST", {
              ordered: true
            });
            supported.data = true;
            supported.reliable = !!dc.ordered;
            try {
              dc.binaryType = "blob";
              supported.binaryBlob = !(0, $a9bc9397a7d36afa$export$25be9502477c137d).isIOS;
            } catch (e) {
            }
          } catch (e) {
          } finally {
            if (dc) dc.close();
          }
        } catch (e) {
        } finally {
          if (pc) pc.close();
        }
        return supported;
      })(), // Ensure alphanumeric ids
      this.validateId = (0, $fce54fbdd74b2319$export$f35f128fd59ea256), this.randomToken = (0, $008766fe99f03c2f$export$4e61f672936bec77);
    }
  };
  var $01f0d223090cb1f8$export$7debb50ef11d5e0b = new $01f0d223090cb1f8$export$f8f26dd395d7e1bd();
  var $d3fc3aacca52312c$var$LOG_PREFIX = "PeerJS: ";
  var $d3fc3aacca52312c$var$Logger = class {
    get logLevel() {
      return this._logLevel;
    }
    set logLevel(logLevel) {
      this._logLevel = logLevel;
    }
    log(...args) {
      if (this._logLevel >= 3) this._print(3, ...args);
    }
    warn(...args) {
      if (this._logLevel >= 2) this._print(2, ...args);
    }
    error(...args) {
      if (this._logLevel >= 1) this._print(1, ...args);
    }
    setLogFunction(fn) {
      this._print = fn;
    }
    _print(logLevel, ...rest) {
      const copy2 = [
        $d3fc3aacca52312c$var$LOG_PREFIX,
        ...rest
      ];
      for (const i2 in copy2) if (copy2[i2] instanceof Error) copy2[i2] = "(" + copy2[i2].name + ") " + copy2[i2].message;
      if (logLevel >= 3) console.log(...copy2);
      else if (logLevel >= 2) console.warn("WARNING", ...copy2);
      else if (logLevel >= 1) console.error("ERROR", ...copy2);
    }
    constructor() {
      this._logLevel = 0;
    }
  };
  var $d3fc3aacca52312c$export$2e2bcd8739ae039 = new $d3fc3aacca52312c$var$Logger();
  var $f5d7fbd88de797fd$exports = {};
  var $f5d7fbd88de797fd$var$has = Object.prototype.hasOwnProperty;
  var $f5d7fbd88de797fd$var$prefix = "~";
  function $f5d7fbd88de797fd$var$Events() {
  }
  if (Object.create) {
    $f5d7fbd88de797fd$var$Events.prototype = /* @__PURE__ */ Object.create(null);
    if (!new $f5d7fbd88de797fd$var$Events().__proto__) $f5d7fbd88de797fd$var$prefix = false;
  }
  function $f5d7fbd88de797fd$var$EE(fn, context, once2) {
    this.fn = fn;
    this.context = context;
    this.once = once2 || false;
  }
  function $f5d7fbd88de797fd$var$addListener(emitter, event, fn, context, once2) {
    if (typeof fn !== "function") throw new TypeError("The listener must be a function");
    var listener = new $f5d7fbd88de797fd$var$EE(fn, context || emitter, once2), evt = $f5d7fbd88de797fd$var$prefix ? $f5d7fbd88de797fd$var$prefix + event : event;
    if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
    else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
    else emitter._events[evt] = [
      emitter._events[evt],
      listener
    ];
    return emitter;
  }
  function $f5d7fbd88de797fd$var$clearEvent(emitter, evt) {
    if (--emitter._eventsCount === 0) emitter._events = new $f5d7fbd88de797fd$var$Events();
    else delete emitter._events[evt];
  }
  function $f5d7fbd88de797fd$var$EventEmitter() {
    this._events = new $f5d7fbd88de797fd$var$Events();
    this._eventsCount = 0;
  }
  $f5d7fbd88de797fd$var$EventEmitter.prototype.eventNames = function eventNames() {
    var names = [], events, name;
    if (this._eventsCount === 0) return names;
    for (name in events = this._events) if ($f5d7fbd88de797fd$var$has.call(events, name)) names.push($f5d7fbd88de797fd$var$prefix ? name.slice(1) : name);
    if (Object.getOwnPropertySymbols) return names.concat(Object.getOwnPropertySymbols(events));
    return names;
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.listeners = function listeners(event) {
    var evt = $f5d7fbd88de797fd$var$prefix ? $f5d7fbd88de797fd$var$prefix + event : event, handlers = this._events[evt];
    if (!handlers) return [];
    if (handlers.fn) return [
      handlers.fn
    ];
    for (var i2 = 0, l = handlers.length, ee = new Array(l); i2 < l; i2++) ee[i2] = handlers[i2].fn;
    return ee;
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.listenerCount = function listenerCount(event) {
    var evt = $f5d7fbd88de797fd$var$prefix ? $f5d7fbd88de797fd$var$prefix + event : event, listeners2 = this._events[evt];
    if (!listeners2) return 0;
    if (listeners2.fn) return 1;
    return listeners2.length;
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
    var evt = $f5d7fbd88de797fd$var$prefix ? $f5d7fbd88de797fd$var$prefix + event : event;
    if (!this._events[evt]) return false;
    var listeners2 = this._events[evt], len2 = arguments.length, args, i2;
    if (listeners2.fn) {
      if (listeners2.once) this.removeListener(event, listeners2.fn, void 0, true);
      switch (len2) {
        case 1:
          return listeners2.fn.call(listeners2.context), true;
        case 2:
          return listeners2.fn.call(listeners2.context, a1), true;
        case 3:
          return listeners2.fn.call(listeners2.context, a1, a2), true;
        case 4:
          return listeners2.fn.call(listeners2.context, a1, a2, a3), true;
        case 5:
          return listeners2.fn.call(listeners2.context, a1, a2, a3, a4), true;
        case 6:
          return listeners2.fn.call(listeners2.context, a1, a2, a3, a4, a5), true;
      }
      for (i2 = 1, args = new Array(len2 - 1); i2 < len2; i2++) args[i2 - 1] = arguments[i2];
      listeners2.fn.apply(listeners2.context, args);
    } else {
      var length2 = listeners2.length, j;
      for (i2 = 0; i2 < length2; i2++) {
        if (listeners2[i2].once) this.removeListener(event, listeners2[i2].fn, void 0, true);
        switch (len2) {
          case 1:
            listeners2[i2].fn.call(listeners2[i2].context);
            break;
          case 2:
            listeners2[i2].fn.call(listeners2[i2].context, a1);
            break;
          case 3:
            listeners2[i2].fn.call(listeners2[i2].context, a1, a2);
            break;
          case 4:
            listeners2[i2].fn.call(listeners2[i2].context, a1, a2, a3);
            break;
          default:
            if (!args) for (j = 1, args = new Array(len2 - 1); j < len2; j++) args[j - 1] = arguments[j];
            listeners2[i2].fn.apply(listeners2[i2].context, args);
        }
      }
    }
    return true;
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.on = function on(event, fn, context) {
    return $f5d7fbd88de797fd$var$addListener(this, event, fn, context, false);
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.once = function once(event, fn, context) {
    return $f5d7fbd88de797fd$var$addListener(this, event, fn, context, true);
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once2) {
    var evt = $f5d7fbd88de797fd$var$prefix ? $f5d7fbd88de797fd$var$prefix + event : event;
    if (!this._events[evt]) return this;
    if (!fn) {
      $f5d7fbd88de797fd$var$clearEvent(this, evt);
      return this;
    }
    var listeners2 = this._events[evt];
    if (listeners2.fn) {
      if (listeners2.fn === fn && (!once2 || listeners2.once) && (!context || listeners2.context === context)) $f5d7fbd88de797fd$var$clearEvent(this, evt);
    } else {
      for (var i2 = 0, events = [], length2 = listeners2.length; i2 < length2; i2++) if (listeners2[i2].fn !== fn || once2 && !listeners2[i2].once || context && listeners2[i2].context !== context) events.push(listeners2[i2]);
      if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
      else $f5d7fbd88de797fd$var$clearEvent(this, evt);
    }
    return this;
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    var evt;
    if (event) {
      evt = $f5d7fbd88de797fd$var$prefix ? $f5d7fbd88de797fd$var$prefix + event : event;
      if (this._events[evt]) $f5d7fbd88de797fd$var$clearEvent(this, evt);
    } else {
      this._events = new $f5d7fbd88de797fd$var$Events();
      this._eventsCount = 0;
    }
    return this;
  };
  $f5d7fbd88de797fd$var$EventEmitter.prototype.off = $f5d7fbd88de797fd$var$EventEmitter.prototype.removeListener;
  $f5d7fbd88de797fd$var$EventEmitter.prototype.addListener = $f5d7fbd88de797fd$var$EventEmitter.prototype.on;
  $f5d7fbd88de797fd$var$EventEmitter.prefixed = $f5d7fbd88de797fd$var$prefix;
  $f5d7fbd88de797fd$var$EventEmitter.EventEmitter = $f5d7fbd88de797fd$var$EventEmitter;
  $f5d7fbd88de797fd$exports = $f5d7fbd88de797fd$var$EventEmitter;
  var $edbcf3072a01d580$export$3157d57b4135e3bc = /* @__PURE__ */ (function(ConnectionType) {
    ConnectionType["Data"] = "data";
    ConnectionType["Media"] = "media";
    return ConnectionType;
  })({});
  var $edbcf3072a01d580$export$9547aaa2e39030ff = /* @__PURE__ */ (function(PeerErrorType) {
    PeerErrorType["BrowserIncompatible"] = "browser-incompatible";
    PeerErrorType["Disconnected"] = "disconnected";
    PeerErrorType["InvalidID"] = "invalid-id";
    PeerErrorType["InvalidKey"] = "invalid-key";
    PeerErrorType["Network"] = "network";
    PeerErrorType["PeerUnavailable"] = "peer-unavailable";
    PeerErrorType["SslUnavailable"] = "ssl-unavailable";
    PeerErrorType["ServerError"] = "server-error";
    PeerErrorType["SocketError"] = "socket-error";
    PeerErrorType["SocketClosed"] = "socket-closed";
    PeerErrorType["UnavailableID"] = "unavailable-id";
    PeerErrorType["WebRTC"] = "webrtc";
    return PeerErrorType;
  })({});
  var $edbcf3072a01d580$export$7974935686149686 = /* @__PURE__ */ (function(BaseConnectionErrorType) {
    BaseConnectionErrorType["NegotiationFailed"] = "negotiation-failed";
    BaseConnectionErrorType["ConnectionClosed"] = "connection-closed";
    return BaseConnectionErrorType;
  })({});
  var $edbcf3072a01d580$export$49ae800c114df41d = /* @__PURE__ */ (function(DataConnectionErrorType) {
    DataConnectionErrorType["NotOpenYet"] = "not-open-yet";
    DataConnectionErrorType["MessageToBig"] = "message-too-big";
    return DataConnectionErrorType;
  })({});
  var $edbcf3072a01d580$export$89f507cf986a947 = /* @__PURE__ */ (function(SerializationType) {
    SerializationType["Binary"] = "binary";
    SerializationType["BinaryUTF8"] = "binary-utf8";
    SerializationType["JSON"] = "json";
    SerializationType["None"] = "raw";
    return SerializationType;
  })({});
  var $edbcf3072a01d580$export$3b5c4a4b6354f023 = /* @__PURE__ */ (function(SocketEventType) {
    SocketEventType["Message"] = "message";
    SocketEventType["Disconnected"] = "disconnected";
    SocketEventType["Error"] = "error";
    SocketEventType["Close"] = "close";
    return SocketEventType;
  })({});
  var $edbcf3072a01d580$export$adb4a1754da6f10d = /* @__PURE__ */ (function(ServerMessageType) {
    ServerMessageType["Heartbeat"] = "HEARTBEAT";
    ServerMessageType["Candidate"] = "CANDIDATE";
    ServerMessageType["Offer"] = "OFFER";
    ServerMessageType["Answer"] = "ANSWER";
    ServerMessageType["Open"] = "OPEN";
    ServerMessageType["Error"] = "ERROR";
    ServerMessageType["IdTaken"] = "ID-TAKEN";
    ServerMessageType["InvalidKey"] = "INVALID-KEY";
    ServerMessageType["Leave"] = "LEAVE";
    ServerMessageType["Expire"] = "EXPIRE";
    return ServerMessageType;
  })({});
  var $812644bc8c7ccc3e$export$83d89fbfd8236492 = "1.5.5";
  var $5dd3b97502a89fbb$export$4798917dbf149b79 = class extends (0, $f5d7fbd88de797fd$exports.EventEmitter) {
    start(id, token) {
      this._id = id;
      const wsUrl = `${this._baseUrl}&id=${id}&token=${token}`;
      if (!!this._socket || !this._disconnected) return;
      this._socket = new WebSocket(wsUrl + "&version=" + (0, $812644bc8c7ccc3e$export$83d89fbfd8236492));
      this._disconnected = false;
      this._socket.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Server message received:", data);
        } catch (e) {
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Invalid server message", event.data);
          return;
        }
        this.emit((0, $edbcf3072a01d580$export$3b5c4a4b6354f023).Message, data);
      };
      this._socket.onclose = (event) => {
        if (this._disconnected) return;
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Socket closed.", event);
        this._cleanup();
        this._disconnected = true;
        this.emit((0, $edbcf3072a01d580$export$3b5c4a4b6354f023).Disconnected);
      };
      this._socket.onopen = () => {
        if (this._disconnected) return;
        this._sendQueuedMessages();
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Socket open");
        this._scheduleHeartbeat();
      };
    }
    _scheduleHeartbeat() {
      this._wsPingTimer = setTimeout(() => {
        this._sendHeartbeat();
      }, this.pingInterval);
    }
    _sendHeartbeat() {
      if (!this._wsOpen()) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Cannot send heartbeat, because socket closed`);
        return;
      }
      const message = JSON.stringify({
        type: (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Heartbeat
      });
      this._socket.send(message);
      this._scheduleHeartbeat();
    }
    /** Is the websocket currently open? */
    _wsOpen() {
      return !!this._socket && this._socket.readyState === 1;
    }
    /** Send queued messages. */
    _sendQueuedMessages() {
      const copiedQueue = [
        ...this._messagesQueue
      ];
      this._messagesQueue = [];
      for (const message of copiedQueue) this.send(message);
    }
    /** Exposed send for DC & Peer. */
    send(data) {
      if (this._disconnected) return;
      if (!this._id) {
        this._messagesQueue.push(data);
        return;
      }
      if (!data.type) {
        this.emit((0, $edbcf3072a01d580$export$3b5c4a4b6354f023).Error, "Invalid message");
        return;
      }
      if (!this._wsOpen()) return;
      const message = JSON.stringify(data);
      this._socket.send(message);
    }
    close() {
      if (this._disconnected) return;
      this._cleanup();
      this._disconnected = true;
    }
    _cleanup() {
      if (this._socket) {
        this._socket.onopen = this._socket.onmessage = this._socket.onclose = null;
        this._socket.close();
        this._socket = void 0;
      }
      clearTimeout(this._wsPingTimer);
    }
    constructor(secure, host, port, path, key2, pingInterval = 5e3) {
      super(), this.pingInterval = pingInterval, this._disconnected = true, this._messagesQueue = [];
      const wsProtocol = secure ? "wss://" : "ws://";
      this._baseUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key2;
    }
  };
  var $3cabb799c2437cbe$export$89e6bb5ad64bf4a = class {
    /** Returns a PeerConnection object set up correctly (for data, media). */
    startConnection(options) {
      const peerConnection = this._startPeerConnection();
      this.connection.peerConnection = peerConnection;
      if (this.connection.type === (0, $edbcf3072a01d580$export$3157d57b4135e3bc).Media && options._stream) this._addTracksToConnection(options._stream, peerConnection);
      if (options.originator) {
        const dataConnection = this.connection;
        const config = {
          ordered: !!options.reliable
        };
        const dataChannel = peerConnection.createDataChannel(dataConnection.label, config);
        dataConnection._initializeDataChannel(dataChannel);
        this._makeOffer();
      } else this.handleSDP("OFFER", options.sdp);
    }
    /** Start a PC. */
    _startPeerConnection() {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Creating RTCPeerConnection.");
      const peerConnection = new RTCPeerConnection(this.connection.provider.options.config);
      this._setupListeners(peerConnection);
      return peerConnection;
    }
    /** Set up various WebRTC listeners. */
    _setupListeners(peerConnection) {
      const peerId = this.connection.peer;
      const connectionId = this.connection.connectionId;
      const connectionType = this.connection.type;
      const provider = this.connection.provider;
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Listening for ICE candidates.");
      peerConnection.onicecandidate = (evt) => {
        if (!evt.candidate || !evt.candidate.candidate) return;
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Received ICE candidates for ${peerId}:`, evt.candidate);
        provider.socket.send({
          type: (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Candidate,
          payload: {
            candidate: evt.candidate,
            type: connectionType,
            connectionId
          },
          dst: peerId
        });
      };
      peerConnection.oniceconnectionstatechange = () => {
        switch (peerConnection.iceConnectionState) {
          case "failed":
            (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("iceConnectionState is failed, closing connections to " + peerId);
            this.connection.emitError((0, $edbcf3072a01d580$export$7974935686149686).NegotiationFailed, "Negotiation of connection to " + peerId + " failed.");
            this.connection.close();
            break;
          case "closed":
            (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("iceConnectionState is closed, closing connections to " + peerId);
            this.connection.emitError((0, $edbcf3072a01d580$export$7974935686149686).ConnectionClosed, "Connection to " + peerId + " closed.");
            this.connection.close();
            break;
          case "disconnected":
            (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("iceConnectionState changed to disconnected on the connection with " + peerId);
            break;
          case "completed":
            peerConnection.onicecandidate = () => {
            };
            break;
        }
        this.connection.emit("iceStateChanged", peerConnection.iceConnectionState);
      };
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Listening for data channel");
      peerConnection.ondatachannel = (evt) => {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Received data channel");
        const dataChannel = evt.channel;
        const connection = provider.getConnection(peerId, connectionId);
        connection._initializeDataChannel(dataChannel);
      };
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Listening for remote stream");
      peerConnection.ontrack = (evt) => {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Received remote stream");
        const stream = evt.streams[0];
        const connection = provider.getConnection(peerId, connectionId);
        if (connection.type === (0, $edbcf3072a01d580$export$3157d57b4135e3bc).Media) {
          const mediaConnection = connection;
          this._addStreamToMediaConnection(stream, mediaConnection);
        }
      };
    }
    cleanup() {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Cleaning up PeerConnection to " + this.connection.peer);
      const peerConnection = this.connection.peerConnection;
      if (!peerConnection) return;
      this.connection.peerConnection = null;
      peerConnection.onicecandidate = peerConnection.oniceconnectionstatechange = peerConnection.ondatachannel = peerConnection.ontrack = () => {
      };
      const peerConnectionNotClosed = peerConnection.signalingState !== "closed";
      let dataChannelNotClosed = false;
      const dataChannel = this.connection.dataChannel;
      if (dataChannel) dataChannelNotClosed = !!dataChannel.readyState && dataChannel.readyState !== "closed";
      if (peerConnectionNotClosed || dataChannelNotClosed) peerConnection.close();
    }
    async _makeOffer() {
      const peerConnection = this.connection.peerConnection;
      const provider = this.connection.provider;
      try {
        const offer = await peerConnection.createOffer(this.connection.options.constraints);
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Created offer.");
        if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === "function") offer.sdp = this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
        try {
          await peerConnection.setLocalDescription(offer);
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Set localDescription:", offer, `for:${this.connection.peer}`);
          let payload = {
            sdp: offer,
            type: this.connection.type,
            connectionId: this.connection.connectionId,
            metadata: this.connection.metadata
          };
          if (this.connection.type === (0, $edbcf3072a01d580$export$3157d57b4135e3bc).Data) {
            const dataConnection = this.connection;
            payload = {
              ...payload,
              label: dataConnection.label,
              reliable: dataConnection.reliable,
              serialization: dataConnection.serialization
            };
          }
          provider.socket.send({
            type: (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Offer,
            payload,
            dst: this.connection.peer
          });
        } catch (err) {
          if (err != "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer") {
            provider.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).WebRTC, err);
            (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Failed to setLocalDescription, ", err);
          }
        }
      } catch (err_1) {
        provider.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).WebRTC, err_1);
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Failed to createOffer, ", err_1);
      }
    }
    async _makeAnswer() {
      const peerConnection = this.connection.peerConnection;
      const provider = this.connection.provider;
      try {
        const answer = await peerConnection.createAnswer();
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Created answer.");
        if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === "function") answer.sdp = this.connection.options.sdpTransform(answer.sdp) || answer.sdp;
        try {
          await peerConnection.setLocalDescription(answer);
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Set localDescription:`, answer, `for:${this.connection.peer}`);
          provider.socket.send({
            type: (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Answer,
            payload: {
              sdp: answer,
              type: this.connection.type,
              connectionId: this.connection.connectionId
            },
            dst: this.connection.peer
          });
        } catch (err) {
          provider.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).WebRTC, err);
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Failed to setLocalDescription, ", err);
        }
      } catch (err_1) {
        provider.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).WebRTC, err_1);
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Failed to create answer, ", err_1);
      }
    }
    /** Handle an SDP. */
    async handleSDP(type, sdp) {
      sdp = new RTCSessionDescription(sdp);
      const peerConnection = this.connection.peerConnection;
      const provider = this.connection.provider;
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Setting remote description", sdp);
      const self2 = this;
      try {
        await peerConnection.setRemoteDescription(sdp);
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Set remoteDescription:${type} for:${this.connection.peer}`);
        if (type === "OFFER") await self2._makeAnswer();
      } catch (err) {
        provider.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).WebRTC, err);
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Failed to setRemoteDescription, ", err);
      }
    }
    /** Handle a candidate. */
    async handleCandidate(ice) {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`handleCandidate:`, ice);
      try {
        await this.connection.peerConnection.addIceCandidate(ice);
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Added ICE candidate for:${this.connection.peer}`);
      } catch (err) {
        this.connection.provider.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).WebRTC, err);
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Failed to handleCandidate, ", err);
      }
    }
    _addTracksToConnection(stream, peerConnection) {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`add tracks from stream ${stream.id} to peer connection`);
      if (!peerConnection.addTrack) return (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error(`Your browser does't support RTCPeerConnection#addTrack. Ignored.`);
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
    }
    _addStreamToMediaConnection(stream, mediaConnection) {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`add stream ${stream.id} to media connection ${mediaConnection.connectionId}`);
      mediaConnection.addStream(stream);
    }
    constructor(connection) {
      this.connection = connection;
    }
  };
  var $41eb28b5735ed6cf$export$6a678e589c8a4542 = class extends (0, $f5d7fbd88de797fd$exports.EventEmitter) {
    /**
    * Emits a typed error message.
    *
    * @internal
    */
    emitError(type, err) {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error("Error:", err);
      this.emit("error", new $41eb28b5735ed6cf$export$98871882f492de82(`${type}`, err));
    }
  };
  var $41eb28b5735ed6cf$export$98871882f492de82 = class extends Error {
    /**
    * @internal
    */
    constructor(type, err) {
      if (typeof err === "string") super(err);
      else {
        super();
        Object.assign(this, err);
      }
      this.type = type;
    }
  };
  var $f06f075a81a8b63e$export$23a2a68283c24d80 = class extends (0, $41eb28b5735ed6cf$export$6a678e589c8a4542) {
    /**
    * Whether the media connection is active (e.g. your call has been answered).
    * You can check this if you want to set a maximum wait time for a one-sided call.
    */
    get open() {
      return this._open;
    }
    constructor(peer, provider, options) {
      super(), this.peer = peer, this.provider = provider, this.options = options, this._open = false;
      this.metadata = options.metadata;
    }
  };
  var $0bc12d7ac26e1491$export$4a84e95a2324ac29 = class _$0bc12d7ac26e1491$export$4a84e95a2324ac29 extends (0, $f06f075a81a8b63e$export$23a2a68283c24d80) {
    /**
    * For media connections, this is always 'media'.
    */
    get type() {
      return (0, $edbcf3072a01d580$export$3157d57b4135e3bc).Media;
    }
    get localStream() {
      return this._localStream;
    }
    get remoteStream() {
      return this._remoteStream;
    }
    /** Called by the Negotiator when the DataChannel is ready. */
    _initializeDataChannel(dc) {
      this.dataChannel = dc;
      this.dataChannel.onopen = () => {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc connection success`);
        this.emit("willCloseOnRemote");
      };
      this.dataChannel.onclose = () => {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc closed for:`, this.peer);
        this.close();
      };
    }
    addStream(remoteStream) {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log("Receiving stream", remoteStream);
      this._remoteStream = remoteStream;
      super.emit("stream", remoteStream);
    }
    /**
    * @internal
    */
    handleMessage(message) {
      const type = message.type;
      const payload = message.payload;
      switch (message.type) {
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Answer:
          this._negotiator.handleSDP(type, payload.sdp);
          this._open = true;
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Candidate:
          this._negotiator.handleCandidate(payload.candidate);
          break;
        default:
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn(`Unrecognized message type:${type} from peer:${this.peer}`);
          break;
      }
    }
    /**
         * When receiving a {@apilink PeerEvents | `call`} event on a peer, you can call
         * `answer` on the media connection provided by the callback to accept the call
         * and optionally send your own media stream.
    
         *
         * @param stream A WebRTC media stream.
         * @param options
         * @returns
         */
    answer(stream, options = {}) {
      if (this._localStream) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");
        return;
      }
      this._localStream = stream;
      if (options && options.sdpTransform) this.options.sdpTransform = options.sdpTransform;
      this._negotiator.startConnection({
        ...this.options._payload,
        _stream: stream
      });
      const messages = this.provider._getMessages(this.connectionId);
      for (const message of messages) this.handleMessage(message);
      this._open = true;
    }
    /**
    * Exposed functionality for users.
    */
    /**
    * Closes the media connection.
    */
    close() {
      if (this._negotiator) {
        this._negotiator.cleanup();
        this._negotiator = null;
      }
      this._localStream = null;
      this._remoteStream = null;
      if (this.provider) {
        this.provider._removeConnection(this);
        this.provider = null;
      }
      if (this.options && this.options._stream) this.options._stream = null;
      if (!this.open) return;
      this._open = false;
      super.emit("close");
    }
    constructor(peerId, provider, options) {
      super(peerId, provider, options);
      this._localStream = this.options._stream;
      this.connectionId = this.options.connectionId || _$0bc12d7ac26e1491$export$4a84e95a2324ac29.ID_PREFIX + (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).randomToken();
      this._negotiator = new (0, $3cabb799c2437cbe$export$89e6bb5ad64bf4a)(this);
      if (this._localStream) this._negotiator.startConnection({
        _stream: this._localStream,
        originator: true
      });
    }
  };
  $0bc12d7ac26e1491$export$4a84e95a2324ac29.ID_PREFIX = "mc_";
  var $4c932c6613316196$export$2c4e825dc9120f87 = class {
    _buildRequest(method) {
      const protocol = this._options.secure ? "https" : "http";
      const { host, port, path, key: key2 } = this._options;
      const url = new URL(`${protocol}://${host}:${port}${path}${key2}/${method}`);
      url.searchParams.set("ts", `${Date.now()}${Math.random()}`);
      url.searchParams.set("version", (0, $812644bc8c7ccc3e$export$83d89fbfd8236492));
      return fetch(url.href, {
        referrerPolicy: this._options.referrerPolicy
      });
    }
    /** Get a unique ID from the server via XHR and initialize with it. */
    async retrieveId() {
      try {
        const response = await this._buildRequest("id");
        if (response.status !== 200) throw new Error(`Error. Status:${response.status}`);
        return response.text();
      } catch (error) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error("Error retrieving ID", error);
        let pathError = "";
        if (this._options.path === "/" && this._options.host !== (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).CLOUD_HOST) pathError = " If you passed in a `path` to your self-hosted PeerServer, you'll also need to pass in that same path when creating a new Peer.";
        throw new Error("Could not get an ID from the server." + pathError);
      }
    }
    /** @deprecated */
    async listAllPeers() {
      try {
        const response = await this._buildRequest("peers");
        if (response.status !== 200) {
          if (response.status === 401) {
            let helpfulError = "";
            if (this._options.host === (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).CLOUD_HOST) helpfulError = "It looks like you're using the cloud server. You can email team@peerjs.com to enable peer listing for your API key.";
            else helpfulError = "You need to enable `allow_discovery` on your self-hosted PeerServer to use this feature.";
            throw new Error("It doesn't look like you have permission to list peers IDs. " + helpfulError);
          }
          throw new Error(`Error. Status:${response.status}`);
        }
        return response.json();
      } catch (error) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error("Error retrieving list peers", error);
        throw new Error("Could not get list peers from the server." + error);
      }
    }
    constructor(_options) {
      this._options = _options;
    }
  };
  var $392ccce28b647101$export$d365f7ad9d7df9c9 = class _$392ccce28b647101$export$d365f7ad9d7df9c9 extends (0, $f06f075a81a8b63e$export$23a2a68283c24d80) {
    get type() {
      return (0, $edbcf3072a01d580$export$3157d57b4135e3bc).Data;
    }
    /** Called by the Negotiator when the DataChannel is ready. */
    _initializeDataChannel(dc) {
      this.dataChannel = dc;
      this.dataChannel.onopen = () => {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc connection success`);
        this._open = true;
        this.emit("open");
      };
      this.dataChannel.onmessage = (e) => {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc onmessage:`, e.data);
      };
      this.dataChannel.onclose = () => {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`DC#${this.connectionId} dc closed for:`, this.peer);
        this.close();
      };
    }
    /**
    * Exposed functionality for users.
    */
    /** Allows user to close connection. */
    close(options) {
      if (options?.flush) {
        this.send({
          __peerData: {
            type: "close"
          }
        });
        return;
      }
      if (this._negotiator) {
        this._negotiator.cleanup();
        this._negotiator = null;
      }
      if (this.provider) {
        this.provider._removeConnection(this);
        this.provider = null;
      }
      if (this.dataChannel) {
        this.dataChannel.onopen = null;
        this.dataChannel.onmessage = null;
        this.dataChannel.onclose = null;
        this.dataChannel = null;
      }
      if (!this.open) return;
      this._open = false;
      super.emit("close");
    }
    /** Allows user to send data. */
    send(data, chunked = false) {
      if (!this.open) {
        this.emitError((0, $edbcf3072a01d580$export$49ae800c114df41d).NotOpenYet, "Connection is not open. You should listen for the `open` event before sending messages.");
        return;
      }
      return this._send(data, chunked);
    }
    async handleMessage(message) {
      const payload = message.payload;
      switch (message.type) {
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Answer:
          await this._negotiator.handleSDP(message.type, payload.sdp);
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Candidate:
          await this._negotiator.handleCandidate(payload.candidate);
          break;
        default:
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn("Unrecognized message type:", message.type, "from peer:", this.peer);
          break;
      }
    }
    constructor(peerId, provider, options) {
      super(peerId, provider, options);
      this.connectionId = this.options.connectionId || _$392ccce28b647101$export$d365f7ad9d7df9c9.ID_PREFIX + (0, $008766fe99f03c2f$export$4e61f672936bec77)();
      this.label = this.options.label || this.connectionId;
      this.reliable = !!this.options.reliable;
      this._negotiator = new (0, $3cabb799c2437cbe$export$89e6bb5ad64bf4a)(this);
      this._negotiator.startConnection(this.options._payload || {
        originator: true,
        reliable: this.reliable
      });
    }
  };
  $392ccce28b647101$export$d365f7ad9d7df9c9.ID_PREFIX = "dc_";
  $392ccce28b647101$export$d365f7ad9d7df9c9.MAX_BUFFERED_AMOUNT = 8388608;
  var $8d1d5e45d8d6520c$export$ff7c9d4c11d94e8b = class extends (0, $392ccce28b647101$export$d365f7ad9d7df9c9) {
    get bufferSize() {
      return this._bufferSize;
    }
    _initializeDataChannel(dc) {
      super._initializeDataChannel(dc);
      this.dataChannel.binaryType = "arraybuffer";
      this.dataChannel.addEventListener("message", (e) => this._handleDataMessage(e));
    }
    _bufferedSend(msg) {
      if (this._buffering || !this._trySend(msg)) {
        this._buffer.push(msg);
        this._bufferSize = this._buffer.length;
      }
    }
    // Returns true if the send succeeds.
    _trySend(msg) {
      if (!this.open) return false;
      if (this.dataChannel.bufferedAmount > (0, $392ccce28b647101$export$d365f7ad9d7df9c9).MAX_BUFFERED_AMOUNT) {
        this._buffering = true;
        setTimeout(() => {
          this._buffering = false;
          this._tryBuffer();
        }, 50);
        return false;
      }
      try {
        this.dataChannel.send(msg);
      } catch (e) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error(`DC#:${this.connectionId} Error when sending:`, e);
        this._buffering = true;
        this.close();
        return false;
      }
      return true;
    }
    // Try to send the first message in the buffer.
    _tryBuffer() {
      if (!this.open) return;
      if (this._buffer.length === 0) return;
      const msg = this._buffer[0];
      if (this._trySend(msg)) {
        this._buffer.shift();
        this._bufferSize = this._buffer.length;
        this._tryBuffer();
      }
    }
    close(options) {
      if (options?.flush) {
        this.send({
          __peerData: {
            type: "close"
          }
        });
        return;
      }
      this._buffer = [];
      this._bufferSize = 0;
      super.close();
    }
    constructor(...args) {
      super(...args), this._buffer = [], this._bufferSize = 0, this._buffering = false;
    }
  };
  var $6b2c8b37149b9a13$export$f0a5a64d5bb37108 = class extends (0, $8d1d5e45d8d6520c$export$ff7c9d4c11d94e8b) {
    close(options) {
      super.close(options);
      this._chunkedData = {};
    }
    // Handles a DataChannel message.
    _handleDataMessage({ data }) {
      const deserializedData = (0, $bf7fb46c6d68ead7$export$417857010dc9287f)(data);
      const peerData = deserializedData["__peerData"];
      if (peerData) {
        if (peerData.type === "close") {
          this.close();
          return;
        }
        this._handleChunk(deserializedData);
        return;
      }
      this.emit("data", deserializedData);
    }
    _handleChunk(data) {
      const id = data.__peerData;
      const chunkInfo = this._chunkedData[id] || {
        data: [],
        count: 0,
        total: data.total
      };
      chunkInfo.data[data.n] = new Uint8Array(data.data);
      chunkInfo.count++;
      this._chunkedData[id] = chunkInfo;
      if (chunkInfo.total === chunkInfo.count) {
        delete this._chunkedData[id];
        const data2 = (0, $616ebdf1c4998439$export$52c89ebcdc4f53f2)(chunkInfo.data);
        this._handleDataMessage({
          data: data2
        });
      }
    }
    _send(data, chunked) {
      const blob = (0, $bf7fb46c6d68ead7$export$2a703dbb0cb35339)(data);
      if (blob instanceof Promise) return this._send_blob(blob);
      if (!chunked && blob.byteLength > this.chunker.chunkedMTU) {
        this._sendChunks(blob);
        return;
      }
      this._bufferedSend(blob);
    }
    async _send_blob(blobPromise) {
      const blob = await blobPromise;
      if (blob.byteLength > this.chunker.chunkedMTU) {
        this._sendChunks(blob);
        return;
      }
      this._bufferedSend(blob);
    }
    _sendChunks(blob) {
      const blobs = this.chunker.chunk(blob);
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`DC#${this.connectionId} Try to send ${blobs.length} chunks...`);
      for (const blob2 of blobs) this.send(blob2, true);
    }
    constructor(peerId, provider, options) {
      super(peerId, provider, options), this.chunker = new (0, $616ebdf1c4998439$export$f1c5f4c9cb95390b)(), this.serialization = (0, $edbcf3072a01d580$export$89f507cf986a947).Binary, this._chunkedData = {};
    }
  };
  var $6faa8477ae391a66$export$6f88fe47d32c9c94 = class extends (0, $8d1d5e45d8d6520c$export$ff7c9d4c11d94e8b) {
    _handleDataMessage({ data }) {
      super.emit("data", data);
    }
    _send(data, _chunked) {
      this._bufferedSend(data);
    }
    constructor(...args) {
      super(...args), this.serialization = (0, $edbcf3072a01d580$export$89f507cf986a947).None;
    }
  };
  var $b524315f5ff1ee78$export$48880ac635f47186 = class extends (0, $8d1d5e45d8d6520c$export$ff7c9d4c11d94e8b) {
    // Handles a DataChannel message.
    _handleDataMessage({ data }) {
      const deserializedData = this.parse(this.decoder.decode(data));
      const peerData = deserializedData["__peerData"];
      if (peerData && peerData.type === "close") {
        this.close();
        return;
      }
      this.emit("data", deserializedData);
    }
    _send(data, _chunked) {
      const encodedData = this.encoder.encode(this.stringify(data));
      if (encodedData.byteLength >= (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).chunkedMTU) {
        this.emitError((0, $edbcf3072a01d580$export$49ae800c114df41d).MessageToBig, "Message too big for JSON channel");
        return;
      }
      this._bufferedSend(encodedData);
    }
    constructor(...args) {
      super(...args), this.serialization = (0, $edbcf3072a01d580$export$89f507cf986a947).JSON, this.encoder = new TextEncoder(), this.decoder = new TextDecoder(), this.stringify = JSON.stringify, this.parse = JSON.parse;
    }
  };
  var $11967427976ce06d$export$ecd1fc136c422448 = class _$11967427976ce06d$export$ecd1fc136c422448 extends (0, $41eb28b5735ed6cf$export$6a678e589c8a4542) {
    /**
    * The brokering ID of this peer
    *
    * If no ID was specified in {@apilink Peer | the constructor},
    * this will be `undefined` until the {@apilink PeerEvents | `open`} event is emitted.
    */
    get id() {
      return this._id;
    }
    get options() {
      return this._options;
    }
    get open() {
      return this._open;
    }
    /**
    * @internal
    */
    get socket() {
      return this._socket;
    }
    /**
    * A hash of all connections associated with this peer, keyed by the remote peer's ID.
    * @deprecated
    * Return type will change from Object to Map<string,[]>
    */
    get connections() {
      const plainConnections = /* @__PURE__ */ Object.create(null);
      for (const [k, v] of this._connections) plainConnections[k] = v;
      return plainConnections;
    }
    /**
    * true if this peer and all of its connections can no longer be used.
    */
    get destroyed() {
      return this._destroyed;
    }
    /**
    * false if there is an active connection to the PeerServer.
    */
    get disconnected() {
      return this._disconnected;
    }
    _createServerConnection() {
      const socket = new (0, $5dd3b97502a89fbb$export$4798917dbf149b79)(this._options.secure, this._options.host, this._options.port, this._options.path, this._options.key, this._options.pingInterval);
      socket.on((0, $edbcf3072a01d580$export$3b5c4a4b6354f023).Message, (data) => {
        this._handleMessage(data);
      });
      socket.on((0, $edbcf3072a01d580$export$3b5c4a4b6354f023).Error, (error) => {
        this._abort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).SocketError, error);
      });
      socket.on((0, $edbcf3072a01d580$export$3b5c4a4b6354f023).Disconnected, () => {
        if (this.disconnected) return;
        this.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).Network, "Lost connection to server.");
        this.disconnect();
      });
      socket.on((0, $edbcf3072a01d580$export$3b5c4a4b6354f023).Close, () => {
        if (this.disconnected) return;
        this._abort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).SocketClosed, "Underlying socket is already closed.");
      });
      return socket;
    }
    /** Initialize a connection with the server. */
    _initialize(id) {
      this._id = id;
      this.socket.start(id, this._options.token);
    }
    /** Handles messages from the server. */
    _handleMessage(message) {
      const type = message.type;
      const payload = message.payload;
      const peerId = message.src;
      switch (type) {
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Open:
          this._lastServerId = this.id;
          this._open = true;
          this.emit("open", this.id);
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Error:
          this._abort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).ServerError, payload.msg);
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).IdTaken:
          this._abort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).UnavailableID, `ID "${this.id}" is taken`);
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).InvalidKey:
          this._abort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).InvalidKey, `API KEY "${this._options.key}" is invalid`);
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Leave:
          (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Received leave message from ${peerId}`);
          this._cleanupPeer(peerId);
          this._connections.delete(peerId);
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Expire:
          this.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).PeerUnavailable, `Could not connect to peer ${peerId}`);
          break;
        case (0, $edbcf3072a01d580$export$adb4a1754da6f10d).Offer: {
          const connectionId = payload.connectionId;
          let connection = this.getConnection(peerId, connectionId);
          if (connection) {
            connection.close();
            (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn(`Offer received for existing Connection ID:${connectionId}`);
          }
          if (payload.type === (0, $edbcf3072a01d580$export$3157d57b4135e3bc).Media) {
            const mediaConnection = new (0, $0bc12d7ac26e1491$export$4a84e95a2324ac29)(peerId, this, {
              connectionId,
              _payload: payload,
              metadata: payload.metadata
            });
            connection = mediaConnection;
            this._addConnection(peerId, connection);
            this.emit("call", mediaConnection);
          } else if (payload.type === (0, $edbcf3072a01d580$export$3157d57b4135e3bc).Data) {
            const dataConnection = new this._serializers[payload.serialization](peerId, this, {
              connectionId,
              _payload: payload,
              metadata: payload.metadata,
              label: payload.label,
              serialization: payload.serialization,
              reliable: payload.reliable
            });
            connection = dataConnection;
            this._addConnection(peerId, connection);
            this.emit("connection", dataConnection);
          } else {
            (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn(`Received malformed connection type:${payload.type}`);
            return;
          }
          const messages = this._getMessages(connectionId);
          for (const message2 of messages) connection.handleMessage(message2);
          break;
        }
        default: {
          if (!payload) {
            (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn(`You received a malformed message from ${peerId} of type ${type}`);
            return;
          }
          const connectionId = payload.connectionId;
          const connection = this.getConnection(peerId, connectionId);
          if (connection && connection.peerConnection)
            connection.handleMessage(message);
          else if (connectionId)
            this._storeMessage(connectionId, message);
          else (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn("You received an unrecognized message:", message);
          break;
        }
      }
    }
    /** Stores messages without a set up connection, to be claimed later. */
    _storeMessage(connectionId, message) {
      if (!this._lostMessages.has(connectionId)) this._lostMessages.set(connectionId, []);
      this._lostMessages.get(connectionId).push(message);
    }
    /**
    * Retrieve messages from lost message store
    * @internal
    */
    //TODO Change it to private
    _getMessages(connectionId) {
      const messages = this._lostMessages.get(connectionId);
      if (messages) {
        this._lostMessages.delete(connectionId);
        return messages;
      }
      return [];
    }
    /**
    * Connects to the remote peer specified by id and returns a data connection.
    * @param peer The brokering ID of the remote peer (their {@apilink Peer.id}).
    * @param options for specifying details about Peer Connection
    */
    connect(peer, options = {}) {
      options = {
        serialization: "default",
        ...options
      };
      if (this.disconnected) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect, or call reconnect on this peer if you believe its ID to still be available.");
        this.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).Disconnected, "Cannot connect to new Peer after disconnecting from server.");
        return;
      }
      const dataConnection = new this._serializers[options.serialization](peer, this, options);
      this._addConnection(peer, dataConnection);
      return dataConnection;
    }
    /**
    * Calls the remote peer specified by id and returns a media connection.
    * @param peer The brokering ID of the remote peer (their peer.id).
    * @param stream The caller's media stream
    * @param options Metadata associated with the connection, passed in by whoever initiated the connection.
    */
    call(peer, stream, options = {}) {
      if (this.disconnected) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).warn("You cannot connect to a new Peer because you called .disconnect() on this Peer and ended your connection with the server. You can create a new Peer to reconnect.");
        this.emitError((0, $edbcf3072a01d580$export$9547aaa2e39030ff).Disconnected, "Cannot connect to new Peer after disconnecting from server.");
        return;
      }
      if (!stream) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");
        return;
      }
      const mediaConnection = new (0, $0bc12d7ac26e1491$export$4a84e95a2324ac29)(peer, this, {
        ...options,
        _stream: stream
      });
      this._addConnection(peer, mediaConnection);
      return mediaConnection;
    }
    /** Add a data/media connection to this peer. */
    _addConnection(peerId, connection) {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`add connection ${connection.type}:${connection.connectionId} to peerId:${peerId}`);
      if (!this._connections.has(peerId)) this._connections.set(peerId, []);
      this._connections.get(peerId).push(connection);
    }
    //TODO should be private
    _removeConnection(connection) {
      const connections = this._connections.get(connection.peer);
      if (connections) {
        const index = connections.indexOf(connection);
        if (index !== -1) connections.splice(index, 1);
      }
      this._lostMessages.delete(connection.connectionId);
    }
    /** Retrieve a data/media connection for this peer. */
    getConnection(peerId, connectionId) {
      const connections = this._connections.get(peerId);
      if (!connections) return null;
      for (const connection of connections) {
        if (connection.connectionId === connectionId) return connection;
      }
      return null;
    }
    _delayedAbort(type, message) {
      setTimeout(() => {
        this._abort(type, message);
      }, 0);
    }
    /**
    * Emits an error message and destroys the Peer.
    * The Peer is not destroyed if it's in a disconnected state, in which case
    * it retains its disconnected state and its existing connections.
    */
    _abort(type, message) {
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error("Aborting!");
      this.emitError(type, message);
      if (!this._lastServerId) this.destroy();
      else this.disconnect();
    }
    /**
    * Destroys the Peer: closes all active connections as well as the connection
    * to the server.
    *
    * :::caution
    * This cannot be undone; the respective peer object will no longer be able
    * to create or receive any connections, its ID will be forfeited on the server,
    * and all of its data and media connections will be closed.
    * :::
    */
    destroy() {
      if (this.destroyed) return;
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Destroy peer with ID:${this.id}`);
      this.disconnect();
      this._cleanup();
      this._destroyed = true;
      this.emit("close");
    }
    /** Disconnects every connection on this peer. */
    _cleanup() {
      for (const peerId of this._connections.keys()) {
        this._cleanupPeer(peerId);
        this._connections.delete(peerId);
      }
      this.socket.removeAllListeners();
    }
    /** Closes all connections to this peer. */
    _cleanupPeer(peerId) {
      const connections = this._connections.get(peerId);
      if (!connections) return;
      for (const connection of connections) connection.close();
    }
    /**
    * Disconnects the Peer's connection to the PeerServer. Does not close any
    *  active connections.
    * Warning: The peer can no longer create or accept connections after being
    *  disconnected. It also cannot reconnect to the server.
    */
    disconnect() {
      if (this.disconnected) return;
      const currentId = this.id;
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Disconnect peer with ID:${currentId}`);
      this._disconnected = true;
      this._open = false;
      this.socket.close();
      this._lastServerId = currentId;
      this._id = null;
      this.emit("disconnected", currentId);
    }
    /** Attempts to reconnect with the same ID.
    *
    * Only {@apilink Peer.disconnect | disconnected peers} can be reconnected.
    * Destroyed peers cannot be reconnected.
    * If the connection fails (as an example, if the peer's old ID is now taken),
    * the peer's existing connections will not close, but any associated errors events will fire.
    */
    reconnect() {
      if (this.disconnected && !this.destroyed) {
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).log(`Attempting reconnection to server with ID ${this._lastServerId}`);
        this._disconnected = false;
        this._initialize(this._lastServerId);
      } else if (this.destroyed) throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");
      else if (!this.disconnected && !this.open)
        (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).error("In a hurry? We're still trying to make the initial connection!");
      else throw new Error(`Peer ${this.id} cannot reconnect because it is not disconnected from the server!`);
    }
    /**
    * Get a list of available peer IDs. If you're running your own server, you'll
    * want to set allow_discovery: true in the PeerServer options. If you're using
    * the cloud server, email team@peerjs.com to get the functionality enabled for
    * your key.
    */
    listAllPeers(cb = (_) => {
    }) {
      this._api.listAllPeers().then((peers) => cb(peers)).catch((error) => this._abort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).ServerError, error));
    }
    constructor(id, options) {
      super(), this._serializers = {
        raw: (0, $6faa8477ae391a66$export$6f88fe47d32c9c94),
        json: (0, $b524315f5ff1ee78$export$48880ac635f47186),
        binary: (0, $6b2c8b37149b9a13$export$f0a5a64d5bb37108),
        "binary-utf8": (0, $6b2c8b37149b9a13$export$f0a5a64d5bb37108),
        default: (0, $6b2c8b37149b9a13$export$f0a5a64d5bb37108)
      }, this._id = null, this._lastServerId = null, // States.
      this._destroyed = false, this._disconnected = false, this._open = false, this._connections = /* @__PURE__ */ new Map(), this._lostMessages = /* @__PURE__ */ new Map();
      let userId;
      if (id && id.constructor == Object) options = id;
      else if (id) userId = id.toString();
      options = {
        debug: 0,
        host: (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).CLOUD_HOST,
        port: (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).CLOUD_PORT,
        path: "/",
        key: _$11967427976ce06d$export$ecd1fc136c422448.DEFAULT_KEY,
        token: (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).randomToken(),
        config: (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).defaultConfig,
        referrerPolicy: "strict-origin-when-cross-origin",
        serializers: {},
        ...options
      };
      this._options = options;
      this._serializers = {
        ...this._serializers,
        ...this.options.serializers
      };
      if (this._options.host === "/") this._options.host = window.location.hostname;
      if (this._options.path) {
        if (this._options.path[0] !== "/") this._options.path = "/" + this._options.path;
        if (this._options.path[this._options.path.length - 1] !== "/") this._options.path += "/";
      }
      if (this._options.secure === void 0 && this._options.host !== (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).CLOUD_HOST) this._options.secure = (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).isSecure();
      else if (this._options.host == (0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).CLOUD_HOST) this._options.secure = true;
      if (this._options.logFunction) (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).setLogFunction(this._options.logFunction);
      (0, $d3fc3aacca52312c$export$2e2bcd8739ae039).logLevel = this._options.debug || 0;
      this._api = new (0, $4c932c6613316196$export$2c4e825dc9120f87)(options);
      this._socket = this._createServerConnection();
      if (!(0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).supports.audioVideo && !(0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).supports.data) {
        this._delayedAbort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).BrowserIncompatible, "The current browser does not support WebRTC");
        return;
      }
      if (!!userId && !(0, $01f0d223090cb1f8$export$7debb50ef11d5e0b).validateId(userId)) {
        this._delayedAbort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).InvalidID, `ID "${userId}" is invalid`);
        return;
      }
      if (userId) this._initialize(userId);
      else this._api.retrieveId().then((id2) => this._initialize(id2)).catch((error) => this._abort((0, $edbcf3072a01d580$export$9547aaa2e39030ff).ServerError, error));
    }
  };
  $11967427976ce06d$export$ecd1fc136c422448.DEFAULT_KEY = "peerjs";
  var Peer = (0, $11967427976ce06d$export$ecd1fc136c422448);

  // src/Core/Multiplayer.js
  var Multiplayer = class {
    constructor() {
    }
    getPeerId() {
      return this._peerId;
    }
    bindDataCallback(callback) {
      this._peerDataCallback = callback;
    }
    getConnectedIds() {
      return this._connectedPeerIds;
    }
    sendToAll(data) {
      if (!this._connections) return;
      this._connections.forEach(function(conn) {
        try {
          conn.send(data);
        } catch (err) {
        }
      });
    }
    sendToPeer(data, peerId = null) {
      try {
        if (!this._connections) {
          this._connection.send(data);
        } else {
          var conn = this._connections.filter((connection) => connection.peer == peerId);
          conn[0].send(data);
        }
      } catch (err) {
      }
    }
    closePeer() {
      if (this._connection) {
        this._connection.close();
        this._connection = null;
      } else if (this._connections) {
        this._connections.forEach(function(conn) {
          conn.close();
        });
        this._connections = null;
      }
    }
    setConnectPeerCallback(callback) {
      this._connectPeerCallback = callback;
    }
    setPeerCloseCallback(callback) {
      this._peerCloseCallback = callback;
    }
    createPeer(peerOptions = {}) {
      this._peerId = Utils.getRandomDigits(6);
      this._peer = new Peer(this._peerId, peerOptions);
      this._connections = [];
      this._connectedPeerIds = [];
      this._peer.on("connection", (function(conn) {
        console.log("[GameLib] P2P Connection from " + conn.peer);
        this._connectedPeerIds.push(conn.peer);
        conn.on("data", (function(data) {
          if (this._peerDataCallback) {
            this._peerDataCallback(data, conn);
          }
        }).bind(this));
        conn.on("close", (function() {
          console.log("[GameLib] P2P Disconnected: " + conn.peer);
          this._connections = this._connections.filter((c) => c.peer != conn.peer);
          this._connectedPeerIds = this._connectedPeerIds.filter((id) => conn.peer != id);
          if (this._peerCloseCallback) {
            this._peerCloseCallback(conn);
          }
        }).bind(this));
        this._connections.push(conn);
        if (this._connectPeerCallback) {
          this._connectPeerCallback(conn);
        }
      }).bind(this));
    }
    isPeerDisconnected() {
      return this._disconnected;
    }
    connectPeer(peerId, peerOptions = {}) {
      this._peerId = Utils.getRandomDigits(6);
      this._peer = new Peer(this._peerId, peerOptions);
      this._peer.on("open", (function() {
        this._disconnected = false;
        var conn = this._peer.connect(peerId);
        this._connection = conn;
        conn.on("close", (function() {
          this._disconnected = true;
        }).bind(this));
        conn.on("open", (function() {
          conn.send({
            "type": "JOIN",
            "data": this._peerId
          });
          conn.on("data", (function(data) {
            if (this._peerDataCallback) {
              this._peerDataCallback(data, conn);
            }
          }).bind(this));
        }).bind(this));
      }).bind(this));
    }
  };

  // src/Core/index.js
  var GameLibCore2 = class {
    constructor() {
      throw new GameLibError("Class GameLibCore may not be constructed!");
    }
    static Error = GameLibError;
    static Utils = Utils;
    static InputManager = InputManager;
    static AudioManager = AudioManager;
    static GameLibBase = GameLibBase;
    static Storage = Storage;
    static Store = Store;
    static FullscreenManager = FullscreenManager;
    static Multiplayer = Multiplayer;
  };

  // src/2D/Coord.js
  var Coord2 = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    move(dx, dy) {
      this.x += dx;
      this.y += dy;
    }
    moveTo(x, y) {
      this.x = x;
      this.y = y;
    }
  };

  // src/2D/Size.js
  var Size2 = class {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    mod(dw, dh) {
      this.width += dw;
      this.height += dh;
    }
    modTo(w, h) {
      this.width = w;
      this.height = h;
    }
  };

  // src/2D/Box.js
  var Box2 = class {
    constructor(coord, size) {
      this.coord = coord;
      this.size = size;
    }
    move(dx, dy) {
      this.coord.move(dx, dy);
    }
    moveTo(x, y) {
      this.coord.moveTo(x, y);
    }
    resize(dw, dh) {
      this.size.mod(dw, dh);
    }
    resizeTo(w, h) {
      this.size.modTo(w, h);
    }
    get x() {
      return this.coord.x;
    }
    get y() {
      return this.coord.y;
    }
    get width() {
      return this.size.width;
    }
    get height() {
      return this.size.height;
    }
    checkCollision(otherBox) {
      var checkCollisionInternal = (function(x1, y1, w1, h1, x2, y2, w2, h2) {
        var overlapX = x1 < x2 + w2 && x1 + w1 > x2;
        var overlapY = y1 < y2 + h2 && y1 + h1 > y2;
        var collision = overlapX && overlapY;
        return collision;
      });
      return checkCollisionInternal(this.coord.x, this.coord.y, this.size.width, this.size.height, otherBox.x, otherBox.y, otherBox.width, otherBox.height);
    }
  };

  // src/2D/Rotation.js
  var Rotation = class {
    constructor(deg) {
      this._deg = deg;
      this.rotateTo(this._deg);
    }
    static d2r(deg) {
      return deg * Math.PI / 180;
    }
    static r2d(rad) {
      return rad * (180 / Math.PI);
    }
    rotate(deg) {
      this.rotateTo(this._deg + deg);
    }
    rotateTo(deg) {
      this._deg = deg;
      if (this._deg >= 360) {
        this.rotateTo(this._deg - 360);
      }
      if (this._deg < 0) {
        this.rotateTo(this._deg + 360);
      }
    }
    valueOf() {
      return this._deg;
    }
    get degrees() {
      return this._deg;
    }
    get radians() {
      return GameLib2D.Rotation.d2r(this._deg);
    }
    getVelocityMod() {
      var rad = GameLib2D.Rotation.d2r(this._deg);
      var vx = Math.sin(rad);
      var vy = -Math.cos(rad);
      return [vx, vy];
    }
  };

  // src/2D/Sprite.js
  var Sprite = class extends Box2 {
    constructor(pos, size, scene) {
      super(pos, size);
      this.scene = scene;
      this.image = null;
      this.fillColor = "#000000";
      this.gameLib = new GameLib();
      this.gameLib.addSprite(this);
      this.ctx = this.gameLib.ctx;
      this.triggers = [];
    }
    update() {
    }
    draw() {
      if (this.image != null) {
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      } else {
        this.ctx.fillStyle = this.fillColor;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
    addTrigger(triggerID, callback) {
      this.triggers[triggerID] = callback;
    }
    trigger(triggerID) {
      if (this.triggers[triggerID]) {
        this.triggers[triggerID]();
      }
    }
    checkBounds() {
      if (this.x < 0) {
        this.moveTo(0, this.y);
        this.trigger("bounds");
      }
      if (this.x > this.gameLib.canvas.width - this.width) {
        this.moveTo(this.gameLib.canvas.width - this.width, this.y);
        this.trigger("bounds");
      }
      if (this.y < 0) {
        this.moveTo(this.x, 0);
        this.trigger("bounds");
      }
      if (this.y > this.gameLib.canvas.height - this.height) {
        this.moveTo(this.x, this.gameLib.canvas.height - this.height);
        this.trigger("bounds");
      }
    }
    drawHitbox() {
      this.ctx.strokeStyle = this.fillColor;
      this.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  };

  // src/2D/GameLib.js
  var GameLib = class _GameLib extends GameLibCore2.GameLibBase {
    constructor(renderCanvas, renderCtx, viewportCanvas, viewportCtx) {
      if (GameLib2D2.GameLib._instance != null) {
        delete this;
        return GameLib2D2.GameLib._instance;
      } else {
        console.log("[GameLib] No GameLib instance found. Creating new instance.");
        this._scene = "loading";
        this._sprites = [];
        this.clearColor = "#dddddd";
        renderCanvas.setAttribute("style", "image-rendering: pixelated;");
        this._renderCanvas = renderCanvas;
        this._renderCtx = renderCtx;
        viewportCanvas.setAttribute("style", "image-rendering: pixelated;");
        this._viewportCanvas = viewportCanvas;
        this._viewportCtx = viewportCtx;
        this._viewport = new Box2(new Coord(0, 0), new Size(this._viewportCanvas.width, this._viewportCanvas.height));
        this._renderables = [];
        this._background = {};
        this._active = true;
        this._rendering = true;
        this.oncontextmenu = null;
        window.addEventListener("click", this.checkButtons.bind(this), false);
        window.addEventListener("mousemove", this.hoverButtons.bind(this), false);
        window.addEventListener("contextmenu", this.contextMenu.bind(this), false);
        _GameLib._instance = this;
      }
    }
    contextMenu(evt) {
      evt.preventDefault();
      evt.returnValue = "";
      if (this.oncontextmenu) {
        this.oncontextmenu(evt);
      }
    }
    static cursor(cursorType) {
      document.body.setAttribute("style", "cursor: " + cursorType + ";");
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
          _GameLib.cursor("default");
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
      _GameLib.cursor("default");
    }
    getScene() {
      return this._scene;
    }
    static getContext(canvas) {
      return canvas.getContext("2d", {
        "willReadFrequently": true
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
        throw new TypeError("Parameter renderable must be an instance of Renderable");
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
      if (!sprite instanceof Sprite) {
        throw new TypeError("Parameter sprite must be an instance of Sprite!");
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
      return this._sprites.filter((sprite) => sprite instanceof spriteClass);
    }
    getRenderablesOfType(renderableClass) {
      return this._renderables.filter((renderable) => renderable instanceof renderableClass);
    }
    clearRenderablesOfType(renderableClass) {
      this._renderables = this._renderables.filter((renderable) => !(renderable instanceof renderableClass));
    }
    addSprite(sprite) {
      if (sprite instanceof Sprite) {
        this._sprites.push(sprite);
      } else {
        throw new TypeError("Parameter sprite must be an instance of Sprite");
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
      this.preUpdateHooks.forEach(function(hook) {
        hook();
      });
      this._sprites.forEach((function(sprite) {
        if (this._scene == sprite.scene) {
          sprite.update();
        }
      }).bind(this));
      this.postUpdateHooks.forEach(function(hook) {
        hook();
      });
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
      ctx.strokeStyle = color;
      for (var i2 = 0; i2 < this._renderCanvas.height; i2 += size) {
        ctx.beginPath();
        ctx.moveTo(0, i2);
        ctx.lineTo(this._renderCanvas.width, i2);
        ctx.closePath();
        ctx.stroke();
      }
      for (var i2 = 0; i2 < this._renderCanvas.width; i2 += size) {
        ctx.beginPath();
        ctx.moveTo(i2, 0);
        ctx.lineTo(i2, this._renderCanvas.height);
        ctx.closePath();
        ctx.stroke();
      }
    }
    draw() {
      if (!this._rendering) {
        return;
      }
      this.clearCanvas(false);
      this.preRenderHooks.forEach(function(hook) {
        hook();
      });
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
      this.postRenderHooks.forEach(function(hook) {
        hook();
      });
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
        this._viewportCtx.fillStyle = "#000000";
        this._viewportCtx.fillRect(0, 0, this._viewportCanvas.width, this._viewportCanvas.height);
        this._viewportCtx.fillStyle = "#ffffff";
        this._viewportCtx.font = "bold 50px sans-serif";
        this._viewportCtx.textAlgin = "center";
        this._viewportCtx.textBaseline = "alphabetic";
        var textMetrics = this._viewportCtx.measureText("LOADING");
        this._viewportCtx.fillText("LOADING", this._viewportCanvas.width / 2 - textMetrics.width / 2, this._viewportCanvas.height / 2);
      }
    }
    registerMainloop() {
      window.requestAnimationFrame(this.mainloop.bind(this));
    }
  };

  // src/2D/Renderable.js
  var Renderable = class {
    constructor(scene) {
      this.gameLib = new GameLib();
      this.gameLib.addRenderable(this);
      this._active = true;
      this._canvas = this.gameLib.canvas;
      this._ctx = this.gameLib.ctx;
      this.overlay = false;
      this.scene = scene;
    }
    makeOverlay() {
      this.overlay = true;
      this._canvas = this.gameLib.viewportCanvas;
      this._ctx = this.gameLib.viewportCtx;
    }
    overlaySkipped() {
    }
    shouldRender() {
      return true;
    }
    isActive() {
      return this._active;
    }
    setActive(active) {
      this._active = active;
    }
    draw() {
    }
  };

  // src/2D/UI/UIElement.js
  var UIElement = class extends Renderable {
    constructor(scene) {
      super(scene);
      this.makeOverlay();
    }
  };

  // src/2D/UI/Button.js
  var Button2 = class extends Renderable {
    constructor(pos, size, scene) {
      super(scene);
      this.overlay = true;
      this._canvas = this.gameLib.viewportCanvas;
      this._ctx = this.gameLib.viewportCtx;
      this._box = new Box(pos, size);
      this.hover = false;
      this.cursor = "default";
    }
    moveTo(x, y) {
      this._box.moveTo(x, y);
    }
    get x() {
      return this._box.x;
    }
    get y() {
      return this._box.y;
    }
    get width() {
      return this._box.width;
    }
    get height() {
      return this._box.height;
    }
    handleClick(evt, coord) {
      if (coord.x >= this._box.x && coord.y >= this._box.y && coord.x <= this._box.x + this._box.width && coord.y <= this._box.y + this._box.height) {
        this.clicked();
        return true;
      }
      return false;
    }
    handleHover(evt, coord) {
      if (coord.x >= this._box.x && coord.y >= this._box.y && coord.x <= this._box.x + this._box.width && coord.y <= this._box.y + this._box.height) {
        this.hover = true;
        GameLib.cursor(this.cursor);
        return true;
      } else {
        this.hover = false;
        return false;
      }
    }
    clicked() {
      this.hover = false;
      GameLib.cursor("default");
    }
  };

  // src/2D/UI/TextInput.js
  var TextInput = class extends Renderable {
    constructor(pos, size, scene) {
      super(scene);
      this.overlay = true;
      this._canvas = this.gameLib.viewportCanvas;
      this._canvasRect = this._canvas.getBoundingClientRect();
      this.canvasX = this._canvasRect.x;
      this.canvasY = this._canvasRect.y;
      this._ctx = this.gameLib.viewportCtx;
      this._box = new Box(pos, size);
      this._active = false;
      this._value = null;
      this._element = null;
    }
    createElement() {
      this._element = document.createElement("input");
      this._element.setAttribute("style", this.getStyle());
      this._element.setAttribute("type", "text");
      document.body.appendChild(this._element);
    }
    getStyle() {
      return "box-sizing: border-box;padding-left: 5px;padding-right: 5px;z-index: 999;display: block;position: absolute;left: " + (this.canvasX + this.x) + "px;top: " + (this.canvasY + this.y) + "px;width: " + this.width + "px;height: " + this.height + "px;outline: none;background: transparent;border: 0;";
    }
    draw() {
      if (this._element) {
        this._canvasRect = this._canvas.getBoundingClientRect();
        this.canvasX = this._canvasRect.x;
        this.canvasY = this._canvasRect.y;
        this._element.setAttribute("style", this.getStyle());
      } else {
        this.createElement();
      }
      this._ctx.fillStyle = "#ffffff";
      this._ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    get value() {
      if (this._element) {
        return this._element.value;
      }
    }
    overlaySkipped() {
      if (this._element) {
        this.removeElement();
      }
    }
    removeElement() {
      this._element.remove();
      this._element = null;
    }
    setActive(active) {
      super.setActive(active);
      if (active) {
        this.createElement();
      } else {
        this.removeElement();
      }
    }
    moveTo(x, y) {
      this._box.moveTo(x, y);
    }
    get x() {
      return this._box.x;
    }
    get y() {
      return this._box.y;
    }
    get width() {
      return this._box.width;
    }
    get height() {
      return this._box.height;
    }
  };

  // src/2D/UI/index.js
  var UI = class {
    constructor() {
      throw new GameLibCore2.Error("Class UI may not be constructed!");
    }
    static UIElement = UIElement;
    static Button = Button2;
    static TextInput = TextInput;
  };

  // src/2D/index.js
  var GameLib2D2 = class {
    constructor() {
      throw new GameLibCore.Error("Wrapper class GameLib2D may not be constructed!");
    }
    static Coord = Coord2;
    static Size = Size2;
    static Box = Box2;
    static Rotation = Rotation;
    static Renderable = Renderable;
    static Sprite = Sprite;
    static GameLib = GameLib;
    static UI = UI;
  };

  // src/3D/Utils.js
  var Utils2 = class {
    constructor() {
      throw new GameLibError("Class GameLib3D.Utils may not be constructed!");
    }
  };

  // src/3D/Object.js
  var Object2 = class {
    constructor(gameLib) {
      this._gameLib = gameLib;
      this._gl = this._gameLib.webgl;
    }
    setup() {
    }
    update() {
    }
    draw(camera, program) {
    }
  };

  // src/3D/ShaderFactory/Node.js
  var Node = class {
    constructor() {
      this.canHaveChildren = false;
      this.canAddNode = false;
      this.canAddVar = false;
      this.canAddHeader = false;
      this._nodes = [];
      this._parent = null;
      this.text = null;
    }
    addNode(node) {
      if (!node.canAddNode) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
      }
      if (!this.canHaveChildren) {
        throw new GameLibCore2.Error("Trying to add children to a GameLib3D.ShaderFactory.Node that cannot contain children!");
      }
      node._parent = this;
      this._nodes.push(node);
    }
  };

  // src/3D/ShaderFactory/Modifiers/Variable.js
  var Variable = class {
    constructor({ input = false, output = false, uniform = false, attribute = false, varying = false, constant = false, precision = null } = {}) {
      this._input = input;
      this._output = output;
      this._uniform = uniform;
      this._attribute = attribute;
      this._varying = varying;
      this._constant = constant;
      this._precision = precision;
      this.text = null;
      this.update();
    }
    update() {
      var includeProps = ["_input", "_output", "_uniform", "_attribute", "_varying"];
      var matchedProps = 0;
      for (var i2 = 0; i2 < includeProps.length; i2++) {
        var prop = includeProps[i2];
        if (this[prop]) matchedProps += 1;
      }
      if (matchedProps > 1) {
        throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory.Modifiers.Variable has conflicting properties!");
      }
      this.text = "";
      if (this._constant) this.text += "const ";
      if (this._input) this.text += "in ";
      if (this._output) this.text += "out ";
      if (this._uniform) this.text += "uniform ";
      if (this._attribute) this.text += "attribute ";
      if (this._varying) this.text += "varying ";
      if (this._precision) this.text += `${this._precision} `;
    }
    get input() {
      return this._input;
    }
    set input(value) {
      this._input = value;
      this.update();
    }
    get output() {
      return this._output;
    }
    set output(value) {
      this._output = value;
      this.update();
    }
    get uniform() {
      return this._uniform;
    }
    set uniform(value) {
      this._uniform = value;
      this.update();
    }
    get attribute() {
      return this._attribute;
    }
    set attribute(value) {
      this._attribute = value;
      this.update();
    }
    get varying() {
      return this._varying;
    }
    set varying(value) {
      this._varying = value;
      this.update();
    }
    get constant() {
      return this._constant;
    }
    set constant(value) {
      this._constant = value;
      this.update();
    }
    get precision() {
      return this._precision;
    }
    set precision(value) {
      this._precision = value;
      this.update();
    }
  };

  // src/3D/ShaderFactory/Modifiers/index.js
  var Modifiers = class {
    constructor() {
      throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory.Modifiers may not be constructed!");
    }
    static Variable = Variable;
  };

  // src/3D/ShaderFactory/FunctionParam.js
  var FunctionParam = class {
    constructor(type, name, modifiers) {
      if (!modifiers || !Modifiers.Variable) modifiers = new Modifiers.Variable();
      modifiers.update();
      this._type = type;
      this._name = name;
      this._modifiers = modifiers;
      this.text = `${this._modifiers.text}${this._type} ${this._name}`;
    }
  };

  // src/3D/ShaderFactory/VariableTypes.js
  var VariableTypes = {
    "VECTOR": {
      "FLOAT": {
        "2": "vec2",
        "3": "vec3",
        "4": "vec4"
      },
      "DOUBLE": {
        "2": "dvec2",
        "3": "dvec3",
        "4": "dvec4"
      },
      "INT": {
        "2": "ivec2",
        "3": "ivec3",
        "4": "ivec4"
      },
      "UINT": {
        "2": "uvec2",
        "3": "uvec3",
        "4": "uvec4"
      },
      "BOOL": {
        "2": "bvec2",
        "3": "bvec3",
        "4": "bvec4"
      }
    },
    "MATRIX": {
      "2": "mat2",
      "3": "mat3",
      "4": "mat4",
      "custom": function(rows, cols) {
        return `mat${rows}x${cols}`;
      }
    },
    "FLOAT": "float",
    "DOUBLE": "double",
    "INT": "int",
    "UINT": "uint",
    "BOOL": "bool",
    "VOID": "void",
    "SAMPLER": {
      "2D": "sampler2D"
    }
  };

  // src/3D/ShaderFactory/PrecisionTypes.js
  var PrecisionTypes = {
    "LOW": "lowp",
    "MEDIUM": "mediump",
    "HIGH": "highp"
  };

  // src/3D/ShaderFactory/NodeTypes/NodeTypes.js
  var NodeTypes = class {
    constructor() {
      throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory.NodeTypes may not be constructed!");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Header.js
  NodeTypes.Header = class HeaderNode extends Node {
    constructor(type, ...data) {
      super();
      this.canAddHeader = true;
      this._type = type;
      this._data = data;
      var joinedData = this._data.join(" ");
      this.text = `#${this._type} ${joinedData}`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Variable.js
  NodeTypes.Variable = class VariableNode extends Node {
    constructor(type, name, modifiers = null, initialValue = null) {
      super();
      if (!modifiers || !(modifiers instanceof Modifiers.Variable)) modifiers = new Modifiers.Variable();
      modifiers.update();
      this.canAddNode = true;
      this.canAddVar = true;
      this._type = type;
      this._name = name;
      this._modifiers = modifiers;
      this._initialValue = initialValue;
      var initialValueText = "";
      if (this._initialValue !== null) {
        var valueString = this._initialValue.text;
        initialValueText = ` = ${valueString}`;
      }
      this.text = `${this._modifiers.text}${this._type} ${this._name}${initialValueText};`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Function.js
  NodeTypes.Function = class FunctionNode extends Node {
    constructor(type, name, params) {
      super();
      this.canAddNode = true;
      this.canHaveChildren = true;
      this._type = type;
      this._name = name;
      this._params = params;
      var paramsText = this._params.join(", ");
      this._startText = `${this._type} ${this._name}(${paramsText}) {
`;
      this._endText = "\n}";
      this.update();
    }
    update() {
      var nodeTexts = [];
      for (var i2 = 0; i2 < this._nodes.length; i2++) {
        nodeTexts.push(this._nodes[i2].text);
      }
      var nodesText = nodeTexts.join("\n");
      this.text = `${this._startText}${nodesText}${this._endText}`;
    }
    addNode(node) {
      if (!node.canAddNode) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
      }
      if (!this.canHaveChildren) {
        throw new GameLibCore2.Error("Trying to add children to a GameLib3D.ShaderFactory.Node that cannot contain children!");
      }
      node._parent = this;
      this._nodes.push(node);
      this.update();
    }
  };

  // src/3D/ShaderFactory/NodeTypes/MainFunction.js
  NodeTypes.MainFunction = class MainFunctionNode extends NodeTypes.Function {
    constructor() {
      super(VariableTypes.VOID, "main", []);
    }
  };

  // src/3D/ShaderFactory/NodeTypes/AssignVariable.js
  NodeTypes.AssignVariable = class AssignVariableNode extends Node {
    constructor(target, node) {
      super();
      this._target = target;
      this._node = node;
      this.canAddNode = true;
      this.text = `${this._target} = ${this._node.text};`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Constant.js
  NodeTypes.Constant = class ConstantNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = value;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Symbol.js
  NodeTypes.Symbol = class SymbolNode extends Node {
    constructor(name) {
      super();
      this._name = name;
      this.text = name;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Add.js
  NodeTypes.Add = class AddNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" + ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Subtract.js
  NodeTypes.Subtract = class SubtractNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" - ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Multiply.js
  NodeTypes.Multiply = class MultiplyNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" * ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Divide.js
  NodeTypes.Divide = class DivideNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      this.text = valueTexts.join(" / ");
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Vector.js
  NodeTypes.Vector = class VectorNode extends Node {
    constructor(type, ...values) {
      super();
      this._type = type;
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var joinedValues = valueTexts.join(", ");
      this.text = `${this._type}(${joinedValues})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Normalize.js
  NodeTypes.Normalize = class NormalizeNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      var valueText = this._value.text;
      this.text = `normalize(${valueText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Precision.js
  NodeTypes.Precision = class PrecisionNode extends Node {
    constructor(type, precision) {
      super();
      this.canAddHeader = true;
      this._type = type;
      this._precision = precision;
      this.text = `precision ${this._precision} ${this._type};`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Dot.js
  NodeTypes.Dot = class DotNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `dot(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Max.js
  NodeTypes.Max = class MaxNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `max(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/XYZ.js
  NodeTypes.XYZ = class XYZNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text}).xyz`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Group.js
  NodeTypes.Group = class GroupNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Texture2D.js
  NodeTypes.Texture2D = class Texture2DNode extends Node {
    constructor(value1, value2) {
      super();
      this._value1 = value1;
      this._value2 = value2;
      this.text = `texture2D(${value1.text}, ${value2.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/RGB.js
  NodeTypes.RGB = class RGBNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text}).rgb`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/A.js
  NodeTypes.A = class ANode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `(${this._value.text}).a`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Length.js
  NodeTypes.Length = class LengthNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `length(${this._value.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Exp2.js
  NodeTypes.Exp2 = class Exp2Node extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `exp2(${this._value.text})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Define.js
  NodeTypes.Define = class DefineNode extends Node {
    constructor(name, value) {
      super();
      this.canAddNode = true;
      this._name = name;
      this._value = value;
      this.text = `#define ${this._name} ${this._value.text}`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Negative.js
  NodeTypes.Negative = class NegativeNode extends Node {
    constructor(value) {
      super();
      this._value = value;
      this.text = `-${this._value.text}`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Clamp.js
  NodeTypes.Clamp = class ClampNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `clamp(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/NodeTypes/Mix.js
  NodeTypes.Mix = class MixNode extends Node {
    constructor(...values) {
      super();
      this._values = values;
      var valueTexts = [];
      for (var i2 = 0; i2 < this._values.length; i2++) {
        valueTexts.push(this._values[i2].text);
      }
      var valuesText = valueTexts.join(", ");
      this.text = `mix(${valuesText})`;
    }
  };

  // src/3D/ShaderFactory/Program.js
  var Program = class {
    constructor() {
      this._header = [];
      this._vars = [];
      this._nodes = [];
    }
    get header() {
      return this._header;
    }
    get vars() {
      return this._vars;
    }
    get nodes() {
      return this._nodes;
    }
    addNode(node) {
      if (!node.canAddNode) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
      }
      node._parent = this;
      this._nodes.push(node);
    }
    addVar(node) {
      if (!node.canAddVar) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node as a variable that has canAddVar set to false!");
      }
      node._parent = this;
      this._vars.push(node);
    }
    addHeader(node) {
      if (!node.canAddHeader) {
        throw new GameLibCore2.Error("Cannot add a GameLib3D.ShaderFactory.Node as a header that has canAddHeader set to false!");
      }
      node._parent = this;
      this._header.push(node);
    }
  };

  // src/3D/ShaderFactory/index.js
  var ShaderFactory = class {
    constructor() {
      throw new GameLibCore2.Error("Class GameLib3D.ShaderFactory may not be constructed!");
    }
    static Node = Node;
    static Modifiers = Modifiers;
    static FunctionParam = FunctionParam;
    static VariableTypes = VariableTypes;
    static PrecisionTypes = PrecisionTypes;
    static NodeTypes = NodeTypes;
    static Program = Program;
    static compileFactory(shaderFactoryProgram) {
      var headers = shaderFactoryProgram.header;
      var headerTexts = [];
      for (var i2 = 0; i2 < headers.length; i2++) {
        headerTexts.push(headers[i2].text);
      }
      var headersText = headerTexts.join("\n");
      var vars = shaderFactoryProgram.vars;
      var varTexts = [];
      for (var i2 = 0; i2 < vars.length; i2++) {
        varTexts.push(vars[i2].text);
      }
      var varsText = varTexts.join("\n");
      var nodes = shaderFactoryProgram.nodes;
      var nodeTexts = [];
      for (var i2 = 0; i2 < nodes.length; i2++) {
        nodeTexts.push(nodes[i2].text);
      }
      var nodesText = nodeTexts.join("\n");
      var result = `${headersText}
${varsText}
${nodesText}`;
      return result;
    }
  };

  // src/3D/GameLib.js
  var GameLib2 = class extends GameLibCore2.GameLibBase {
    constructor(renderCanvas, renderCtx, options) {
      super();
      if (GameLib3D.GameLib._instance != null) {
        delete this;
        return GameLib3D.GameLib._instance;
      } else {
        console.log("[GameLib] No GameLib3D instance found. Creating new instance.");
        this._canvas = renderCanvas;
        this._gl = renderCtx;
        this._objects = [];
        this._options = options;
        this._clearColor = [0, 0, 0, 1];
        this._camera = null;
        this._program = null;
        this.registerMainloop();
        GameLib3D.GameLib._instance = this;
      }
    }
    static getContext(canvas, webgl2 = true) {
      if (webgl2) {
        return canvas.getContext("webgl2");
      } else {
        return canvas.getContext("webgl");
      }
    }
    get webgl() {
      return this._gl;
    }
    setClearColor(color) {
      this._clearColor = color;
    }
    compileShader(type, source) {
      var shader = this._gl.createShader(type);
      this._gl.shaderSource(shader, source);
      this._gl.compileShader(shader);
      if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
        console.warn("[GameLib] Shader compilation failed:", this._gl.getShaderInfoLog(shader));
        this._gl.deleteShader(shader);
        return null;
      }
      return shader;
    }
    createProgram(...shaders) {
      var program = this._gl.createProgram();
      for (var i2 = 0; i2 < shaders.length; i2++) {
        this._gl.attachShader(program, shaders[i2]);
      }
      this._gl.linkProgram(program);
      if (!this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
        console.warn("[GameLib] Program linking failed:", this._gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    }
    useProgram(program) {
      this._program = program;
      this._gl.useProgram(program);
    }
    setCamera(camera) {
      this._camera = camera;
    }
    getAttributeLocation(program, name, forceMode = null) {
      var location2;
      if (!forceMode && name.startsWith("a") || forceMode == "attribute") {
        location2 = this._gl.getAttribLocation(program, name);
      }
      if (!forceMode && name.startsWith("u") || forceMode == "uniform") {
        location2 = this._gl.getUniformLocation(program, name);
      }
      return location2;
    }
    setProgramAttribute(program, name, buffer, num, type, normalize2 = false, stride = 0, offset = 0, forceMode = null) {
      if (!type) type = this._gl.FLOAT;
      var location2 = this.getAttributeLocation(program, name, forceMode);
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);
      this._gl.vertexAttribPointer(location2, num, type, normalize2, stride, offset);
      this._gl.enableVertexAttribArray(location2);
    }
    addObject(object) {
      if (object instanceof GameLib3D.Object) {
        object.setup();
        this._objects.push(object);
      } else {
        throw new GameLibCore2.Error("GameLib3D.GameLib.addObject(object) must be passed an instance of GameLib3D.Object!");
      }
    }
    update() {
      if (!this._active) return;
      this.callHook("pre-update");
      for (var i2 = 0; i2 < this._objects.length; i2++) {
        this._objects[i2].update();
      }
      this.callHook("post-update");
    }
    clearCanvas() {
      this._gl.clearColor(...this._clearColor);
      this._gl.clearDepth(1);
      this._gl.enable(this._gl.DEPTH_TEST);
      this._gl.depthFunc(this._gl.LEQUAL);
      this._gl.enable(this._gl.BLEND);
      this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
      this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }
    draw() {
      if (!this._rendering) return;
      this.clearCanvas();
      this.callHook("pre-render");
      for (var i2 = 0; i2 < this._objects.length; i2++) {
        this._objects[i2].draw(this._camera, this._program);
      }
      this.callHook("post-render");
    }
    mainloop() {
      this.update();
      this.draw();
      this.registerMainloop();
    }
    registerMainloop() {
      window.requestAnimationFrame(this.mainloop.bind(this));
    }
  };

  // src/Lib/GLMatrix.js
  var EPSILON = 1e-6;
  var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
  var RANDOM = Math.random;
  var ANGLE_ORDER = "zyx";
  function round$3(a) {
    if (a >= 0) return Math.round(a);
    return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
  }
  function setMatrixArrayType(type) {
    ARRAY_TYPE = type;
  }
  var degree = Math.PI / 180;
  var radian = 180 / Math.PI;
  function toRadian(a) {
    return a * degree;
  }
  function toDegree(a) {
    return a * radian;
  }
  function equals$9(a, b) {
    var tolerance = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : EPSILON;
    return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
  }
  var common = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    EPSILON,
    get ARRAY_TYPE() {
      return ARRAY_TYPE;
    },
    RANDOM,
    ANGLE_ORDER,
    round: round$3,
    setMatrixArrayType,
    toRadian,
    toDegree,
    equals: equals$9
  });
  function create$8() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
    }
    out[0] = 1;
    out[3] = 1;
    return out;
  }
  function clone$8(a) {
    var out = new ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function copy$8(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function identity$5(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
  }
  function fromValues$8(m00, m01, m10, m11) {
    var out = new ARRAY_TYPE(4);
    out[0] = m00;
    out[1] = m01;
    out[2] = m10;
    out[3] = m11;
    return out;
  }
  function set$8(out, m00, m01, m10, m11) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m10;
    out[3] = m11;
    return out;
  }
  function transpose$2(out, a) {
    if (out === a) {
      var a1 = a[1];
      out[1] = a[2];
      out[2] = a1;
    } else {
      out[0] = a[0];
      out[1] = a[2];
      out[2] = a[1];
      out[3] = a[3];
    }
    return out;
  }
  function invert$5(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var det = a0 * a3 - a2 * a1;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] = a0 * det;
    return out;
  }
  function adjoint$2(out, a) {
    var a0 = a[0];
    out[0] = a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a0;
    return out;
  }
  function determinant$3(a) {
    return a[0] * a[3] - a[2] * a[1];
  }
  function multiply$8(out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    return out;
  }
  function rotate$4(out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = a0 * c + a2 * s;
    out[1] = a1 * c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    return out;
  }
  function scale$8(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    return out;
  }
  function fromRotation$4(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    return out;
  }
  function fromScaling$3(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    return out;
  }
  function str$8(a) {
    return "mat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
  }
  function frob$3(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
  }
  function LDU(L, D, U, a) {
    L[2] = a[2] / a[0];
    U[0] = a[0];
    U[1] = a[1];
    U[3] = a[3] - L[2] * U[1];
    return [L, D, U];
  }
  function add$8(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
  }
  function subtract$6(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
  }
  function exactEquals$8(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function equals$8(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3));
  }
  function multiplyScalar$3(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
  }
  function multiplyScalarAndAdd$3(out, a, b, scale2) {
    out[0] = a[0] + b[0] * scale2;
    out[1] = a[1] + b[1] * scale2;
    out[2] = a[2] + b[2] * scale2;
    out[3] = a[3] + b[3] * scale2;
    return out;
  }
  var mul$8 = multiply$8;
  var sub$6 = subtract$6;
  var mat2 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$8,
    clone: clone$8,
    copy: copy$8,
    identity: identity$5,
    fromValues: fromValues$8,
    set: set$8,
    transpose: transpose$2,
    invert: invert$5,
    adjoint: adjoint$2,
    determinant: determinant$3,
    multiply: multiply$8,
    rotate: rotate$4,
    scale: scale$8,
    fromRotation: fromRotation$4,
    fromScaling: fromScaling$3,
    str: str$8,
    frob: frob$3,
    LDU,
    add: add$8,
    subtract: subtract$6,
    exactEquals: exactEquals$8,
    equals: equals$8,
    multiplyScalar: multiplyScalar$3,
    multiplyScalarAndAdd: multiplyScalarAndAdd$3,
    mul: mul$8,
    sub: sub$6
  });
  function create$7() {
    var out = new ARRAY_TYPE(6);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[4] = 0;
      out[5] = 0;
    }
    out[0] = 1;
    out[3] = 1;
    return out;
  }
  function clone$7(a) {
    var out = new ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
  }
  function copy$7(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
  }
  function identity$4(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
  }
  function fromValues$7(a, b, c, d, tx, ty) {
    var out = new ARRAY_TYPE(6);
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
  }
  function set$7(out, a, b, c, d, tx, ty) {
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
  }
  function invert$4(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3];
    var atx = a[4], aty = a[5];
    var det = aa * ad - ab * ac;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
  }
  function determinant$2(a) {
    return a[0] * a[3] - a[1] * a[2];
  }
  function multiply$7(out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
  }
  function rotate$3(out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = a0 * c + a2 * s;
    out[1] = a1 * c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    out[4] = a4;
    out[5] = a5;
    return out;
  }
  function scale$7(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    var v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
  }
  function translate$3(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    var v0 = v[0], v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
  }
  function fromRotation$3(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    out[4] = 0;
    out[5] = 0;
    return out;
  }
  function fromScaling$2(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    out[4] = 0;
    out[5] = 0;
    return out;
  }
  function fromTranslation$3(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = v[0];
    out[5] = v[1];
    return out;
  }
  function str$7(a) {
    return "mat2d(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ")";
  }
  function frob$2(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + 1);
  }
  function add$7(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    return out;
  }
  function subtract$5(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    return out;
  }
  function multiplyScalar$2(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    return out;
  }
  function multiplyScalarAndAdd$2(out, a, b, scale2) {
    out[0] = a[0] + b[0] * scale2;
    out[1] = a[1] + b[1] * scale2;
    out[2] = a[2] + b[2] * scale2;
    out[3] = a[3] + b[3] * scale2;
    out[4] = a[4] + b[4] * scale2;
    out[5] = a[5] + b[5] * scale2;
    return out;
  }
  function exactEquals$7(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
  }
  function equals$7(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5));
  }
  var mul$7 = multiply$7;
  var sub$5 = subtract$5;
  var mat2d = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$7,
    clone: clone$7,
    copy: copy$7,
    identity: identity$4,
    fromValues: fromValues$7,
    set: set$7,
    invert: invert$4,
    determinant: determinant$2,
    multiply: multiply$7,
    rotate: rotate$3,
    scale: scale$7,
    translate: translate$3,
    fromRotation: fromRotation$3,
    fromScaling: fromScaling$2,
    fromTranslation: fromTranslation$3,
    str: str$7,
    frob: frob$2,
    add: add$7,
    subtract: subtract$5,
    multiplyScalar: multiplyScalar$2,
    multiplyScalarAndAdd: multiplyScalarAndAdd$2,
    exactEquals: exactEquals$7,
    equals: equals$7,
    mul: mul$7,
    sub: sub$5
  });
  function create$6() {
    var out = new ARRAY_TYPE(9);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
    }
    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  }
  function fromMat4$1(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
  }
  function clone$6(a) {
    var out = new ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function copy$6(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function fromValues$6(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    var out = new ARRAY_TYPE(9);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
  }
  function set$6(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m10;
    out[4] = m11;
    out[5] = m12;
    out[6] = m20;
    out[7] = m21;
    out[8] = m22;
    return out;
  }
  function identity$3(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function transpose$1(out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a12 = a[5];
      out[1] = a[3];
      out[2] = a[6];
      out[3] = a01;
      out[5] = a[7];
      out[6] = a02;
      out[7] = a12;
    } else {
      out[0] = a[0];
      out[1] = a[3];
      out[2] = a[6];
      out[3] = a[1];
      out[4] = a[4];
      out[5] = a[7];
      out[6] = a[2];
      out[7] = a[5];
      out[8] = a[8];
    }
    return out;
  }
  function invert$3(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    var b01 = a22 * a11 - a12 * a21;
    var b11 = -a22 * a10 + a12 * a20;
    var b21 = a21 * a10 - a11 * a20;
    var det = a00 * b01 + a01 * b11 + a02 * b21;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
  }
  function adjoint$1(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    out[0] = a11 * a22 - a12 * a21;
    out[1] = a02 * a21 - a01 * a22;
    out[2] = a01 * a12 - a02 * a11;
    out[3] = a12 * a20 - a10 * a22;
    out[4] = a00 * a22 - a02 * a20;
    out[5] = a02 * a10 - a00 * a12;
    out[6] = a10 * a21 - a11 * a20;
    out[7] = a01 * a20 - a00 * a21;
    out[8] = a00 * a11 - a01 * a10;
    return out;
  }
  function determinant$1(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
  }
  function multiply$6(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2];
    var a10 = a[3], a11 = a[4], a12 = a[5];
    var a20 = a[6], a21 = a[7], a22 = a[8];
    var b00 = b[0], b01 = b[1], b02 = b[2];
    var b10 = b[3], b11 = b[4], b12 = b[5];
    var b20 = b[6], b21 = b[7], b22 = b[8];
    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;
    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;
    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
  }
  function translate$2(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], x = v[0], y = v[1];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a10;
    out[4] = a11;
    out[5] = a12;
    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
  }
  function rotate$2(out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a10 = a[3], a11 = a[4], a12 = a[5], a20 = a[6], a21 = a[7], a22 = a[8], s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;
    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;
    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
  }
  function scale$6(out, a, v) {
    var x = v[0], y = v[1];
    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];
    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  function fromTranslation$2(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = v[0];
    out[7] = v[1];
    out[8] = 1;
    return out;
  }
  function fromRotation$2(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = -s;
    out[4] = c;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function fromScaling$1(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = v[1];
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
  }
  function fromMat2d(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;
    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;
    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
  }
  function fromQuat$1(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;
    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;
    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;
    return out;
  }
  function normalFromMat4(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    return out;
  }
  function projection(out, width, height) {
    out[0] = 2 / width;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = -2 / height;
    out[5] = 0;
    out[6] = -1;
    out[7] = 1;
    out[8] = 1;
    return out;
  }
  function str$6(a) {
    return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
  }
  function frob$1(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8]);
  }
  function add$6(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    return out;
  }
  function subtract$4(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    return out;
  }
  function multiplyScalar$1(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    return out;
  }
  function multiplyScalarAndAdd$1(out, a, b, scale2) {
    out[0] = a[0] + b[0] * scale2;
    out[1] = a[1] + b[1] * scale2;
    out[2] = a[2] + b[2] * scale2;
    out[3] = a[3] + b[3] * scale2;
    out[4] = a[4] + b[4] * scale2;
    out[5] = a[5] + b[5] * scale2;
    out[6] = a[6] + b[6] * scale2;
    out[7] = a[7] + b[7] * scale2;
    out[8] = a[8] + b[8] * scale2;
    return out;
  }
  function exactEquals$6(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
  }
  function equals$6(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8));
  }
  var mul$6 = multiply$6;
  var sub$4 = subtract$4;
  var mat3 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$6,
    fromMat4: fromMat4$1,
    clone: clone$6,
    copy: copy$6,
    fromValues: fromValues$6,
    set: set$6,
    identity: identity$3,
    transpose: transpose$1,
    invert: invert$3,
    adjoint: adjoint$1,
    determinant: determinant$1,
    multiply: multiply$6,
    translate: translate$2,
    rotate: rotate$2,
    scale: scale$6,
    fromTranslation: fromTranslation$2,
    fromRotation: fromRotation$2,
    fromScaling: fromScaling$1,
    fromMat2d,
    fromQuat: fromQuat$1,
    normalFromMat4,
    projection,
    str: str$6,
    frob: frob$1,
    add: add$6,
    subtract: subtract$4,
    multiplyScalar: multiplyScalar$1,
    multiplyScalarAndAdd: multiplyScalarAndAdd$1,
    exactEquals: exactEquals$6,
    equals: equals$6,
    mul: mul$6,
    sub: sub$4
  });
  function create$5() {
    var out = new ARRAY_TYPE(16);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
    }
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  function clone$5(a) {
    var out = new ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function copy$5(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function fromValues$5(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    var out = new ARRAY_TYPE(16);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function set$5(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function identity$2(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function transpose(out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a03 = a[3];
      var a12 = a[6], a13 = a[7];
      var a23 = a[11];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a01;
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a02;
      out[9] = a12;
      out[11] = a[14];
      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
    } else {
      out[0] = a[0];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a[1];
      out[5] = a[5];
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a[2];
      out[9] = a[6];
      out[10] = a[10];
      out[11] = a[14];
      out[12] = a[3];
      out[13] = a[7];
      out[14] = a[11];
      out[15] = a[15];
    }
    return out;
  }
  function invert$2(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  function adjoint(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    out[0] = a11 * b11 - a12 * b10 + a13 * b09;
    out[1] = a02 * b10 - a01 * b11 - a03 * b09;
    out[2] = a31 * b05 - a32 * b04 + a33 * b03;
    out[3] = a22 * b04 - a21 * b05 - a23 * b03;
    out[4] = a12 * b08 - a10 * b11 - a13 * b07;
    out[5] = a00 * b11 - a02 * b08 + a03 * b07;
    out[6] = a32 * b02 - a30 * b05 - a33 * b01;
    out[7] = a20 * b05 - a22 * b02 + a23 * b01;
    out[8] = a10 * b10 - a11 * b08 + a13 * b06;
    out[9] = a01 * b08 - a00 * b10 - a03 * b06;
    out[10] = a30 * b04 - a31 * b02 + a33 * b00;
    out[11] = a21 * b02 - a20 * b04 - a23 * b00;
    out[12] = a11 * b07 - a10 * b09 - a12 * b06;
    out[13] = a00 * b09 - a01 * b07 + a02 * b06;
    out[14] = a31 * b01 - a30 * b03 - a32 * b00;
    out[15] = a20 * b03 - a21 * b01 + a22 * b00;
    return out;
  }
  function determinant(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = a00 * a11 - a01 * a10;
    var b1 = a00 * a12 - a02 * a10;
    var b2 = a01 * a12 - a02 * a11;
    var b3 = a20 * a31 - a21 * a30;
    var b4 = a20 * a32 - a22 * a30;
    var b5 = a21 * a32 - a22 * a31;
    var b6 = a00 * b5 - a01 * b4 + a02 * b3;
    var b7 = a10 * b5 - a11 * b4 + a12 * b3;
    var b8 = a20 * b2 - a21 * b1 + a22 * b0;
    var b9 = a30 * b2 - a31 * b1 + a32 * b0;
    return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
  }
  function multiply$5(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  function translate$1(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  }
  function scale$5(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function rotate$1(out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len2 = Math.sqrt(x * x + y * y + z * z);
    var s, c, t;
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    var b00, b01, b02;
    var b10, b11, b12;
    var b20, b21, b22;
    if (len2 < EPSILON) {
      return null;
    }
    len2 = 1 / len2;
    x *= len2;
    y *= len2;
    z *= len2;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  }
  function rotateX$3(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
  }
  function rotateY$3(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
  }
  function rotateZ$3(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    if (a !== out) {
      out[8] = a[8];
      out[9] = a[9];
      out[10] = a[10];
      out[11] = a[11];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
  }
  function fromTranslation$1(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromScaling(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = v[1];
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = v[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotation$1(out, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len2 = Math.sqrt(x * x + y * y + z * z);
    var s, c, t;
    if (len2 < EPSILON) {
      return null;
    }
    len2 = 1 / len2;
    x *= len2;
    y *= len2;
    z *= len2;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    out[0] = x * x * t + c;
    out[1] = y * x * t + z * s;
    out[2] = z * x * t - y * s;
    out[3] = 0;
    out[4] = x * y * t - z * s;
    out[5] = y * y * t + c;
    out[6] = z * y * t + x * s;
    out[7] = 0;
    out[8] = x * z * t + y * s;
    out[9] = y * z * t - x * s;
    out[10] = z * z * t + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromXRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = s;
    out[7] = 0;
    out[8] = 0;
    out[9] = -s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromYRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = 0;
    out[2] = -s;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromZRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotationTranslation$1(out, q, v) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromQuat2(out, a) {
    var translation = new ARRAY_TYPE(3);
    var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
    var magnitude = bx * bx + by * by + bz * bz + bw * bw;
    if (magnitude > 0) {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
    } else {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
    }
    fromRotationTranslation$1(out, a, translation);
    return out;
  }
  function getTranslation$1(out, mat) {
    out[0] = mat[12];
    out[1] = mat[13];
    out[2] = mat[14];
    return out;
  }
  function getScaling(out, mat) {
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
    return out;
  }
  function getRotation(out, mat) {
    var scaling = new ARRAY_TYPE(3);
    getScaling(scaling, mat);
    var is1 = 1 / scaling[0];
    var is2 = 1 / scaling[1];
    var is3 = 1 / scaling[2];
    var sm11 = mat[0] * is1;
    var sm12 = mat[1] * is2;
    var sm13 = mat[2] * is3;
    var sm21 = mat[4] * is1;
    var sm22 = mat[5] * is2;
    var sm23 = mat[6] * is3;
    var sm31 = mat[8] * is1;
    var sm32 = mat[9] * is2;
    var sm33 = mat[10] * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1) * 2;
      out[3] = 0.25 * S;
      out[0] = (sm23 - sm32) / S;
      out[1] = (sm31 - sm13) / S;
      out[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
      out[3] = (sm23 - sm32) / S;
      out[0] = 0.25 * S;
      out[1] = (sm12 + sm21) / S;
      out[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
      out[3] = (sm31 - sm13) / S;
      out[0] = (sm12 + sm21) / S;
      out[1] = 0.25 * S;
      out[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
      out[3] = (sm12 - sm21) / S;
      out[0] = (sm31 + sm13) / S;
      out[1] = (sm23 + sm32) / S;
      out[2] = 0.25 * S;
    }
    return out;
  }
  function decompose(out_r, out_t, out_s, mat) {
    out_t[0] = mat[12];
    out_t[1] = mat[13];
    out_t[2] = mat[14];
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out_s[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
    out_s[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
    out_s[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
    var is1 = 1 / out_s[0];
    var is2 = 1 / out_s[1];
    var is3 = 1 / out_s[2];
    var sm11 = m11 * is1;
    var sm12 = m12 * is2;
    var sm13 = m13 * is3;
    var sm21 = m21 * is1;
    var sm22 = m22 * is2;
    var sm23 = m23 * is3;
    var sm31 = m31 * is1;
    var sm32 = m32 * is2;
    var sm33 = m33 * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1) * 2;
      out_r[3] = 0.25 * S;
      out_r[0] = (sm23 - sm32) / S;
      out_r[1] = (sm31 - sm13) / S;
      out_r[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
      out_r[3] = (sm23 - sm32) / S;
      out_r[0] = 0.25 * S;
      out_r[1] = (sm12 + sm21) / S;
      out_r[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
      out_r[3] = (sm31 - sm13) / S;
      out_r[0] = (sm12 + sm21) / S;
      out_r[1] = 0.25 * S;
      out_r[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
      out_r[3] = (sm12 - sm21) / S;
      out_r[0] = (sm31 + sm13) / S;
      out_r[1] = (sm23 + sm32) / S;
      out_r[2] = 0.25 * S;
    }
    return out_r;
  }
  function fromRotationTranslationScale(out, q, v, s) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    var ox = o[0];
    var oy = o[1];
    var oz = o[2];
    var out0 = (1 - (yy + zz)) * sx;
    var out1 = (xy + wz) * sx;
    var out2 = (xz - wy) * sx;
    var out4 = (xy - wz) * sy;
    var out5 = (1 - (xx + zz)) * sy;
    var out6 = (yz + wx) * sy;
    var out8 = (xz + wy) * sz;
    var out9 = (yz - wx) * sz;
    var out10 = (1 - (xx + yy)) * sz;
    out[0] = out0;
    out[1] = out1;
    out[2] = out2;
    out[3] = 0;
    out[4] = out4;
    out[5] = out5;
    out[6] = out6;
    out[7] = 0;
    out[8] = out8;
    out[9] = out9;
    out[10] = out10;
    out[11] = 0;
    out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
    out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
    out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
    out[15] = 1;
    return out;
  }
  function fromQuat(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function frustum(out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left);
    var tb = 1 / (top - bottom);
    var nf = 1 / (near - far);
    out[0] = near * 2 * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = near * 2 * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near * 2 * nf;
    out[15] = 0;
    return out;
  }
  function perspectiveNO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      var nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = 2 * far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }
    return out;
  }
  var perspective = perspectiveNO;
  function perspectiveZO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      var nf = 1 / (near - far);
      out[10] = far * nf;
      out[14] = far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -near;
    }
    return out;
  }
  function perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI / 180);
    var downTan = Math.tan(fov.downDegrees * Math.PI / 180);
    var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
    var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
    var xScale = 2 / (leftTan + rightTan);
    var yScale = 2 / (upTan + downTan);
    out[0] = xScale;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = yScale;
    out[6] = 0;
    out[7] = 0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = (upTan - downTan) * yScale * 0.5;
    out[10] = far / (near - far);
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near / (near - far);
    out[15] = 0;
    return out;
  }
  function orthoNO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }
  var ortho = orthoNO;
  function orthoZO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = near * nf;
    out[15] = 1;
    return out;
  }
  function lookAt(out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len2;
    var eyex = eye[0];
    var eyey = eye[1];
    var eyez = eye[2];
    var upx = up[0];
    var upy = up[1];
    var upz = up[2];
    var centerx = center[0];
    var centery = center[1];
    var centerz = center[2];
    if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
      return identity$2(out);
    }
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len2 = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len2;
    z1 *= len2;
    z2 *= len2;
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len2 = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len2) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      len2 = 1 / len2;
      x0 *= len2;
      x1 *= len2;
      x2 *= len2;
    }
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len2 = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len2) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len2 = 1 / len2;
      y0 *= len2;
      y1 *= len2;
      y2 *= len2;
    }
    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  }
  function targetTo(out, eye, target, up) {
    var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
    var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
    var len2 = z0 * z0 + z1 * z1 + z2 * z2;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
      z0 *= len2;
      z1 *= len2;
      z2 *= len2;
    }
    var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
    len2 = x0 * x0 + x1 * x1 + x2 * x2;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
      x0 *= len2;
      x1 *= len2;
      x2 *= len2;
    }
    out[0] = x0;
    out[1] = x1;
    out[2] = x2;
    out[3] = 0;
    out[4] = z1 * x2 - z2 * x1;
    out[5] = z2 * x0 - z0 * x2;
    out[6] = z0 * x1 - z1 * x0;
    out[7] = 0;
    out[8] = z0;
    out[9] = z1;
    out[10] = z2;
    out[11] = 0;
    out[12] = eyex;
    out[13] = eyey;
    out[14] = eyez;
    out[15] = 1;
    return out;
  }
  function str$5(a) {
    return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
  }
  function frob(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8] + a[9] * a[9] + a[10] * a[10] + a[11] * a[11] + a[12] * a[12] + a[13] * a[13] + a[14] * a[14] + a[15] * a[15]);
  }
  function add$5(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
  }
  function subtract$3(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
  }
  function multiplyScalar(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
  }
  function multiplyScalarAndAdd(out, a, b, scale2) {
    out[0] = a[0] + b[0] * scale2;
    out[1] = a[1] + b[1] * scale2;
    out[2] = a[2] + b[2] * scale2;
    out[3] = a[3] + b[3] * scale2;
    out[4] = a[4] + b[4] * scale2;
    out[5] = a[5] + b[5] * scale2;
    out[6] = a[6] + b[6] * scale2;
    out[7] = a[7] + b[7] * scale2;
    out[8] = a[8] + b[8] * scale2;
    out[9] = a[9] + b[9] * scale2;
    out[10] = a[10] + b[10] * scale2;
    out[11] = a[11] + b[11] * scale2;
    out[12] = a[12] + b[12] * scale2;
    out[13] = a[13] + b[13] * scale2;
    out[14] = a[14] + b[14] * scale2;
    out[15] = a[15] + b[15] * scale2;
    return out;
  }
  function exactEquals$5(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
  }
  function equals$5(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
    var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
    var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
    var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
    var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1, Math.abs(a15), Math.abs(b15));
  }
  var mul$5 = multiply$5;
  var sub$3 = subtract$3;
  var mat4 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$5,
    clone: clone$5,
    copy: copy$5,
    fromValues: fromValues$5,
    set: set$5,
    identity: identity$2,
    transpose,
    invert: invert$2,
    adjoint,
    determinant,
    multiply: multiply$5,
    translate: translate$1,
    scale: scale$5,
    rotate: rotate$1,
    rotateX: rotateX$3,
    rotateY: rotateY$3,
    rotateZ: rotateZ$3,
    fromTranslation: fromTranslation$1,
    fromScaling,
    fromRotation: fromRotation$1,
    fromXRotation,
    fromYRotation,
    fromZRotation,
    fromRotationTranslation: fromRotationTranslation$1,
    fromQuat2,
    getTranslation: getTranslation$1,
    getScaling,
    getRotation,
    decompose,
    fromRotationTranslationScale,
    fromRotationTranslationScaleOrigin,
    fromQuat,
    frustum,
    perspectiveNO,
    perspective,
    perspectiveZO,
    perspectiveFromFieldOfView,
    orthoNO,
    ortho,
    orthoZO,
    lookAt,
    targetTo,
    str: str$5,
    frob,
    add: add$5,
    subtract: subtract$3,
    multiplyScalar,
    multiplyScalarAndAdd,
    exactEquals: exactEquals$5,
    equals: equals$5,
    mul: mul$5,
    sub: sub$3
  });
  function create$4() {
    var out = new ARRAY_TYPE(3);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    return out;
  }
  function clone$4(a) {
    var out = new ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function length$4(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function fromValues$4(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function copy$4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function set$4(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function add$4(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  function subtract$2(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }
  function multiply$4(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }
  function divide$2(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  }
  function ceil$2(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    return out;
  }
  function floor$2(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    return out;
  }
  function min$2(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
  }
  function max$2(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
  }
  function round$2(out, a) {
    out[0] = round$3(a[0]);
    out[1] = round$3(a[1]);
    out[2] = round$3(a[2]);
    return out;
  }
  function scale$4(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  }
  function scaleAndAdd$2(out, a, b, scale2) {
    out[0] = a[0] + b[0] * scale2;
    out[1] = a[1] + b[1] * scale2;
    out[2] = a[2] + b[2] * scale2;
    return out;
  }
  function distance$2(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }
  function squaredDistance$2(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return x * x + y * y + z * z;
  }
  function squaredLength$4(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return x * x + y * y + z * z;
  }
  function negate$2(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }
  function inverse$2(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    return out;
  }
  function normalize$4(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len2 = x * x + y * y + z * z;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
    }
    out[0] = a[0] * len2;
    out[1] = a[1] * len2;
    out[2] = a[2] * len2;
    return out;
  }
  function dot$4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross$2(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2];
    var bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  function lerp$4(out, a, b, t) {
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  }
  function slerp$1(out, a, b, t) {
    var angle2 = Math.acos(Math.min(Math.max(dot$4(a, b), -1), 1));
    var sinTotal = Math.sin(angle2);
    var ratioA = Math.sin((1 - t) * angle2) / sinTotal;
    var ratioB = Math.sin(t * angle2) / sinTotal;
    out[0] = ratioA * a[0] + ratioB * b[0];
    out[1] = ratioA * a[1] + ratioB * b[1];
    out[2] = ratioA * a[2] + ratioB * b[2];
    return out;
  }
  function hermite(out, a, b, c, d, t) {
    var factorTimes2 = t * t;
    var factor1 = factorTimes2 * (2 * t - 3) + 1;
    var factor2 = factorTimes2 * (t - 2) + t;
    var factor3 = factorTimes2 * (t - 1);
    var factor4 = factorTimes2 * (3 - 2 * t);
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }
  function bezier(out, a, b, c, d, t) {
    var inverseFactor = 1 - t;
    var inverseFactorTimesTwo = inverseFactor * inverseFactor;
    var factorTimes2 = t * t;
    var factor1 = inverseFactorTimesTwo * inverseFactor;
    var factor2 = 3 * t * inverseFactorTimesTwo;
    var factor3 = 3 * factorTimes2 * inverseFactor;
    var factor4 = factorTimes2 * t;
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }
  function random$3(out, scale2) {
    scale2 = scale2 === void 0 ? 1 : scale2;
    var r = RANDOM() * 2 * Math.PI;
    var z = RANDOM() * 2 - 1;
    var zScale = Math.sqrt(1 - z * z) * scale2;
    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale2;
    return out;
  }
  function transformMat4$2(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    var w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }
  function transformMat3$1(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  }
  function transformQuat$1(out, a, q) {
    var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    var vx = a[0], vy = a[1], vz = a[2];
    var tx = qy * vz - qz * vy;
    var ty = qz * vx - qx * vz;
    var tz = qx * vy - qy * vx;
    tx = tx + tx;
    ty = ty + ty;
    tz = tz + tz;
    out[0] = vx + qw * tx + qy * tz - qz * ty;
    out[1] = vy + qw * ty + qz * tx - qx * tz;
    out[2] = vz + qw * tz + qx * ty - qy * tx;
    return out;
  }
  function rotateX$2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function rotateY$2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function rotateZ$2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function angle$1(a, b) {
    var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2], mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz)), cosine = mag && dot$4(a, b) / mag;
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
  }
  function zero$2(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
  }
  function str$4(a) {
    return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
  }
  function exactEquals$4(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  function equals$4(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2];
    var b0 = b[0], b1 = b[1], b2 = b[2];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2));
  }
  var sub$2 = subtract$2;
  var mul$4 = multiply$4;
  var div$2 = divide$2;
  var dist$2 = distance$2;
  var sqrDist$2 = squaredDistance$2;
  var len$4 = length$4;
  var sqrLen$4 = squaredLength$4;
  var forEach$2 = (function() {
    var vec = create$4();
    return function(a, stride, offset, count, fn, arg) {
      var i2, l;
      if (!stride) {
        stride = 3;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i2 = offset; i2 < l; i2 += stride) {
        vec[0] = a[i2];
        vec[1] = a[i2 + 1];
        vec[2] = a[i2 + 2];
        fn(vec, vec, arg);
        a[i2] = vec[0];
        a[i2 + 1] = vec[1];
        a[i2 + 2] = vec[2];
      }
      return a;
    };
  })();
  var vec3 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$4,
    clone: clone$4,
    length: length$4,
    fromValues: fromValues$4,
    copy: copy$4,
    set: set$4,
    add: add$4,
    subtract: subtract$2,
    multiply: multiply$4,
    divide: divide$2,
    ceil: ceil$2,
    floor: floor$2,
    min: min$2,
    max: max$2,
    round: round$2,
    scale: scale$4,
    scaleAndAdd: scaleAndAdd$2,
    distance: distance$2,
    squaredDistance: squaredDistance$2,
    squaredLength: squaredLength$4,
    negate: negate$2,
    inverse: inverse$2,
    normalize: normalize$4,
    dot: dot$4,
    cross: cross$2,
    lerp: lerp$4,
    slerp: slerp$1,
    hermite,
    bezier,
    random: random$3,
    transformMat4: transformMat4$2,
    transformMat3: transformMat3$1,
    transformQuat: transformQuat$1,
    rotateX: rotateX$2,
    rotateY: rotateY$2,
    rotateZ: rotateZ$2,
    angle: angle$1,
    zero: zero$2,
    str: str$4,
    exactEquals: exactEquals$4,
    equals: equals$4,
    sub: sub$2,
    mul: mul$4,
    div: div$2,
    dist: dist$2,
    sqrDist: sqrDist$2,
    len: len$4,
    sqrLen: sqrLen$4,
    forEach: forEach$2
  });
  function create$3() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    }
    return out;
  }
  function clone$3(a) {
    var out = new ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function fromValues$3(x, y, z, w) {
    var out = new ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }
  function copy$3(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function set$3(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }
  function add$3(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
  }
  function subtract$1(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
  }
  function multiply$3(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
  }
  function divide$1(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
  }
  function ceil$1(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    out[3] = Math.ceil(a[3]);
    return out;
  }
  function floor$1(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    out[3] = Math.floor(a[3]);
    return out;
  }
  function min$1(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
  }
  function max$1(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
  }
  function round$1(out, a) {
    out[0] = round$3(a[0]);
    out[1] = round$3(a[1]);
    out[2] = round$3(a[2]);
    out[3] = round$3(a[3]);
    return out;
  }
  function scale$3(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
  }
  function scaleAndAdd$1(out, a, b, scale2) {
    out[0] = a[0] + b[0] * scale2;
    out[1] = a[1] + b[1] * scale2;
    out[2] = a[2] + b[2] * scale2;
    out[3] = a[3] + b[3] * scale2;
    return out;
  }
  function distance$1(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    var w = b[3] - a[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
  }
  function squaredDistance$1(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    var w = b[3] - a[3];
    return x * x + y * y + z * z + w * w;
  }
  function length$3(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
  }
  function squaredLength$3(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    return x * x + y * y + z * z + w * w;
  }
  function negate$1(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
  }
  function inverse$1(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    out[3] = 1 / a[3];
    return out;
  }
  function normalize$3(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len2 = x * x + y * y + z * z + w * w;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
    }
    out[0] = x * len2;
    out[1] = y * len2;
    out[2] = z * len2;
    out[3] = w * len2;
    return out;
  }
  function dot$3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function cross$1(out, u, v, w) {
    var A = v[0] * w[1] - v[1] * w[0], B = v[0] * w[2] - v[2] * w[0], C = v[0] * w[3] - v[3] * w[0], D = v[1] * w[2] - v[2] * w[1], E = v[1] * w[3] - v[3] * w[1], F = v[2] * w[3] - v[3] * w[2];
    var G = u[0];
    var H = u[1];
    var I = u[2];
    var J = u[3];
    out[0] = H * F - I * E + J * D;
    out[1] = -(G * F) + I * C - J * B;
    out[2] = G * E - H * C + J * A;
    out[3] = -(G * D) + H * B - I * A;
    return out;
  }
  function lerp$3(out, a, b, t) {
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    var aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
  }
  function random$2(out, scale2) {
    scale2 = scale2 === void 0 ? 1 : scale2;
    var v1, v2, v3, v4;
    var s1, s2;
    var rand;
    rand = RANDOM();
    v1 = rand * 2 - 1;
    v2 = (4 * RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
    s1 = v1 * v1 + v2 * v2;
    rand = RANDOM();
    v3 = rand * 2 - 1;
    v4 = (4 * RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
    s2 = v3 * v3 + v4 * v4;
    var d = Math.sqrt((1 - s1) / s2);
    out[0] = scale2 * v1;
    out[1] = scale2 * v2;
    out[2] = scale2 * v3 * d;
    out[3] = scale2 * v4 * d;
    return out;
  }
  function transformMat4$1(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
  }
  function transformQuat(out, a, q) {
    var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    var vx = a[0], vy = a[1], vz = a[2];
    var tx = qy * vz - qz * vy;
    var ty = qz * vx - qx * vz;
    var tz = qx * vy - qy * vx;
    tx = tx + tx;
    ty = ty + ty;
    tz = tz + tz;
    out[0] = vx + qw * tx + qy * tz - qz * ty;
    out[1] = vy + qw * ty + qz * tx - qx * tz;
    out[2] = vz + qw * tz + qx * ty - qy * tx;
    out[3] = a[3];
    return out;
  }
  function zero$1(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
  }
  function str$3(a) {
    return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
  }
  function exactEquals$3(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function equals$3(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3));
  }
  var sub$1 = subtract$1;
  var mul$3 = multiply$3;
  var div$1 = divide$1;
  var dist$1 = distance$1;
  var sqrDist$1 = squaredDistance$1;
  var len$3 = length$3;
  var sqrLen$3 = squaredLength$3;
  var forEach$1 = (function() {
    var vec = create$3();
    return function(a, stride, offset, count, fn, arg) {
      var i2, l;
      if (!stride) {
        stride = 4;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i2 = offset; i2 < l; i2 += stride) {
        vec[0] = a[i2];
        vec[1] = a[i2 + 1];
        vec[2] = a[i2 + 2];
        vec[3] = a[i2 + 3];
        fn(vec, vec, arg);
        a[i2] = vec[0];
        a[i2 + 1] = vec[1];
        a[i2 + 2] = vec[2];
        a[i2 + 3] = vec[3];
      }
      return a;
    };
  })();
  var vec4 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$3,
    clone: clone$3,
    fromValues: fromValues$3,
    copy: copy$3,
    set: set$3,
    add: add$3,
    subtract: subtract$1,
    multiply: multiply$3,
    divide: divide$1,
    ceil: ceil$1,
    floor: floor$1,
    min: min$1,
    max: max$1,
    round: round$1,
    scale: scale$3,
    scaleAndAdd: scaleAndAdd$1,
    distance: distance$1,
    squaredDistance: squaredDistance$1,
    length: length$3,
    squaredLength: squaredLength$3,
    negate: negate$1,
    inverse: inverse$1,
    normalize: normalize$3,
    dot: dot$3,
    cross: cross$1,
    lerp: lerp$3,
    random: random$2,
    transformMat4: transformMat4$1,
    transformQuat,
    zero: zero$1,
    str: str$3,
    exactEquals: exactEquals$3,
    equals: equals$3,
    sub: sub$1,
    mul: mul$3,
    div: div$1,
    dist: dist$1,
    sqrDist: sqrDist$1,
    len: len$3,
    sqrLen: sqrLen$3,
    forEach: forEach$1
  });
  function create$2() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    out[3] = 1;
    return out;
  }
  function identity$1(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
  }
  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }
  function getAxisAngle(out_axis, q) {
    var rad = Math.acos(q[3]) * 2;
    var s = Math.sin(rad / 2);
    if (s > EPSILON) {
      out_axis[0] = q[0] / s;
      out_axis[1] = q[1] / s;
      out_axis[2] = q[2] / s;
    } else {
      out_axis[0] = 1;
      out_axis[1] = 0;
      out_axis[2] = 0;
    }
    return rad;
  }
  function getAngle(a, b) {
    var dotproduct = dot$2(a, b);
    return Math.acos(2 * dotproduct * dotproduct - 1);
  }
  function multiply$2(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3];
    var bx = b[0], by = b[1], bz = b[2], bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  }
  function rotateX$1(out, a, rad) {
    rad *= 0.5;
    var ax = a[0], ay = a[1], az = a[2], aw = a[3];
    var bx = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
  }
  function rotateY$1(out, a, rad) {
    rad *= 0.5;
    var ax = a[0], ay = a[1], az = a[2], aw = a[3];
    var by = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
  }
  function rotateZ$1(out, a, rad) {
    rad *= 0.5;
    var ax = a[0], ay = a[1], az = a[2], aw = a[3];
    var bz = Math.sin(rad), bw = Math.cos(rad);
    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
  }
  function calculateW(out, a) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = Math.sqrt(Math.abs(1 - x * x - y * y - z * z));
    return out;
  }
  function exp(out, a) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    var r = Math.sqrt(x * x + y * y + z * z);
    var et = Math.exp(w);
    var s = r > 0 ? et * Math.sin(r) / r : 0;
    out[0] = x * s;
    out[1] = y * s;
    out[2] = z * s;
    out[3] = et * Math.cos(r);
    return out;
  }
  function ln(out, a) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    var r = Math.sqrt(x * x + y * y + z * z);
    var t = r > 0 ? Math.atan2(r, w) / r : 0;
    out[0] = x * t;
    out[1] = y * t;
    out[2] = z * t;
    out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
    return out;
  }
  function pow(out, a, b) {
    ln(out, a);
    scale$2(out, out, b);
    exp(out, out);
    return out;
  }
  function slerp(out, a, b, t) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3];
    var bx = b[0], by = b[1], bz = b[2], bw = b[3];
    var omega, cosom, sinom, scale0, scale1;
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    if (cosom < 0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (1 - cosom > EPSILON) {
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      scale0 = 1 - t;
      scale1 = t;
    }
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  }
  function random$1(out) {
    var u1 = RANDOM();
    var u2 = RANDOM();
    var u3 = RANDOM();
    var sqrt1MinusU1 = Math.sqrt(1 - u1);
    var sqrtU1 = Math.sqrt(u1);
    out[0] = sqrt1MinusU1 * Math.sin(2 * Math.PI * u2);
    out[1] = sqrt1MinusU1 * Math.cos(2 * Math.PI * u2);
    out[2] = sqrtU1 * Math.sin(2 * Math.PI * u3);
    out[3] = sqrtU1 * Math.cos(2 * Math.PI * u3);
    return out;
  }
  function invert$1(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var dot2 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    var invDot = dot2 ? 1 / dot2 : 0;
    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
  }
  function conjugate$1(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
  }
  function fromMat3(out, m) {
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;
    if (fTrace > 0) {
      fRoot = Math.sqrt(fTrace + 1);
      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      var i2 = 0;
      if (m[4] > m[0]) i2 = 1;
      if (m[8] > m[i2 * 3 + i2]) i2 = 2;
      var j = (i2 + 1) % 3;
      var k = (i2 + 2) % 3;
      fRoot = Math.sqrt(m[i2 * 3 + i2] - m[j * 3 + j] - m[k * 3 + k] + 1);
      out[i2] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i2] + m[i2 * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i2] + m[i2 * 3 + k]) * fRoot;
    }
    return out;
  }
  function fromEuler(out, x, y, z) {
    var order = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : ANGLE_ORDER;
    var halfToRad = Math.PI / 360;
    x *= halfToRad;
    z *= halfToRad;
    y *= halfToRad;
    var sx = Math.sin(x);
    var cx = Math.cos(x);
    var sy = Math.sin(y);
    var cy = Math.cos(y);
    var sz = Math.sin(z);
    var cz = Math.cos(z);
    switch (order) {
      case "xyz":
        out[0] = sx * cy * cz + cx * sy * sz;
        out[1] = cx * sy * cz - sx * cy * sz;
        out[2] = cx * cy * sz + sx * sy * cz;
        out[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "xzy":
        out[0] = sx * cy * cz - cx * sy * sz;
        out[1] = cx * sy * cz - sx * cy * sz;
        out[2] = cx * cy * sz + sx * sy * cz;
        out[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yxz":
        out[0] = sx * cy * cz + cx * sy * sz;
        out[1] = cx * sy * cz - sx * cy * sz;
        out[2] = cx * cy * sz - sx * sy * cz;
        out[3] = cx * cy * cz + sx * sy * sz;
        break;
      case "yzx":
        out[0] = sx * cy * cz + cx * sy * sz;
        out[1] = cx * sy * cz + sx * cy * sz;
        out[2] = cx * cy * sz - sx * sy * cz;
        out[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zxy":
        out[0] = sx * cy * cz - cx * sy * sz;
        out[1] = cx * sy * cz + sx * cy * sz;
        out[2] = cx * cy * sz + sx * sy * cz;
        out[3] = cx * cy * cz - sx * sy * sz;
        break;
      case "zyx":
        out[0] = sx * cy * cz - cx * sy * sz;
        out[1] = cx * sy * cz + sx * cy * sz;
        out[2] = cx * cy * sz - sx * sy * cz;
        out[3] = cx * cy * cz + sx * sy * sz;
        break;
      default:
        throw new Error("Unknown angle order " + order);
    }
    return out;
  }
  function str$2(a) {
    return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
  }
  var clone$2 = clone$3;
  var fromValues$2 = fromValues$3;
  var copy$2 = copy$3;
  var set$2 = set$3;
  var add$2 = add$3;
  var mul$2 = multiply$2;
  var scale$2 = scale$3;
  var dot$2 = dot$3;
  var lerp$2 = lerp$3;
  var length$2 = length$3;
  var len$2 = length$2;
  var squaredLength$2 = squaredLength$3;
  var sqrLen$2 = squaredLength$2;
  var normalize$2 = normalize$3;
  var exactEquals$2 = exactEquals$3;
  function equals$2(a, b) {
    return Math.abs(dot$3(a, b)) >= 1 - EPSILON;
  }
  var rotationTo = (function() {
    var tmpvec3 = create$4();
    var xUnitVec3 = fromValues$4(1, 0, 0);
    var yUnitVec3 = fromValues$4(0, 1, 0);
    return function(out, a, b) {
      var dot2 = dot$4(a, b);
      if (dot2 < -0.999999) {
        cross$2(tmpvec3, xUnitVec3, a);
        if (len$4(tmpvec3) < 1e-6) cross$2(tmpvec3, yUnitVec3, a);
        normalize$4(tmpvec3, tmpvec3);
        setAxisAngle(out, tmpvec3, Math.PI);
        return out;
      } else if (dot2 > 0.999999) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
      } else {
        cross$2(tmpvec3, a, b);
        out[0] = tmpvec3[0];
        out[1] = tmpvec3[1];
        out[2] = tmpvec3[2];
        out[3] = 1 + dot2;
        return normalize$2(out, out);
      }
    };
  })();
  var sqlerp = (function() {
    var temp1 = create$2();
    var temp2 = create$2();
    return function(out, a, b, c, d, t) {
      slerp(temp1, a, d, t);
      slerp(temp2, b, c, t);
      slerp(out, temp1, temp2, 2 * t * (1 - t));
      return out;
    };
  })();
  var setAxes = (function() {
    var matr = create$6();
    return function(out, view, right, up) {
      matr[0] = right[0];
      matr[3] = right[1];
      matr[6] = right[2];
      matr[1] = up[0];
      matr[4] = up[1];
      matr[7] = up[2];
      matr[2] = -view[0];
      matr[5] = -view[1];
      matr[8] = -view[2];
      return normalize$2(out, fromMat3(out, matr));
    };
  })();
  var quat = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$2,
    identity: identity$1,
    setAxisAngle,
    getAxisAngle,
    getAngle,
    multiply: multiply$2,
    rotateX: rotateX$1,
    rotateY: rotateY$1,
    rotateZ: rotateZ$1,
    calculateW,
    exp,
    ln,
    pow,
    slerp,
    random: random$1,
    invert: invert$1,
    conjugate: conjugate$1,
    fromMat3,
    fromEuler,
    str: str$2,
    clone: clone$2,
    fromValues: fromValues$2,
    copy: copy$2,
    set: set$2,
    add: add$2,
    mul: mul$2,
    scale: scale$2,
    dot: dot$2,
    lerp: lerp$2,
    length: length$2,
    len: len$2,
    squaredLength: squaredLength$2,
    sqrLen: sqrLen$2,
    normalize: normalize$2,
    exactEquals: exactEquals$2,
    equals: equals$2,
    rotationTo,
    sqlerp,
    setAxes
  });
  function create$1() {
    var dq = new ARRAY_TYPE(8);
    if (ARRAY_TYPE != Float32Array) {
      dq[0] = 0;
      dq[1] = 0;
      dq[2] = 0;
      dq[4] = 0;
      dq[5] = 0;
      dq[6] = 0;
      dq[7] = 0;
    }
    dq[3] = 1;
    return dq;
  }
  function clone$1(a) {
    var dq = new ARRAY_TYPE(8);
    dq[0] = a[0];
    dq[1] = a[1];
    dq[2] = a[2];
    dq[3] = a[3];
    dq[4] = a[4];
    dq[5] = a[5];
    dq[6] = a[6];
    dq[7] = a[7];
    return dq;
  }
  function fromValues$1(x1, y1, z1, w1, x2, y2, z2, w2) {
    var dq = new ARRAY_TYPE(8);
    dq[0] = x1;
    dq[1] = y1;
    dq[2] = z1;
    dq[3] = w1;
    dq[4] = x2;
    dq[5] = y2;
    dq[6] = z2;
    dq[7] = w2;
    return dq;
  }
  function fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) {
    var dq = new ARRAY_TYPE(8);
    dq[0] = x1;
    dq[1] = y1;
    dq[2] = z1;
    dq[3] = w1;
    var ax = x2 * 0.5, ay = y2 * 0.5, az = z2 * 0.5;
    dq[4] = ax * w1 + ay * z1 - az * y1;
    dq[5] = ay * w1 + az * x1 - ax * z1;
    dq[6] = az * w1 + ax * y1 - ay * x1;
    dq[7] = -ax * x1 - ay * y1 - az * z1;
    return dq;
  }
  function fromRotationTranslation(out, q, t) {
    var ax = t[0] * 0.5, ay = t[1] * 0.5, az = t[2] * 0.5, bx = q[0], by = q[1], bz = q[2], bw = q[3];
    out[0] = bx;
    out[1] = by;
    out[2] = bz;
    out[3] = bw;
    out[4] = ax * bw + ay * bz - az * by;
    out[5] = ay * bw + az * bx - ax * bz;
    out[6] = az * bw + ax * by - ay * bx;
    out[7] = -ax * bx - ay * by - az * bz;
    return out;
  }
  function fromTranslation(out, t) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = t[0] * 0.5;
    out[5] = t[1] * 0.5;
    out[6] = t[2] * 0.5;
    out[7] = 0;
    return out;
  }
  function fromRotation(out, q) {
    out[0] = q[0];
    out[1] = q[1];
    out[2] = q[2];
    out[3] = q[3];
    out[4] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    return out;
  }
  function fromMat4(out, a) {
    var outer = create$2();
    getRotation(outer, a);
    var t = new ARRAY_TYPE(3);
    getTranslation$1(t, a);
    fromRotationTranslation(out, outer, t);
    return out;
  }
  function copy$1(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    return out;
  }
  function identity(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    return out;
  }
  function set$1(out, x1, y1, z1, w1, x2, y2, z2, w2) {
    out[0] = x1;
    out[1] = y1;
    out[2] = z1;
    out[3] = w1;
    out[4] = x2;
    out[5] = y2;
    out[6] = z2;
    out[7] = w2;
    return out;
  }
  var getReal = copy$2;
  function getDual(out, a) {
    out[0] = a[4];
    out[1] = a[5];
    out[2] = a[6];
    out[3] = a[7];
    return out;
  }
  var setReal = copy$2;
  function setDual(out, q) {
    out[4] = q[0];
    out[5] = q[1];
    out[6] = q[2];
    out[7] = q[3];
    return out;
  }
  function getTranslation(out, a) {
    var ax = a[4], ay = a[5], az = a[6], aw = a[7], bx = -a[0], by = -a[1], bz = -a[2], bw = a[3];
    out[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    out[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    out[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
    return out;
  }
  function translate(out, a, v) {
    var ax1 = a[0], ay1 = a[1], az1 = a[2], aw1 = a[3], bx1 = v[0] * 0.5, by1 = v[1] * 0.5, bz1 = v[2] * 0.5, ax2 = a[4], ay2 = a[5], az2 = a[6], aw2 = a[7];
    out[0] = ax1;
    out[1] = ay1;
    out[2] = az1;
    out[3] = aw1;
    out[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
    out[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
    out[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
    out[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
    return out;
  }
  function rotateX(out, a, rad) {
    var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
    rotateX$1(out, a, rad);
    bx = out[0];
    by = out[1];
    bz = out[2];
    bw = out[3];
    out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
    out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
    out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
    out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
    return out;
  }
  function rotateY(out, a, rad) {
    var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
    rotateY$1(out, a, rad);
    bx = out[0];
    by = out[1];
    bz = out[2];
    bw = out[3];
    out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
    out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
    out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
    out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
    return out;
  }
  function rotateZ(out, a, rad) {
    var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7], ax1 = ax * bw + aw * bx + ay * bz - az * by, ay1 = ay * bw + aw * by + az * bx - ax * bz, az1 = az * bw + aw * bz + ax * by - ay * bx, aw1 = aw * bw - ax * bx - ay * by - az * bz;
    rotateZ$1(out, a, rad);
    bx = out[0];
    by = out[1];
    bz = out[2];
    bw = out[3];
    out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
    out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
    out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
    out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
    return out;
  }
  function rotateByQuatAppend(out, a, q) {
    var qx = q[0], qy = q[1], qz = q[2], qw = q[3], ax = a[0], ay = a[1], az = a[2], aw = a[3];
    out[0] = ax * qw + aw * qx + ay * qz - az * qy;
    out[1] = ay * qw + aw * qy + az * qx - ax * qz;
    out[2] = az * qw + aw * qz + ax * qy - ay * qx;
    out[3] = aw * qw - ax * qx - ay * qy - az * qz;
    ax = a[4];
    ay = a[5];
    az = a[6];
    aw = a[7];
    out[4] = ax * qw + aw * qx + ay * qz - az * qy;
    out[5] = ay * qw + aw * qy + az * qx - ax * qz;
    out[6] = az * qw + aw * qz + ax * qy - ay * qx;
    out[7] = aw * qw - ax * qx - ay * qy - az * qz;
    return out;
  }
  function rotateByQuatPrepend(out, q, a) {
    var qx = q[0], qy = q[1], qz = q[2], qw = q[3], bx = a[0], by = a[1], bz = a[2], bw = a[3];
    out[0] = qx * bw + qw * bx + qy * bz - qz * by;
    out[1] = qy * bw + qw * by + qz * bx - qx * bz;
    out[2] = qz * bw + qw * bz + qx * by - qy * bx;
    out[3] = qw * bw - qx * bx - qy * by - qz * bz;
    bx = a[4];
    by = a[5];
    bz = a[6];
    bw = a[7];
    out[4] = qx * bw + qw * bx + qy * bz - qz * by;
    out[5] = qy * bw + qw * by + qz * bx - qx * bz;
    out[6] = qz * bw + qw * bz + qx * by - qy * bx;
    out[7] = qw * bw - qx * bx - qy * by - qz * bz;
    return out;
  }
  function rotateAroundAxis(out, a, axis, rad) {
    if (Math.abs(rad) < EPSILON) {
      return copy$1(out, a);
    }
    var axisLength = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
    rad = rad * 0.5;
    var s = Math.sin(rad);
    var bx = s * axis[0] / axisLength;
    var by = s * axis[1] / axisLength;
    var bz = s * axis[2] / axisLength;
    var bw = Math.cos(rad);
    var ax1 = a[0], ay1 = a[1], az1 = a[2], aw1 = a[3];
    out[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
    out[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
    out[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
    out[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
    var ax = a[4], ay = a[5], az = a[6], aw = a[7];
    out[4] = ax * bw + aw * bx + ay * bz - az * by;
    out[5] = ay * bw + aw * by + az * bx - ax * bz;
    out[6] = az * bw + aw * bz + ax * by - ay * bx;
    out[7] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  }
  function add$1(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    return out;
  }
  function multiply$1(out, a, b) {
    var ax0 = a[0], ay0 = a[1], az0 = a[2], aw0 = a[3], bx1 = b[4], by1 = b[5], bz1 = b[6], bw1 = b[7], ax1 = a[4], ay1 = a[5], az1 = a[6], aw1 = a[7], bx0 = b[0], by0 = b[1], bz0 = b[2], bw0 = b[3];
    out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
    out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
    out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
    out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
    out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
    out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
    out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
    out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
    return out;
  }
  var mul$1 = multiply$1;
  function scale$1(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    return out;
  }
  var dot$1 = dot$2;
  function lerp$1(out, a, b, t) {
    var mt = 1 - t;
    if (dot$1(a, b) < 0) t = -t;
    out[0] = a[0] * mt + b[0] * t;
    out[1] = a[1] * mt + b[1] * t;
    out[2] = a[2] * mt + b[2] * t;
    out[3] = a[3] * mt + b[3] * t;
    out[4] = a[4] * mt + b[4] * t;
    out[5] = a[5] * mt + b[5] * t;
    out[6] = a[6] * mt + b[6] * t;
    out[7] = a[7] * mt + b[7] * t;
    return out;
  }
  function invert(out, a) {
    var sqlen = squaredLength$1(a);
    out[0] = -a[0] / sqlen;
    out[1] = -a[1] / sqlen;
    out[2] = -a[2] / sqlen;
    out[3] = a[3] / sqlen;
    out[4] = -a[4] / sqlen;
    out[5] = -a[5] / sqlen;
    out[6] = -a[6] / sqlen;
    out[7] = a[7] / sqlen;
    return out;
  }
  function conjugate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    out[4] = -a[4];
    out[5] = -a[5];
    out[6] = -a[6];
    out[7] = a[7];
    return out;
  }
  var length$1 = length$2;
  var len$1 = length$1;
  var squaredLength$1 = squaredLength$2;
  var sqrLen$1 = squaredLength$1;
  function normalize$1(out, a) {
    var magnitude = squaredLength$1(a);
    if (magnitude > 0) {
      magnitude = Math.sqrt(magnitude);
      var a0 = a[0] / magnitude;
      var a1 = a[1] / magnitude;
      var a2 = a[2] / magnitude;
      var a3 = a[3] / magnitude;
      var b0 = a[4];
      var b1 = a[5];
      var b2 = a[6];
      var b3 = a[7];
      var a_dot_b = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
      out[0] = a0;
      out[1] = a1;
      out[2] = a2;
      out[3] = a3;
      out[4] = (b0 - a0 * a_dot_b) / magnitude;
      out[5] = (b1 - a1 * a_dot_b) / magnitude;
      out[6] = (b2 - a2 * a_dot_b) / magnitude;
      out[7] = (b3 - a3 * a_dot_b) / magnitude;
    }
    return out;
  }
  function str$1(a) {
    return "quat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ")";
  }
  function exactEquals$1(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
  }
  function equals$1(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7));
  }
  var quat2 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create: create$1,
    clone: clone$1,
    fromValues: fromValues$1,
    fromRotationTranslationValues,
    fromRotationTranslation,
    fromTranslation,
    fromRotation,
    fromMat4,
    copy: copy$1,
    identity,
    set: set$1,
    getReal,
    getDual,
    setReal,
    setDual,
    getTranslation,
    translate,
    rotateX,
    rotateY,
    rotateZ,
    rotateByQuatAppend,
    rotateByQuatPrepend,
    rotateAroundAxis,
    add: add$1,
    multiply: multiply$1,
    mul: mul$1,
    scale: scale$1,
    dot: dot$1,
    lerp: lerp$1,
    invert,
    conjugate,
    length: length$1,
    len: len$1,
    squaredLength: squaredLength$1,
    sqrLen: sqrLen$1,
    normalize: normalize$1,
    str: str$1,
    exactEquals: exactEquals$1,
    equals: equals$1
  });
  function create() {
    var out = new ARRAY_TYPE(2);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
    }
    return out;
  }
  function clone(a) {
    var out = new ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
  }
  function fromValues(x, y) {
    var out = new ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
  }
  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
  }
  function set(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
  }
  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
  }
  function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
  }
  function multiply(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
  }
  function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
  }
  function ceil(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    return out;
  }
  function floor(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    return out;
  }
  function min(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
  }
  function max(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
  }
  function round(out, a) {
    out[0] = round$3(a[0]);
    out[1] = round$3(a[1]);
    return out;
  }
  function scale(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
  }
  function scaleAndAdd(out, a, b, scale2) {
    out[0] = a[0] + b[0] * scale2;
    out[1] = a[1] + b[1] * scale2;
    return out;
  }
  function distance(a, b) {
    var x = b[0] - a[0], y = b[1] - a[1];
    return Math.sqrt(x * x + y * y);
  }
  function squaredDistance(a, b) {
    var x = b[0] - a[0], y = b[1] - a[1];
    return x * x + y * y;
  }
  function length(a) {
    var x = a[0], y = a[1];
    return Math.sqrt(x * x + y * y);
  }
  function squaredLength(a) {
    var x = a[0], y = a[1];
    return x * x + y * y;
  }
  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
  }
  function inverse(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    return out;
  }
  function normalize(out, a) {
    var x = a[0], y = a[1];
    var len2 = x * x + y * y;
    if (len2 > 0) {
      len2 = 1 / Math.sqrt(len2);
    }
    out[0] = a[0] * len2;
    out[1] = a[1] * len2;
    return out;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function cross(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
  }
  function lerp(out, a, b, t) {
    var ax = a[0], ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
  }
  function random(out, scale2) {
    scale2 = scale2 === void 0 ? 1 : scale2;
    var r = RANDOM() * 2 * Math.PI;
    out[0] = Math.cos(r) * scale2;
    out[1] = Math.sin(r) * scale2;
    return out;
  }
  function transformMat2(out, a, m) {
    var x = a[0], y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
  }
  function transformMat2d(out, a, m) {
    var x = a[0], y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
  }
  function transformMat3(out, a, m) {
    var x = a[0], y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
  }
  function transformMat4(out, a, m) {
    var x = a[0];
    var y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
  }
  function rotate(out, a, b, rad) {
    var p0 = a[0] - b[0], p1 = a[1] - b[1], sinC = Math.sin(rad), cosC = Math.cos(rad);
    out[0] = p0 * cosC - p1 * sinC + b[0];
    out[1] = p0 * sinC + p1 * cosC + b[1];
    return out;
  }
  function angle(a, b) {
    var ax = a[0], ay = a[1], bx = b[0], by = b[1];
    return Math.abs(Math.atan2(ay * bx - ax * by, ax * bx + ay * by));
  }
  function signedAngle(a, b) {
    var ax = a[0], ay = a[1], bx = b[0], by = b[1];
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  }
  function zero(out) {
    out[0] = 0;
    out[1] = 0;
    return out;
  }
  function str(a) {
    return "vec2(" + a[0] + ", " + a[1] + ")";
  }
  function exactEquals(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  }
  function equals(a, b) {
    var a0 = a[0], a1 = a[1];
    var b0 = b[0], b1 = b[1];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1));
  }
  var len = length;
  var sub = subtract;
  var mul = multiply;
  var div = divide;
  var dist = distance;
  var sqrDist = squaredDistance;
  var sqrLen = squaredLength;
  var forEach = (function() {
    var vec = create();
    return function(a, stride, offset, count, fn, arg) {
      var i2, l;
      if (!stride) {
        stride = 2;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i2 = offset; i2 < l; i2 += stride) {
        vec[0] = a[i2];
        vec[1] = a[i2 + 1];
        fn(vec, vec, arg);
        a[i2] = vec[0];
        a[i2 + 1] = vec[1];
      }
      return a;
    };
  })();
  var vec2 = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    create,
    clone,
    fromValues,
    copy,
    set,
    add,
    subtract,
    multiply,
    divide,
    ceil,
    floor,
    min,
    max,
    round,
    scale,
    scaleAndAdd,
    distance,
    squaredDistance,
    length,
    squaredLength,
    negate,
    inverse,
    normalize,
    dot,
    cross,
    lerp,
    random,
    transformMat2,
    transformMat2d,
    transformMat3,
    transformMat4,
    rotate,
    angle,
    signedAngle,
    zero,
    str,
    exactEquals,
    equals,
    len,
    sub,
    mul,
    div,
    dist,
    sqrDist,
    sqrLen,
    forEach
  });

  // src/3D/Position.js
  var Position = class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    translate(dx, dy, dz) {
      this.x += dx;
      this.y += dy;
      this.z += dz;
    }
  };

  // src/3D/Rotation.js
  var Rotation2 = class {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static d2r(deg) {
      return deg * Math.PI / 180;
    }
    static r2d(rad) {
      return rad * (180 / Math.PI);
    }
    rotate(rx, ry, rz) {
      this.x += rx;
      this.y += ry;
      this.z += rz;
    }
  };

  // src/3D/Scale.js
  var Scale = class {
    constructor(x = 1, y = 1, z = 1) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  };

  // src/3D/Transform.js
  var Transform = class {
    constructor(position = new Position(), rotation = new Rotation2(), scale2 = new Scale()) {
      this.position = position;
      this.rotation = rotation;
      this.scale = scale2;
    }
    translate(x, y, z) {
      this.position.translate(x, y, z);
    }
    rotate(x, y, z) {
      this.rotation.rotate(x, y, z);
    }
    getModelMatrix() {
      var matrix = mat4.create();
      mat4.translate(matrix, matrix, this.position);
      mat4.rotateX(matrix, matrix, this.rotation.x);
      mat4.rotateY(matrix, matrix, this.rotation.y);
      mat4.rotateZ(matrix, matrix, this.rotation.z);
      mat4.scale(matrix, matrix, [this.scale.x, this.scale.y, this.scale.x]);
      return matrix;
    }
    getNormalMatrix(modelViewMatrix) {
      var normalMatrix = mat4.create();
      mat4.invert(normalMatrix, modelViewMatrix);
      mat4.transpose(normalMatrix, normalMatrix);
      return normalMatrix;
    }
  };

  // src/3D/Geometry/Box.js
  var Box3 = class {
    constructor(width = 1, height = 1, depth = 1) {
      var w = width / 2;
      var h = height / 2;
      var d = depth / 2;
      var positions = [
        -w,
        -h,
        d,
        w,
        -h,
        d,
        w,
        h,
        d,
        -w,
        h,
        d,
        -w,
        -h,
        -d,
        -w,
        h,
        -d,
        w,
        h,
        -d,
        w,
        -h,
        -d,
        -w,
        h,
        -d,
        -w,
        h,
        d,
        w,
        h,
        d,
        w,
        h,
        -d,
        -w,
        -h,
        -d,
        w,
        -h,
        -d,
        w,
        -h,
        d,
        -w,
        -h,
        d,
        w,
        -h,
        -d,
        w,
        h,
        -d,
        w,
        h,
        d,
        w,
        -h,
        d,
        -w,
        -h,
        -d,
        -w,
        -h,
        d,
        -w,
        h,
        d,
        -w,
        h,
        -d
      ];
      var normals = [
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        0,
        0
      ];
      var uv = [];
      for (var i2 = 0; i2 < 6; i2++) {
        uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      }
      var indices = [];
      for (var i2 = 0; i2 < 6; i2++) {
        var offset = i2 * 4;
        indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
      }
      this.positions = positions;
      this.normals = normals;
      this.uv = uv;
      this.indices = indices;
    }
  };

  // src/3D/Geometry/Sphere.js
  var Sphere = class {
    constructor(radius = 1, latBands = 24, longBands = 24) {
      var positions = [];
      var normals = [];
      var uv = [];
      var indices = [];
      for (var lat = 0; lat < latBands; lat++) {
        var theta = lat * 2 * Math.PI / latBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var lon = 0; lon < lonBands; lon++) {
          var phi = lon * 2 * Math.PI / longBands;
          var x = Math.cos(phi) * sinTheta;
          var y = cosTheta;
          var z = Math.sin(phi) * sinTheta;
          normals.push(x, y, z);
          uv.push(1 - lon / longBands, 1 - lat / latBands);
          positions.push(radius * x, radius * y, radius * z);
        }
      }
      for (var lat = 0; lat < latBands; lat++) {
        for (var lon = 0; lon < longBands; lon++) {
          var first = lat * (longBands + 1) + lon;
          var second = first + longBands + 1;
          indices.push(first, second, first + 1);
          indices.push(second, second + 1, first + 1);
        }
      }
      this.positions = positions;
      this.normals = normals;
      this.uv = uv;
      this.indices = indices;
    }
  };

  // src/3D/Geometry/Cone.js
  var Cone = class {
    constructor(radius = 1, height = 2, segments = 24) {
      var positions = [];
      var normals = [];
      var uv = [];
      var indices = [];
      var halfH = height / 2;
      positions.push(0, halfH, 0);
      normals.push(0, 1, 0);
      uv.push(0.5, 1);
      for (var i2 = 0; i2 <= segments; i2++) {
        var angle2 = i2 * 2 * Math.PI / segments;
        var x = Math.sin(angle2);
        var z = Math.cos(angle2);
        positions.push(radius * x, -halfH, radius * z);
        var slantLen = Math.sqrt(radius * radius + height * height);
        normals.push(height / slantLen * x, radius / slantLen, height / slantLen * z);
        uv.push(i2 / segments, 0);
      }
      for (var i2 = 0; i2 <= segments; i2++) {
        indices.push(0, i2, i2 + 1);
      }
      var baseCenterIdx = positions.length / 3;
      positions.push(0, -halfH, 0);
      normals.push(0, -1, 0);
      uv.push(0.5, 0.5);
      var baseStartIdx = positions.length / 3;
      for (var i2 = 0; i2 <= segments; i2++) {
        var angle2 = i2 * 2 * Math.PI / segments;
        positions.push(radius * Math.cos(angle2), -halfH, radius * Math.sin(angle2));
        normals.push(0, -1, 0);
        uv.push(0.5 + 0.5 * Math.cos(angle2), 0.5 + 0.5 * Math.sin(angle2));
      }
      for (var i2 = 0; i2 < segments; i2++) {
        indices.push(baseCenterIdx, baseStartIdx + i2 + 1, baseStartIdx + i2);
      }
      this.positions = positions;
      this.normals = normals;
      this.uv = uv;
      this.indices = indices;
    }
  };

  // src/3D/Geometry/index.js
  var Geometry = class {
    constructor() {
      throw new GameLibCore2.Error("Class Geometry may not be constructed!");
    }
    static Box = Box3;
    static Sphere = Sphere;
    static Cone = Cone;
  };

  // src/3D/index.js
  var GameLib3D = class {
    constructor() {
      throw new GameLibCore2.Error("Wrapper class GameLib3D may not be constructed!");
    }
    static Utils = Utils2;
    static Object = Object2;
    static ShaderFactory = ShaderFactory;
    static GameLib = GameLib2;
    static glMatrix = common;
    static mat2 = mat2;
    static mat2d = mat2d;
    static mat3 = mat3;
    static mat4 = mat4;
    static quat = quat;
    static quat2 = quat2;
    static vec2 = vec2;
    static vec3 = vec3;
    static vec4 = vec4;
    static Transform = Transform;
    static Position = Position;
    static Rotation = Rotation2;
    static Scale = Scale;
    static Geometry = Geometry;
  };

  // src/index.js
  var libraryExports = {
    GameLibCore: GameLibCore2,
    GameLib2D: GameLib2D2,
    GameLib3D
  };
  for (i = 0; i < Object.keys(libraryExports).length; i++) {
    key = Object.keys(libraryExports)[i];
    self[key] = libraryExports[key];
  }
  var key;
  var i;
})();
/*!
  GameLib
  Copyright (c) 2025, Charles Jager
  glMatrix 3.4.4 Copyright (c) 2015-2025, Brandon Jones, Colin MacKenzie IV.
*/

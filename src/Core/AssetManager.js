import { GameLibError } from "./Error.js"
class AssetManager {
  static _shared = null;
  static get shared() {
    if (!AssetManager._shared) {
      AssetManager._shared = new AssetManager();
    }
    return AssetManager._shared;
  }
  constructor() {
    this._cache = new Map();
    this._loaders = new Map();
    this.registerLoader("image", (url, options = {}) => {
      return new Promise((resolve, reject) => {
        const image = new Image();
        if (options.crossOrigin !== undefined) {
          image.crossOrigin = options.crossOrigin;
        }
        image.onload = () => resolve(image);
        image.onerror = () => reject(new GameLibError(`Failed to load image: ${url}`));
        image.src = url;
      });
    });
    this.registerLoader("json", async (url, options = {}) => {
      const response = await fetch(url, options.fetchOptions);
      if (!response.ok) {
        throw new GameLibError(`Failed to load JSON "${url}": ${response.status}`);
      }
      return response.json();
    });
    this.registerLoader("text", async (url, options = {}) => {
      const response = await fetch(url, options.fetchOptions);
      if (!response.ok) {
        throw new GameLibError(`Failed to load text "${url}": ${response.status}`);
      }
      return response.text();
    });
    this.registerLoader("arrayBuffer", async (url, options = {}) => {
      const response = await fetch(url, options.fetchOptions);
      if (!response.ok) {
        throw new GameLibError(`Failed to load data "${url}": ${response.status}`);
      }
      return response.arrayBuffer();
    });
  }
  registerLoader(type, loader) {
    if (typeof loader !== "function") {
      throw new TypeError("Asset loader must be a function");
    }
    this._loaders.set(type, loader);
    return this;
  }
  load(type, url, options = {}) {
    const loader = this._loaders.get(type);
    if (!loader) {
      return Promise.reject(new GameLibError(`No asset loader registered for type "${type}"`));
    }
    const key = `${type}:${url}`;
    if (this._cache.has(key)) {
      return this._cache.get(key);
    }
    const promise = Promise.resolve()
      .then(() => loader(url, options))
      .catch(error => {
        this._cache.delete(key);
        throw error;
      });
    this._cache.set(key, promise);
    return promise;
  }
  loadImage(url, options) {
    return this.load("image", url, options);
  }
  loadJSON(url, options) {
    return this.load("json", url, options);
  }
  loadText(url, options) {
    return this.load("text", url, options);
  }
  loadArrayBuffer(url, options) {
    return this.load("arrayBuffer", url, options);
  }
  async loadBatch(manifest, onProgress = null) {
    const total = manifest.length;
    let completed = 0;
    const entries = await Promise.all(manifest.map(async asset => {
      try {
        const value = await this.load(asset.type, asset.url, asset.options);
        return [asset.name, value];
      } finally {
        completed++;
        if (onProgress) {
          onProgress({
            completed,
            total,
            progress: total === 0 ? 1 : completed / total,
            asset
          });
        }
      }
    }));
    return Object.fromEntries(entries);
  }
  has(type, url) {
    return this._cache.has(`${type}:${url}`);
  }
  unload(type, url) {
    return this._cache.delete(`${type}:${url}`);
  }
  clear() {
    this._cache.clear();
  }
}
export {
  AssetManager
}

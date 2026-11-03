class Store {
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
  delete(key) {
    this._get(this._name).delete(key);
  }
  add(json) {
    this._get(this._name).add(json);
  }
  get(key) {
    return new Promise((function(resolve, reject) {
      this._get(this._name).get(key).onsuccess = function(evt) {
        if(evt.target.result) {
          if(!evt.target.result.value) throw new GameLibCore.Error("IndexedDB get() result is missing \"value\" property!");
          resolve(evt.target.result.value);
        } else {
          resolve(null);
        }
      };
    }).bind(this));
  }
}
export {
  Store
}

class Storage {
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
        var objStore = evt.currentTarget.result.createObjectStore(store.name, { 'keyPath': 'key', 'autoIncrement': false });
        objStore.createIndex('key', 'key', { 'unique': true });
        store.indexes.forEach((function(index) {
          objStore.createIndex(index, index, { 'unique': false });
        }).bind(this));
      }).bind(this));
    }).bind(this);
    this._db = null;
    this._idb.onsuccess = (function(evt) {
      this._db = evt.target.result;
      this._storeList.forEach((function(store) {
        store.setGet(function(storeName) {
          var tx = this._storage._db.transaction(storeName, 'readwrite');
          return tx.objectStore(storeName);
        });
      }));
      console.log("[GameLib] Initialized Database: " + this._name);
      if(this.onload) {
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
}
export {
  Storage
}

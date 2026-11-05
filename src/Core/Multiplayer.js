import { PeerNetwork } from "./Network/PeerNetwork.js"
class Multiplayer {
  constructor(options = {}) {
    this.network = new PeerNetwork(options);
  }
  getPeerId() {
    return this.network.id;
  }
  getConnectedIds() {
    return this.network.getConnectedIds();
  }
  bindDataCallback(callback) {
    this.network.off("data", this._dataListener);
    this._dataListener = (data, connection) => callback(data, connection);
    this.network.on("data", this._dataListener);
    return this;
  }
  setConnectPeerCallback(callback) {
    this.network.off("connection", this._connectListener);
    this._connectListener = (connection) => callback(connection);
    this.network.on("connection", this._connectListener);
    return this;
  }
  setPeerCloseCallback(callback) {
    this.network.off("connectionclose", this._closeListener);
    this._closeListener = (connection) => callback(connection);
    this.network.on("connectionclose", this._closeListener);
    return this;
  }
  createPeer(peerOptions = {}) {
    this.network.options = Object.assign({}, this.network.options, peerOptions);
    return this.network.start();
  }
  connectPeer(peerId, peerOptions = {}) {
    this.network.options = Object.assign({}, this.network.options, peerOptions);
    return this.network.connect(peerId);
  }
  sendToAll(data) {
    return this.network.broadcast(data);
  }
  sendToPeer(data, peerId) {
    return peerId == null ? this.network.broadcast(data) : this.network.send(peerId, data);
  }
  closePeer(peerId) {
    return this.network.close(peerId);
  }
  isPeerDisconnected() {
    return this.network.state !== "ready";
  }
  destroy() {
    return this.network.destroy();
  }
}
export { Multiplayer }

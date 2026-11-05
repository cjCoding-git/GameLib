import { PeerNetwork } from "./Network/PeerNetwork.js";

/** Small game-facing API; WebRTC and PeerServer details stay in PeerNetwork. */
class Multiplayer {
  constructor(options = {}) {
    this.network = new PeerNetwork(options);
  }

  get id() {
    return this.network.id;
  }

  get peers() {
    return this.network.getConnectedIds();
  }

  on(event, callback) {
    this.network.on(event, callback);
    return this;
  }

  off(event, callback) {
    this.network.off(event, callback);
    return this;
  }

  start() {
    return this.network.start();
  }

  connect(peerId, options) {
    return this.network.connect(peerId, options);
  }

  send(data, peerId) {
    return peerId == null
      ? this.network.broadcast(data)
      : this.network.send(peerId, data);
  }

  close(peerId) {
    return this.network.close(peerId);
  }

  destroy() {
    return this.network.destroy();
  }
}

export { Multiplayer };

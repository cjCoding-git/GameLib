import { Utils } from "./Utils.js"
import { Peer } from "../Lib/PeerJS.js"
class Multiplayer {
  constructor() {}
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
      } catch (err) {}
    });
  }
  sendToPeer(data, peerId = null) {
    try {
      if (!this._connections) {
        this._connection.send(data);
      } else {
        var conn = this._connections.filter(connection => connection.peer == peerId);
        conn[0].send(data);
      }
    } catch (err) {}
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
    this._peer.on('connection', (function(conn) {
      console.log("[GameLib] P2P Connection from " + conn.peer);
      this._connectedPeerIds.push(conn.peer);
      conn.on('data', (function(data) {
        if (this._peerDataCallback) {
          this._peerDataCallback(data, conn)
        }
      }).bind(this));
      conn.on('close', (function() {
        console.log("[GameLib] P2P Disconnected: " + conn.peer);
        this._connections = this._connections.filter(c => c.peer != conn.peer);
        this._connectedPeerIds = this._connectedPeerIds.filter(id => conn.peer != id);
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
    this._peer.on('open', (function() {
      this._disconnected = false;
      var conn = this._peer.connect(peerId);
      this._connection = conn;
      conn.on('close', (function() {
        this._disconnected = true;
      }).bind(this));
      conn.on('open', (function() {
        conn.send({
          'type': 'JOIN',
          'data': this._peerId
        });
        conn.on('data', (function(data) {
          if (this._peerDataCallback) {
            this._peerDataCallback(data, conn)
          }
        }).bind(this));
      }).bind(this));
    }).bind(this));
  }
}
export {
  Multiplayer
}

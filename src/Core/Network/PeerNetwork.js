var DEFAULT_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
var SIGNALING_VERSION = "1.5.5";
var CLOSE_PACKET = JSON.stringify({ __peerData: { type: "close" } });
class PeerNetwork {
  constructor(options = {}) {
    this.options = options;
    this.id = options.id || PeerNetwork._makeId();
    this.token = options.token || PeerNetwork._makeToken();
    this.socket = null;
    this.peers = new Map();
    this.links = new Map();
    this.listeners = new Map();
    this.candidates = new Map();
    this.state = "idle";
    this._ready = null;
    this._rejectReady = null;
    this._heartbeat = null;
    this._closed = false;
  }
  on(event, listener) {
    if (typeof listener !== "function") throw new TypeError("listener must be a function");
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(listener);
    return this;
  }
  off(event, listener) {
    if (this.listeners.has(event)) this.listeners.get(event).delete(listener);
    return this;
  }
  start() {
    if (this._closed) return Promise.reject(new Error("Network has been closed"));
    if (this.state === "ready") return Promise.resolve(this.id);
    if (this._ready) return this._ready;
    var WebSocketType = this.options.WebSocket || globalThis.WebSocket;
    if (!WebSocketType) return Promise.reject(new Error("WebSocket is unavailable"));
    this.state = "connecting";
    var self = this;
    this._ready = new Promise(function(resolve, reject) {
      var settled = false;
      try {
        self.socket = new WebSocketType(self._brokerUrl());
      } catch (error) {
        self.state = "idle";
        self._ready = null;
        reject(error);
        return;
      }
      var socket = self.socket;
      self._rejectReady = function(error) {
        if (settled) return;
        settled = true;
        self.state = "idle";
        self._ready = null;
        self._rejectReady = null;
        reject(error);
        socket.close();
      };
      socket.onopen = function() {
        self._heartbeat = setInterval(function() { self._signal({ type: "HEARTBEAT" }); }, self.options.heartbeatInterval || 5000);
      };
      socket.onmessage = function(event) {
        var message;
        try {
          message = JSON.parse(event.data);
        } catch (error) {
          self._emit("error", new Error("Invalid broker message"));
          return;
        }
        if (message.type === "OPEN") {
          if (settled) return;
          settled = true;
          self.state = "ready";
          self._ready = null;
          self._rejectReady = null;
          self._emit("ready", self.id);
          resolve(self.id);
          return;
        }
        if (!settled && ["ERROR", "INVALID-KEY", "ID-TAKEN"].includes(message.type)) {
          self._rejectReady(new Error(message.payload?.msg || message.type));
          self._emit("error", new Error(message.payload?.msg || message.type));
          return;
        }
        self._route(message);
      };
      socket.onerror = function(error) {
        self._emit("error", error);
        if (!settled) self._rejectReady(error instanceof Error ? error : new Error("Could not connect to signaling server"));
      };
      socket.onclose = function(event) {
        clearInterval(self._heartbeat);
        self._heartbeat = null;
        if (self.socket === socket) self.socket = null;
        var wasReady = self.state === "ready";
        self.state = self._closed ? "closed" : "idle";
        if (!settled) {
          settled = true;
          self._ready = null;
          self._rejectReady = null;
          reject(new Error("Signaling socket closed before registration (" + (event.code || "closed") + ")"));
        }
        if (wasReady && !self._closed) self._emit("serverclose", event);
      };
    });
    return this._ready;
  }
  async connect(peerId, options = {}) {
    if (!peerId) throw new TypeError("peerId is required");
    if (this._closed) throw new Error("Network has been closed");
    await this.start();
    var id = options.connectionId || "dc_" + PeerNetwork._makeToken();
    var link = this._newLink(peerId, id, options);
    link.channel = link.pc.createDataChannel(options.label || id, {
      ordered: options.reliable !== false,
      ...(options.maxRetransmits == null ? {} : { maxRetransmits: options.maxRetransmits })
    });
    this._watchChannel(link);
    var opened = new Promise(function(resolve, reject) {
      link.once("open", function() { resolve(link); });
      link.once("error", reject);
      link.once("close", function() { reject(new Error("Connection to " + peerId + " closed before opening")); });
    });
    try {
      var offer = await link.pc.createOffer();
      await link.pc.setLocalDescription(offer);
      this._signal({
        type: "OFFER",
        dst: peerId,
        payload: {
          type: "data",
          connectionId: id,
          sdp: link.pc.localDescription,
          label: link.label,
          reliable: link.reliable,
          serialization: link.serialization,
          metadata: link.metadata
        }
      });
    } catch (error) {
      this._fail(link, error);
      throw error;
    }
    return opened;
  }
  getConnectedIds() {
    return Array.from(this.peers.keys());
  }
  send(peerId, data) {
    var link = this.peers.get(peerId);
    if (!link || !link.open) return false;
    link.send(data);
    return true;
  }
  broadcast(data) {
    var delivered = 0;
    this.peers.forEach(function(link) {
      if (link.open) {
        link.send(data);
        delivered++;
      }
    });
    return delivered;
  }
  close(peerId) {
    if (peerId == null) {
      Array.from(this.links.values()).forEach((link) => this._end(link, true));
    } else {
      this.links.forEach((link) => {
        if (link.peerId === peerId) this._end(link, true);
      });
    }
    return this;
  }
  destroy() {
    if (this._closed) return this;
    this._closed = true;
    if (this._rejectReady) this._rejectReady(new Error("Network has been closed"));
    this.close();
    clearInterval(this._heartbeat);
    this._heartbeat = null;
    var socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      if (socket.readyState < 2) socket.close();
    }
    this.state = "closed";
    this._emit("close");
    this.listeners.clear();
    return this;
  }
  _brokerUrl() {
    var location = globalThis.location;
    var host = this.options.host || location?.hostname || "0.peerjs.com";
    var secure = this.options.secure ?? (host === "0.peerjs.com" || location?.protocol === "https:");
    var port = this.options.port ?? (secure ? 443 : 9000);
    var path = this.options.path || "/";
    if (!path.startsWith("/")) path = "/" + path;
    if (!path.endsWith("/")) path += "/";
    var url = new URL((secure ? "wss:" : "ws:") + "//" + host + ":" + port + path + "peerjs");
    url.searchParams.set("key", this.options.key || "peerjs");
    url.searchParams.set("id", this.id);
    url.searchParams.set("token", this.token);
    url.searchParams.set("version", SIGNALING_VERSION);
    return url.href;
  }
  _signal(message) {
    if (this.socket && this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }
  _route(message) {
    var payload = message.payload || {};
    switch (message.type) {
      case "OFFER":
        if (payload.type === "data") this._acceptOffer(message.src, payload);
        break;
      case "ANSWER":
        this._acceptAnswer(payload);
        break;
      case "CANDIDATE":
        this._acceptCandidate(payload);
        break;
      case "LEAVE":
        Array.from(this.links.values()).forEach((link) => {
          if (link.peerId === message.src) this._end(link, false);
        });
        break;
      case "EXPIRE":
        this._emit("error", new Error("Peer unavailable: " + (message.src || "unknown")));
        break;
      case "ID-TAKEN":
      case "INVALID-KEY":
      case "ERROR":
        this._emit("error", new Error(payload.msg || message.type));
        break;
      default:
        this._emit("signal", message);
    }
  }
  _newLink(peerId, connectionId, options = {}) {
    var RTCPeerConnectionType = this.options.RTCPeerConnection || globalThis.RTCPeerConnection;
    if (!RTCPeerConnectionType) throw new Error("WebRTC is unavailable");
    var pc = new RTCPeerConnectionType(options.config || this.options.config || DEFAULT_CONFIG);
    var listeners = new Map();
    var self = this;
    var link = {
      peerId: peerId,
      connectionId: connectionId,
      label: options.label || connectionId,
      metadata: options.metadata,
      serialization: options.serialization || "json",
      reliable: options.reliable !== false,
      pc: pc,
      channel: null,
      open: false,
      on: function(name, callback) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(callback);
        return this;
      },
      once: function(name, callback) {
        var onceCallback = function() {
          this.off(name, onceCallback);
          callback.apply(null, arguments);
        }.bind(this);
        return this.on(name, onceCallback);
      },
      off: function(name, callback) {
        if (listeners.has(name)) listeners.get(name).delete(callback);
        return this;
      },
      emit: function(name) {
        var args = Array.prototype.slice.call(arguments, 1);
        Array.from(listeners.get(name) || []).forEach(function(callback) { callback.apply(null, args); });
      },
      send: function(data) {
        if (!this.open || !this.channel || this.channel.readyState !== "open") throw new Error("Connection is not open");
        this.channel.send(this.serialization === "json" ? JSON.stringify(data) : data);
      },
      close: function() { self._end(link, true); }
    };
    this.links.set(connectionId, link);
    pc.onicecandidate = function(event) {
      if (event.candidate && event.candidate.candidate) {
        self._signal({ type: "CANDIDATE", dst: peerId, payload: { type: "data", connectionId: connectionId, candidate: event.candidate } });
      }
    };
    pc.ondatachannel = function(event) {
      link.channel = event.channel;
      link.label = event.channel.label;
      self._watchChannel(link);
    };
    pc.onconnectionstatechange = function() {
      if (pc.connectionState === "failed") self._fail(link, new Error("WebRTC connection failed"));
      else if (pc.connectionState === "closed") self._end(link, false);
    };
    return link;
  }
  _watchChannel(link) {
    var channel = link.channel;
    channel.onopen = () => {
      if (link.open || link._ended) return;
      link.open = true;
      this.peers.set(link.peerId, link);
      link.emit("open", link);
      this._emit("connection", link);
    };
    channel.onmessage = (event) => {
      var packet = event.data;
      if (link.serialization === "json" && typeof packet === "string") {
        try { packet = JSON.parse(packet); } catch (error) {}
      }
      if (packet && packet.__peerData && packet.__peerData.type === "close") {
        this._end(link, false);
        return;
      }
      link.emit("data", packet);
      this._emit("data", packet, link);
    };
    channel.onerror = (error) => this._fail(link, error);
    channel.onclose = () => this._end(link, false);
  }
  async _acceptOffer(peerId, payload) {
    if (!peerId || !payload.connectionId || !payload.sdp) return;
    var previous = this.links.get(payload.connectionId);
    if (previous) this._end(previous, false);
    var link = this._newLink(peerId, payload.connectionId, payload);
    link.label = payload.label || payload.connectionId;
    link.metadata = payload.metadata;
    link.serialization = payload.serialization || "json";
    link.reliable = payload.reliable !== false;
    try {
      await link.pc.setRemoteDescription(payload.sdp);
      await this._drainCandidates(link);
      var answer = await link.pc.createAnswer();
      await link.pc.setLocalDescription(answer);
      this._signal({ type: "ANSWER", dst: peerId, payload: { type: "data", connectionId: link.connectionId, sdp: link.pc.localDescription } });
    } catch (error) {
      this._fail(link, error);
    }
  }
  async _acceptAnswer(payload) {
    var link = this.links.get(payload.connectionId);
    if (!link || !payload.sdp) return;
    try {
      await link.pc.setRemoteDescription(payload.sdp);
      await this._drainCandidates(link);
    } catch (error) {
      this._fail(link, error);
    }
  }
  async _acceptCandidate(payload) {
    if (!payload.connectionId || !payload.candidate) return;
    var link = this.links.get(payload.connectionId);
    if (!link || !link.pc.remoteDescription) {
      if (!this.candidates.has(payload.connectionId)) this.candidates.set(payload.connectionId, []);
      this.candidates.get(payload.connectionId).push(payload.candidate);
      return;
    }
    try {
      await link.pc.addIceCandidate(payload.candidate);
    } catch (error) {
      this._emit("error", error, link);
    }
  }
  async _drainCandidates(link) {
    var queued = this.candidates.get(link.connectionId) || [];
    this.candidates.delete(link.connectionId);
    for (var i = 0; i < queued.length; i++) await link.pc.addIceCandidate(queued[i]);
  }
  _fail(link, error) {
    link.emit("error", error);
    this._emit("error", error, link);
    this._end(link, false);
  }
  _end(link, notifyPeer) {
    if (!link || link._ended) return;
    link._ended = true;
    if (notifyPeer && link.channel && link.channel.readyState === "open") {
      try { link.channel.send(CLOSE_PACKET); } catch (error) {}
    }
    link.open = false;
    if (link.channel && link.channel.readyState !== "closed") {
      link.channel.onopen = link.channel.onmessage = link.channel.onerror = link.channel.onclose = null;
      try { link.channel.close(); } catch (error) {}
    }
    if (link.pc.signalingState !== "closed") {
      link.pc.onicecandidate = link.pc.ondatachannel = link.pc.onconnectionstatechange = null;
      try { link.pc.close(); } catch (error) {}
    }
    this.links.delete(link.connectionId);
    if (this.peers.get(link.peerId) === link) this.peers.delete(link.peerId);
    this.candidates.delete(link.connectionId);
    link.emit("close");
    this._emit("connectionclose", link);
  }
  _emit(event) {
    var args = Array.prototype.slice.call(arguments, 1);
    Array.from(this.listeners.get(event) || []).forEach(function(callback) {
      try { callback.apply(null, args); } catch (error) { setTimeout(function() { throw error; }, 0); }
    });
  }
  static _makeId() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
  static _makeToken() {
    if (globalThis.crypto && globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID().replace(/-/g, "");
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
export { PeerNetwork };

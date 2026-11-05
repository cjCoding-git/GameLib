const DEFAULT_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const SIGNALING_VERSION = "1.5.5";
const CLOSE_PACKET = JSON.stringify({ __peerData: { type: "close" } });

/**
 * A compact game networking layer built on native WebRTC.
 *
 * Signaling messages and the WebSocket URL follow the PeerServer protocol so
 * this can use PeerJS brokers, but connection management, events, and the game
 * API here are independent of the PeerJS client library.
 */
class PeerNetwork {
  constructor(options = {}) {
    this.options = options;
    this.id = options.id || PeerNetwork._makeId();
    this.token = options.token || PeerNetwork._makeToken();
    this.socket = null;
    this.peers = new Map();
    this.listeners = new Map();
    this.candidates = new Map();
    this.state = "idle";
    this._ready = null;
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
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  /** Register with a PeerJS-compatible signaling server. */
  start() {
    if (this._closed) return Promise.reject(new Error("Network has been closed"));
    if (this.state === "ready") return Promise.resolve(this.id);
    if (this._ready) return this._ready;

    const WebSocketType = this.options.WebSocket || globalThis.WebSocket;
    if (!WebSocketType) return Promise.reject(new Error("WebSocket is unavailable"));

    this.state = "connecting";
    this._ready = new Promise((resolve, reject) => {
      let registered = false;
      try {
        this.socket = new WebSocketType(this._brokerUrl());
      } catch (error) {
        this.state = "idle";
        this._ready = null;
        reject(error);
        return;
      }

      const socket = this.socket;
      socket.onopen = () => {
        this._heartbeat = setInterval(() => this._signal({ type: "HEARTBEAT" }), this.options.heartbeatInterval || 5000);
      };
      socket.onmessage = ({ data }) => {
        let message;
        try {
          message = JSON.parse(data);
        } catch {
          this._emit("error", new Error("Invalid broker message"));
          return;
        }
        if (message.type === "OPEN") {
          registered = true;
          this.state = "ready";
          this._ready = null;
          this._emit("ready", this.id);
          resolve(this.id);
          return;
        }
        this._route(message);
      };
      socket.onerror = (error) => {
        this._emit("error", error);
        if (!registered) {
          this.state = "idle";
          this._ready = null;
          reject(error instanceof Error ? error : new Error("Could not connect to signaling server"));
        }
      };
      socket.onclose = (event) => {
        clearInterval(this._heartbeat);
        this._heartbeat = null;
        if (this.socket === socket) this.socket = null;
        const wasReady = this.state === "ready";
        this.state = this._closed ? "closed" : "idle";
        if (!registered) {
          this._ready = null;
          reject(new Error(`Signaling socket closed before registration (${event.code || "closed"})`));
        }
        if (wasReady && !this._closed) this._emit("serverclose", event);
      };
    });
    return this._ready;
  }

  /** Create a direct data-channel connection to another registered peer. */
  async connect(peerId, options = {}) {
    if (!peerId) throw new TypeError("peerId is required");
    if (this._closed) throw new Error("Network has been closed");
    await this.start();

    const id = options.connectionId || `dc_${PeerNetwork._makeToken()}`;
    const link = this._newLink(peerId, id, options);
    link.channel = link.pc.createDataChannel(options.label || id, {
      ordered: options.reliable !== false,
      ...(options.maxRetransmits == null ? {} : { maxRetransmits: options.maxRetransmits }),
    });
    this._watchChannel(link);

    const opened = new Promise((resolve, reject) => {
      link.once("open", () => resolve(link));
      link.once("error", reject);
      link.once("close", () => reject(new Error(`Connection to ${peerId} closed before opening`)));
    });

    try {
      const offer = await link.pc.createOffer();
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
          metadata: link.metadata,
        },
      });
    } catch (error) {
      this._fail(link, error);
      throw error;
    }
    return opened;
  }

  getConnectedIds() {
    return [...this.peers.keys()];
  }

  send(peerId, data) {
    const link = this.peers.get(peerId);
    if (!link?.open) return false;
    link.send(data);
    return true;
  }

  broadcast(data) {
    let delivered = 0;
    for (const link of this.peers.values()) {
      if (link.open) {
        link.send(data);
        delivered++;
      }
    }
    return delivered;
  }

  close(peerId) {
    if (peerId == null) {
      for (const link of new Set(this.peers.values())) this._end(link, true);
    } else {
      const link = this.peers.get(peerId);
      if (link) this._end(link, true);
    }
    return this;
  }

  destroy() {
    if (this._closed) return this;
    this._closed = true;
    this.close();
    clearInterval(this._heartbeat);
    this._heartbeat = null;
    const socket = this.socket;
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
    const location = globalThis.location;
    const host = this.options.host || location?.hostname || "0.peerjs.com";
    const secure = this.options.secure ?? (host === "0.peerjs.com" || location?.protocol === "https:");
    const port = this.options.port ?? (secure ? 443 : 9000);
    let path = this.options.path || "/";
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path += "/";
    const protocol = secure ? "wss:" : "ws:";
    const url = new URL(`${protocol}//${host}:${port}${path}peerjs`);
    url.searchParams.set("key", this.options.key || "peerjs");
    url.searchParams.set("id", this.id);
    url.searchParams.set("token", this.token);
    url.searchParams.set("version", SIGNALING_VERSION);
    return url.href;
  }

  _signal(message) {
    if (this.socket?.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  _route(message) {
    const payload = message.payload || {};
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
        for (const link of this.peers.values()) {
          if (link.peerId === message.src) this._end(link, false);
        }
        break;
      case "EXPIRE":
        this._emit("error", new Error(`Peer unavailable: ${message.src || "unknown"}`));
        break;
      case "ID-TAKEN":
        this._emit("error", new Error(`Peer ID already in use: ${this.id}`));
        break;
      case "INVALID-KEY":
      case "ERROR":
        this._emit("error", new Error(payload.msg || message.type));
        break;
      default:
        this._emit("signal", message);
    }
  }

  _newLink(peerId, connectionId, options = {}) {
    const RTCPeerConnectionType = this.options.RTCPeerConnection || globalThis.RTCPeerConnection;
    if (!RTCPeerConnectionType) throw new Error("WebRTC is unavailable");
    const pc = new RTCPeerConnectionType(options.config || this.options.config || DEFAULT_CONFIG);
    const listeners = new Map();
    const link = {
      peerId,
      connectionId,
      label: options.label || connectionId,
      metadata: options.metadata,
      serialization: options.serialization || "json",
      reliable: options.reliable !== false,
      pc,
      channel: null,
      open: false,
      on(name, callback) {
        if (!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(callback);
        return this;
      },
      once(name, callback) {
        const onceCallback = (...args) => {
          this.off(name, onceCallback);
          callback(...args);
        };
        return this.on(name, onceCallback);
      },
      off(name, callback) {
        listeners.get(name)?.delete(callback);
        return this;
      },
      emit(name, ...args) {
        for (const callback of [...(listeners.get(name) || [])]) callback(...args);
      },
      send(data) {
        if (!this.open || this.channel?.readyState !== "open") throw new Error("Connection is not open");
        this.channel.send(this.serialization === "json" ? JSON.stringify(data) : data);
      },
      close: () => this._end(link, true),
    };
    pc.onicecandidate = ({ candidate }) => {
      if (candidate?.candidate) {
        this._signal({
          type: "CANDIDATE",
          dst: peerId,
          payload: { type: "data", connectionId, candidate },
        });
      }
    };
    pc.ondatachannel = ({ channel }) => {
      link.channel = channel;
      link.label = channel.label;
      this._watchChannel(link);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") this._fail(link, new Error("WebRTC connection failed"));
      else if (pc.connectionState === "closed") this._end(link, false);
    };
    return link;
  }

  _watchChannel(link) {
    const channel = link.channel;
    channel.onopen = () => {
      if (link.open) return;
      link.open = true;
      this.peers.set(link.peerId, link);
      link.emit("open", link);
      this._emit("connection", link);
    };
    channel.onmessage = ({ data }) => {
      let packet = data;
      if (link.serialization === "json" && typeof data === "string") {
        try { packet = JSON.parse(data); } catch { /* Deliver plain text unchanged. */ }
      }
      if (packet?.__peerData?.type === "close") {
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
    const link = this._newLink(peerId, payload.connectionId, payload);
    link.label = payload.label || payload.connectionId;
    link.metadata = payload.metadata;
    link.serialization = payload.serialization || "json";
    link.reliable = payload.reliable !== false;
    try {
      await link.pc.setRemoteDescription(payload.sdp);
      await this._drainCandidates(link);
      const answer = await link.pc.createAnswer();
      await link.pc.setLocalDescription(answer);
      this._signal({
        type: "ANSWER",
        dst: peerId,
        payload: { type: "data", connectionId: link.connectionId, sdp: link.pc.localDescription },
      });
    } catch (error) {
      this._fail(link, error);
    }
  }

  async _acceptAnswer(payload) {
    const link = this._findLink(payload.connectionId);
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
    const link = this._findLink(payload.connectionId);
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
    const queued = this.candidates.get(link.connectionId) || [];
    this.candidates.delete(link.connectionId);
    for (const candidate of queued) await link.pc.addIceCandidate(candidate);
  }

  _findLink(connectionId) {
    for (const link of this.peers.values()) if (link.connectionId === connectionId) return link;
    return this._pendingLinks?.get(connectionId) || null;
  }

  _fail(link, error) {
    link.emit("error", error);
    this._emit("error", error, link);
    this._end(link, false);
  }

  _end(link, notifyPeer) {
    if (!link || link._ended) return;
    link._ended = true;
    if (notifyPeer && link.channel?.readyState === "open") {
      try { link.channel.send(CLOSE_PACKET); } catch { /* Closing transport. */ }
    }
    link.open = false;
    if (link.channel && link.channel.readyState !== "closed") {
      link.channel.onopen = link.channel.onmessage = link.channel.onerror = link.channel.onclose = null;
      try { link.channel.close(); } catch { /* Already closed. */ }
    }
    if (link.pc.signalingState !== "closed") {
      link.pc.onicecandidate = link.pc.ondatachannel = link.pc.onconnectionstatechange = null;
      try { link.pc.close(); } catch { /* Already closed. */ }
    }
    if (this.peers.get(link.peerId) === link) this.peers.delete(link.peerId);
    this._pendingLinks?.delete(link.connectionId);
    this.candidates.delete(link.connectionId);
    link.emit("close");
    this._emit("connectionclose", link);
  }

  _emit(event, ...args) {
    for (const callback of [...(this.listeners.get(event) || [])]) {
      try { callback(...args); } catch (error) { queueMicrotask(() => { throw error; }); }
    }
  }

  static _makeId() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  static _makeToken() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/g, "");
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

export { PeerNetwork };

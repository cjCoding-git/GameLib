const DEFAULT_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const PEERJS_PROTOCOL_VERSION = "1.5.4";

/**
 * A small PeerJS-signaling-compatible WebRTC data-channel client.
 *
 * `options` accepts PeerServer-style settings (`host`, `port`, `path`, `key`,
 * `secure`, and `config`). The signaling server must speak the PeerJS
 * PeerServer protocol; media calls and PeerJS reliability shims are not
 * implemented here.
 */
class PeerNetwork {
  constructor(options = {}) {
    this.options = options;
    this.id = options.id || null;
    this.token = options.token || PeerNetwork._randomToken();
    this.connections = new Map();
    this.handlers = new Map();
    this.pendingSignals = [];
    this.socket = null;
    this.heartbeat = null;
    this.destroyed = false;

    if (options.autoConnect !== false) this.connectToServer();
  }

  on(event, handler) {
    if (typeof handler !== "function") throw new TypeError("handler must be a function");
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  emit(event, ...args) {
    for (const handler of this.handlers.get(event) || []) {
      try {
        handler(...args);
      } catch (error) {
        // A consumer callback should not prevent other network listeners running.
        queueMicrotask(() => { throw error; });
      }
    }
    return this;
  }

  connectToServer() {
    if (this.destroyed) throw new Error("PeerNetwork has been destroyed");
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) return this;

    const socket = new WebSocket(this._signalingUrl());
    this.socket = socket;
    socket.onopen = () => {
      this._flushSignals();
      this.heartbeat = setInterval(() => {
        this._sendSignal({ type: "HEARTBEAT" });
      }, this.options.heartbeatInterval || 5000);
      this.emit("connect");
    };
    socket.onmessage = ({ data }) => this._handleSignal(data);
    socket.onerror = (error) => this.emit("error", error);
    socket.onclose = (event) => {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
      if (!this.destroyed) this.emit("disconnected", event);
    };
    return this;
  }

  /** Open a WebRTC data-channel connection to another PeerJS peer ID. */
  connect(peerId, options = {}) {
    if (!peerId || typeof peerId !== "string") throw new TypeError("peerId must be a non-empty string");
    if (this.destroyed) throw new Error("PeerNetwork has been destroyed");

    const connectionId = options.connectionId || `dc_${PeerNetwork._randomToken()}`;
    const connection = this._createConnection(peerId, connectionId, options, true);
    const label = options.label || connectionId;
    connection.label = label;
    connection.reliable = options.reliable !== false;
    connection.serialization = options.serialization || "json";
    connection.metadata = options.metadata;
    connection.dataChannel = connection.peerConnection.createDataChannel(label, {
      ordered: connection.reliable,
      ...(options.maxRetransmits == null ? {} : { maxRetransmits: options.maxRetransmits }),
    });
    this._bindDataChannel(connection, connection.dataChannel);

    connection.peerConnection.createOffer()
      .then((offer) => connection.peerConnection.setLocalDescription(offer))
      .then(() => this._sendSignal({
        type: "OFFER",
        dst: peerId,
        payload: {
          sdp: connection.peerConnection.localDescription,
          connectionId,
          label,
          reliable: connection.reliable,
          serialization: connection.serialization,
          metadata: connection.metadata,
        },
      }))
      .catch((error) => this._connectionError(connection, error));

    return connection;
  }

  disconnect() {
    clearInterval(this.heartbeat);
    this.heartbeat = null;
    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      if (socket.readyState === WebSocket.OPEN) socket.close();
    }
    this.emit("disconnected");
    return this;
  }

  destroy() {
    if (this.destroyed) return this;
    this.destroyed = true;
    this.disconnect();
    for (const connection of this.connections.values()) connection.close();
    this.connections.clear();
    this.emit("close");
    this.handlers.clear();
    return this;
  }

  _signalingUrl() {
    const secure = this.options.secure ?? globalThis.location?.protocol === "https:";
    const protocol = secure ? "wss:" : "ws:";
    const host = this.options.host || globalThis.location?.hostname || "0.peerjs.com";
    const port = this.options.port ?? (secure ? 443 : 9000);
    const path = `/${(this.options.path || "/peerjs").replace(/^\/+|\/+$/g, "")}`;
    const url = new URL(`${protocol}//${host}:${port}${path}`);
    url.searchParams.set("key", this.options.key || "peerjs");
    url.searchParams.set("id", this.id || "");
    url.searchParams.set("token", this.token);
    url.searchParams.set("version", PEERJS_PROTOCOL_VERSION);
    return url.toString();
  }

  _sendSignal(message) {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      this.pendingSignals.push(message);
      if (!this.destroyed && (!socket || socket.readyState >= WebSocket.CLOSING)) this.connectToServer();
      return;
    }
    if (this.id && message.type !== "HEARTBEAT" && message.type !== "LEAVE") message.src = this.id;
    socket.send(JSON.stringify(message));
  }

  _flushSignals() {
    for (const message of this.pendingSignals.splice(0)) this._sendSignal(message);
  }

  _handleSignal(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch (error) {
      this.emit("error", new Error(`Invalid signaling message: ${error.message}`));
      return;
    }

    switch (message.type) {
      case "OPEN":
        this.id = message.payload?.id || message.id || this.id;
        this.emit("open", this.id);
        break;
      case "OFFER":
        this._handleOffer(message);
        break;
      case "ANSWER":
        this._handleAnswer(message);
        break;
      case "CANDIDATE":
        this._handleCandidate(message);
        break;
      case "ID-TAKEN":
      case "INVALID-KEY":
      case "ERROR":
      case "EXPIRE":
        this.emit("error", new Error(message.payload?.msg || message.msg || message.type));
        break;
      default:
        this.emit("signal", message);
    }
  }

  _createConnection(peerId, connectionId, options, outgoing) {
    const config = options.config || this.options.config || { iceServers: DEFAULT_ICE_SERVERS };
    const peerConnection = new RTCPeerConnection(config);
    const connection = {
      peerId,
      connectionId,
      outgoing,
      peerConnection,
      dataChannel: null,
      label: options.label || connectionId,
      metadata: options.metadata,
      reliable: options.reliable !== false,
      serialization: options.serialization || "json",
      opened: false,
      send: (data) => {
        if (!connection.dataChannel || connection.dataChannel.readyState !== "open") {
          throw new Error("Data channel is not open");
        }
        if (connection.serialization === "json" && typeof data !== "string" && !(data instanceof ArrayBuffer) && !ArrayBuffer.isView(data)) {
          connection.dataChannel.send(JSON.stringify(data));
        } else {
          connection.dataChannel.send(data);
        }
      },
      close: () => {
        if (connection.dataChannel && connection.dataChannel.readyState !== "closed") connection.dataChannel.close();
        if (peerConnection.signalingState !== "closed") peerConnection.close();
        this.connections.delete(connectionId);
      },
    };
    this.connections.set(connectionId, connection);
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) this._sendSignal({
        type: "CANDIDATE",
        dst: peerId,
        payload: { candidate: candidate.toJSON ? candidate.toJSON() : candidate, type: "data" },
      });
    };
    peerConnection.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(peerConnection.connectionState)) {
        if (peerConnection.connectionState === "failed") this._connectionError(connection, new Error("WebRTC connection failed"));
        connection.close();
      }
    };
    peerConnection.ondatachannel = ({ channel }) => {
      connection.dataChannel = channel;
      connection.label = channel.label;
      this._bindDataChannel(connection, channel);
    };
    return connection;
  }

  _bindDataChannel(connection, channel) {
    channel.onopen = () => {
      if (connection.opened) return;
      connection.opened = true;
      this.emit("connection", connection);
      this.emit("connectionopen", connection);
    };
    channel.onmessage = ({ data }) => {
      let value = data;
      if (connection.serialization === "json" && typeof data === "string") {
        try { value = JSON.parse(data); } catch { /* Preserve non-JSON text. */ }
      }
      this.emit("data", value, connection);
      connection.ondata?.(value);
    };
    channel.onerror = (error) => this._connectionError(connection, error);
    channel.onclose = () => {
      this.connections.delete(connection.connectionId);
      this.emit("connectionclose", connection);
    };
  }

  async _handleOffer(message) {
    const payload = message.payload || {};
    const peerId = message.src;
    if (!peerId || !payload.connectionId || !payload.sdp) return;
    const connection = this._createConnection(peerId, payload.connectionId, payload, false);
    connection.label = payload.label || payload.connectionId;
    connection.metadata = payload.metadata;
    connection.reliable = payload.reliable !== false;
    connection.serialization = payload.serialization || "json";
    try {
      await connection.peerConnection.setRemoteDescription(payload.sdp);
      const answer = await connection.peerConnection.createAnswer();
      await connection.peerConnection.setLocalDescription(answer);
      this._sendSignal({
        type: "ANSWER",
        dst: peerId,
        payload: { sdp: connection.peerConnection.localDescription, connectionId: payload.connectionId },
      });
    } catch (error) {
      this._connectionError(connection, error);
    }
  }

  async _handleAnswer(message) {
    const payload = message.payload || {};
    const connection = this.connections.get(payload.connectionId);
    if (!connection || !payload.sdp) return;
    try {
      await connection.peerConnection.setRemoteDescription(payload.sdp);
    } catch (error) {
      this._connectionError(connection, error);
    }
  }

  async _handleCandidate(message) {
    const payload = message.payload || {};
    const connection = this.connections.get(payload.connectionId);
    if (!connection || !payload.candidate) return;
    try {
      await connection.peerConnection.addIceCandidate(payload.candidate);
    } catch (error) {
      this._connectionError(connection, error);
    }
  }

  _connectionError(connection, error) {
    this.emit("error", error, connection);
    connection.close();
  }

  static _randomToken() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/g, "");
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export { PeerNetwork };

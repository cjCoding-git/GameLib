import { GameLibError } from "../Error.js"
import { PeerNetwork } from "./PeerNetwork.js"
class Network {
  constructor() {
    throw new GameLibError("Class Network may not be constructed!");
  }
  static PeerNetwork = PeerNetwork;
}
export {
  Network
}

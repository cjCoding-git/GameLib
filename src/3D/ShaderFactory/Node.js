import { GameLibCore } from "../../Core/index.js"
class Node {
  constructor() {
    this.canHaveChildren = false;
    this.canAddNode = false;
    this.canAddVar = false;
    this.canAddHeader = false;
    this._nodes = [];
    this._parent = null;
    this.text = null;
  }
  addNode(node) {
    if(!node.canAddNode) {
      throw new GameLibCore.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
    }
    if(!this.canHaveChildren) {
      throw new GameLibCore.Error("Trying to add children to a GameLib3D.ShaderFactory.Node that cannot contain children!");
    }
    node._parent = this;
    this._nodes.push(node);
  }
}
export {
  Node
}

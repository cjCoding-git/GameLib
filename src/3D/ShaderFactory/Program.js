import { GameLibCore } from "../../Core/index.js"
class Program {
  constructor() {
    this._header = [];
    this._vars = [];
    this._nodes = [];
  }
  get header() {
    return this._header;
  }
  get vars() {
    return this._vars;
  }
  get nodes() {
    return this._nodes;
  }
  addNode(node) {
    if(!node.canAddNode) {
      throw new GameLibCore.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
    }
    node._parent = this;
    this._nodes.push(node);
  }
  addVar(node) {
    if(!node.canAddVar) {
      throw new GameLibCore.Error("Cannot add a GameLib3D.ShaderFactory.Node as a variable that has canAddVar set to false!");
    }
    node._parent = this;
    this._vars.push(node);
  }
  addHeader(node) {
    if(!node.canAddHeader) {
      throw new GameLibCore.Error("Cannot add a GameLib3D.ShaderFactory.Node as a header that has canAddHeader set to false!");
    }
    node._parent = this;
    this._header.push(node);
  }
}
export {
  Program
}

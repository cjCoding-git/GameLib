import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.AssignVariable = class AssignVariableNode extends Node {
  constructor(target, node) {
    super();
    this._target = target;
    this._node = node;
    this.canAddNode = true;
    this.text = `${this._target} = ${this._node.text};`;
  }
};

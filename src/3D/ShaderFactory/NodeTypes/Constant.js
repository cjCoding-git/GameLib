import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Constant = class ConstantNode extends Node {
  constructor(value) {
    super();
    this._value = value;
    this.text = value;
  }
};

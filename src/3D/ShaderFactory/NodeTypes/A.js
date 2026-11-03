import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.A = class ANode extends Node {
  constructor(value) {
    super();
    this._value = value;
    this.text = `(${this._value.text}).a`;
  }
};

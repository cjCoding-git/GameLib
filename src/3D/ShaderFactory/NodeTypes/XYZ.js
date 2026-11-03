import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.XYZ = class XYZNode extends Node {
  constructor(value) {
    super();
    this._value = value;
    this.text = `(${this._value.text}).xyz`;
  }
};

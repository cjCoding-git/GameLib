import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Exp2 = class Exp2Node extends Node {
  constructor(value) {
    super();
    this._value = value;
    this.text = `exp2(${this._value.text})`;
  }
};

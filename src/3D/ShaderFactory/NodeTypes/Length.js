import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Length = class LengthNode extends Node {
  constructor(value) {
    super();
    this._value = value;
    this.text = `length(${this._value.text})`;
  }
};

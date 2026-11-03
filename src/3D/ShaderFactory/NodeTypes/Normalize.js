import { NodeTypes } from "./NodeTypes.js"
import { Node } from "./Node.js"
NodeTypes.Normalize = class NormalizeNode extends Node {
  constructor(value) {
    super();
    this._value = value;
    var valueText = this._value.text;
    this.text = `normalize(${valueText})`;
  }
};

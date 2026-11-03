import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Precision = class PrecisionNode extends Node {
  constructor(type, precision) {
    super();
    this.canAddHeader = true;
    this._type = type;
    this._precision = precision;
    this.text = `precision ${this._precision} ${this._type};`;
  }
};

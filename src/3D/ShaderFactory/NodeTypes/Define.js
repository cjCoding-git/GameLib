import { NodeTypes } from "./NodeTypes.js"
import { Node } from "./Node.js"
NodeTypes.Define = class DefineNode extends Node {
  constructor(name, value) {
    super();
    this.canAddNode = true;
    this._name = name;
    this._value = value;
    this.text = `#define ${this._name} ${this._value.text}`;
  }
};

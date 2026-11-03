import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Texture2D = class Texture2DNode extends Node {
  constructor(value1, value2) {
    super();
    this._value1 = value1;
    this._value2 = value2;
    this.text = `texture2D(${value1.text}, ${value2.text})`;
  }
};

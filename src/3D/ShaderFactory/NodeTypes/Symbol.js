import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Symbol = class SymbolNode extends Node {
  constructor(name) {
      super();
      this._name = name;
      this.text = name;
  }
};

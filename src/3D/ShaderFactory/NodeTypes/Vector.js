import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Vector = class VectorNode extends Node {
  constructor(type, ...values) {
    super();
    this._type = type;
    this._values = values;
    var valueTexts = [];
    for(var i=0;i<this._values.length;i++) {
      valueTexts.push(this._values[i].text);
    }
    var joinedValues = valueTexts.join(', ');
    this.text = `${this._type}(${joinedValues})`;
  }
};

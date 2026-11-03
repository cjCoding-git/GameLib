import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Subtract = class SubtractNode extends Node {
  constructor(...values) {
      super();
    this._values = values;
    var valueTexts = [];
    for(var i=0;i<this._values.length;i++) {
      valueTexts.push(this._values[i].text);
    }
    this.text = valueTexts.join(' - ');
  }
};

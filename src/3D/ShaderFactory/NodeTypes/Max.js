import { NodeType } from "./NodeType.js"
import { Node } from "../Node.js"
NodeTypes.Max = class MaxNode extends Node {
  constructor(...values) {
    super();
    this._values = values;
    var valueTexts = [];
    for(var i=0;i<this._values.length;i++) {
      valueTexts.push(this._values[i].text);
    }
    var valuesText = valueTexts.join(', ');
    this.text = `max(${valuesText})`;
  }
};

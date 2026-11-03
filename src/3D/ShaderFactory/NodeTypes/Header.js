import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
NodeTypes.Header = class HeaderNode extends Node {
  constructor(type, ...data) {
    super();
    this.canAddHeader = true;
    this._type = type;
    this._data = data;
    var joinedData = this._data.join(' ');
    this.text = `#${this._type} ${joinedData}`;
  }
};

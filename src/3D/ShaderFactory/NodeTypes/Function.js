import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
import { GameLibCore } from "../../../Core/index.js"
NodeTypes.Function = class FunctionNode extends Node {
  constructor(type, name, params) {
    super();
    this.canAddNode = true;
    this.canHaveChildren = true;
    this._type = type;
    this._name = name;
    this._params = params;
    var paramsText = this._params.join(', ');
    this._startText = `${this._type} ${this._name}(${paramsText}) {\n`;
    this._endText = "\n}";
    this.update();
  }
  update() {
    var nodeTexts = [];
    for(var i=0;i<this._nodes.length;i++) {
      nodeTexts.push(this._nodes[i].text);
    }
    var nodesText = nodeTexts.join("\n");
    this.text = `${this._startText}${nodesText}${this._endText}`;
  }
  addNode(node) {
    if(!node.canAddNode) {
      throw new GameLibCore.Error("Cannot add a GameLib3D.ShaderFactory.Node that has canAddNode set to false!");
    }
    if(!this.canHaveChildren) {
      throw new GameLibCore.Error("Trying to add children to a GameLib3D.ShaderFactory.Node that cannot contain children!");
    }
    node._parent = this;
    this._nodes.push(node);
    this.update();
  }
};

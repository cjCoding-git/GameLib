import { NodeTypes } from "./NodeTypes.js"
import { Node } from "../Node.js"
import { Modifiers } from "../Modifiers/index.js"
NodeTypes.Variable = class VariableNode extends Node {
  constructor(type, name, modifiers=null, initialValue=null) {
    super();
    if(!modifiers || !(modifiers instanceof Modifiers.Variable)) modifiers = new Modifiers.Variable();
    modifiers.update();
    this.canAddNode = true;
    this.canAddVar = true;
    this._type = type;
    this._name = name;
    this._modifiers = modifiers;
    this._initialValue = initialValue;
    var initialValueText = "";
    if(this._initialValue !== null) {
      var valueString = this._initialValue.text;
      initialValueText = ` = ${valueString}`;
    }
    this.text = `${this._modifiers.text}${this._type} ${this._name}${initialValueText};`;
  }
};

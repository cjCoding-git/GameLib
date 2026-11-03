import { Modifiers } from "./Modifiers/index.js"
class FunctionParam {
  constructor(type, name, modifiers) {
    if(!modifiers || !(Modifiers.Variable)) modifiers = new Modifiers.Variable();
    modifiers.update();
    this._type = type;
    this._name = name;
    this._modifiers = modifiers;
    this.text = `${this._modifiers.text}${this._type} ${this._name}`;
  }
}
export {
  FunctionParam
}

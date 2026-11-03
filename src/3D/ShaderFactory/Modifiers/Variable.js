import { GameLibCore } from "../../../Core/index.js"
class Variable {
  constructor({ input=false, output=false, uniform=false, attribute=false, varying=false, constant=false, precision=null } = {}) {
    this._input = input;
    this._output = output;
    this._uniform = uniform;
    this._attribute = attribute;
    this._varying = varying;
    this._constant = constant;
    this._precision = precision;
    this.text = null;
    this.update();
  }
  update() {
    var includeProps = [ "_input", "_output", "_uniform", "_attribute", "_varying" ];
    var matchedProps = 0;
    for(var i=0;i<includeProps.length;i++) {
      var prop = includeProps[i];
      if(this[prop]) matchedProps += 1;
    }
    if(matchedProps > 1) {
      throw new GameLibCore.Error("Class GameLib3D.ShaderFactory.Modifiers.Variable has conflicting properties!");
    }
    this.text = "";
    if(this._constant) this.text += "const ";
    if(this._input) this.text += "in ";
    if(this._output) this.text += "out ";
    if(this._uniform) this.text += "uniform ";
    if(this._attribute) this.text += "attribute ";
    if(this._varying) this.text += "varying ";
    if(this._precision) this.text += `${this._precision} `;
  }
  get input() {
    return this._input;
  }
  set input(value) {
    this._input = value;
    this.update();
  }
  get output() {
    return this._output;
  }
  set output(value) {
    this._output = value;
    this.update();
  }
  get uniform() {
    return this._uniform;
  }
  set uniform(value) {
    this._uniform = value;
    this.update();
  }
  get attribute() {
    return this._attribute;
  }
  set attribute(value) {
    this._attribute = value;
    this.update();
  }
  get varying() {
    return this._varying;
  }
  set varying(value) {
    this._varying = value;
    this.update();
  }
  get constant() {
    return this._constant;
  }
  set constant(value) {
    this._constant = value;
    this.update();
  }
  get precision() {
    return this._precision;
  }
  set precision(value) {
    this._precision = value;
    this.update();
  }
}
export {
  Variable
}

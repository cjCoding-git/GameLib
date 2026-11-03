import { GameLibCore } from "../../Core/index.js"
import { Node } from "./Node.js"
import { Modifiers } from "./Modifiers/index.js"
import { FunctionParam } from "./FunctionParam.js"
import { VariableTypes } from "./VariableTypes.js"
import { PrecisionTypes } from "./PrecisionTypes.js"
import { NodeTypes } from "./NodeTypes/index.js"
import { Program } from "./Program.js"
class ShaderFactory {
  constructor() {
    throw new GameLibCore.Error("Class GameLib3D.ShaderFactory may not be constructed!");
  }
  static Node = Node;
  static Modifiers = Modifiers;
  static FunctionParam = FunctionParam;
  static VariableTypes = VariableTypes;
  static PrecisionTypes = PrecisionTypes;
  static NodeTypes = NodeTypes;
  static Program = Program;
  static compileFactory(shaderFactoryProgram) {
    var headers = shaderFactoryProgram.header;
    var headerTexts = [];
    for(var i=0;i<headers.length;i++) {
      headerTexts.push(headers[i].text);
    }
    var headersText = headerTexts.join("\n");
    var vars = shaderFactoryProgram.vars;
    var varTexts = [];
    for(var i=0;i<vars.length;i++) {
      varTexts.push(vars[i].text);
    }
    var varsText = varTexts.join("\n");
    var nodes = shaderFactoryProgram.nodes;
    var nodeTexts = [];
    for(var i=0;i<nodes.length;i++) {
      nodeTexts.push(nodes[i].text);
    }
    var nodesText = nodeTexts.join("\n");
    var result = `${headersText}\n${varsText}\n${nodesText}`;
    return result;
  }
}
export {
  ShaderFactory
}

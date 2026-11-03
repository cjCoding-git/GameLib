import { NodeTypes } from "./NodeTypes.js"
import { VariableTypes } from "../VariableTypes.js"
NodeTypes.MainFunction = class MainFunctionNode extends NodeTypes.Function {
  constructor() {
    super(VariableTypes.VOID, "main", []);
  }
};

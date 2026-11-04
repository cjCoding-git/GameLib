import { GameLibCore } from "../Core/index.js"
class Loading {
  constructor() {
    throw new GameLibCore.Error("Class Loading may not be constructed!");
  }
  render(canvas, ctx) {
    this._viewportCtx.fillStyle = "#000000";
    this._viewportCtx.fillRect(0, 0, this._viewportCanvas.width, this._viewportCanvas.height);
    this._viewportCtx.fillStyle = "#ffffff";
    this._viewportCtx.font = "bold 50px sans-serif";
    this._viewportCtx.textAlign = "center";
    this._viewportCtx.textBaseline = "alphabetic";
    var textMetrics = this._viewportCtx.measureText("LOADING");
    this._viewportCtx.fillText("LOADING", (this._viewportCanvas.width / 2) - (textMetrics.width / 2), this._viewportCanvas.height / 2);
  }
}
export {
  Loading
}

import { GameLibCore } from "./index.js"
class Loading {
  constructor() {
    throw new GameLibCore.Error("Class Loading may not be constructed!");
  }
  static DEFAULT_CONFIG = {
    background: "#10131c",
    logo: null,
    status: "Loading…",
    progress: null,
    textColor: "#ffffff",
    mutedTextColor: "#aab3c5",
    progressTrackColor: "#343b4d",
    progressColor: "#78e0a3",
    accentColor: "#78e0a3",
    font: "16px sans-serif",
    title: "LOADING",
    titleFont: "bold 36px sans-serif",
    progressWidth: 280,
    progressHeight: 12,
    logoWidth: 96,
    logoHeight: 96,
    padding: 24
  };
  static render(canvas, ctx, config = {}) {
    if (!canvas || !ctx) {
      return;
    }
    var options = { ...Loading.DEFAULT_CONFIG, ...(config || {}) };
    var width = canvas.width;
    var height = canvas.height;
    var centerX = width / 2;
    var centerY = height / 2;
    var progressHeight = Math.max(1, options.progressHeight);
    var percentageWidth = Number.isFinite(options.progress) ? 42 : 0;
    var percentageGap = percentageWidth > 0 ? 12 : 0;
    var maxBarWidth = Math.max(0, width - options.padding * 2 - percentageWidth - percentageGap);
    var progressWidth = Math.min(Math.max(0, options.progressWidth), maxBarWidth);
    var groupWidth = progressWidth + percentageGap + percentageWidth;
    var barX = centerX - progressWidth / 2;
    var progressY = centerY + 36;
    var radius = progressHeight / 2;
    ctx.save();
    ctx.fillStyle = options.background || Loading.DEFAULT_CONFIG.background;
    ctx.fillRect(0, 0, width, height);
    if (options.backgroundImage && options.backgroundImage.complete !== false) {
      ctx.save();
      ctx.globalAlpha = options.backgroundImageOpacity == null ? 1 : options.backgroundImageOpacity;
      ctx.drawImage(options.backgroundImage, 0, 0, width, height);
      ctx.restore();
    }
    var titleY = centerY - 30;
    if (options.logo && options.logo.complete !== false) {
      var logoWidth = Math.min(options.logoWidth, Math.max(0, width - options.padding * 2));
      var logoHeight = Math.min(options.logoHeight, Math.max(0, height - options.padding * 2));
      ctx.drawImage(options.logo, centerX - logoWidth / 2, centerY - 112, logoWidth, logoHeight);
      titleY = centerY + 10;
    }
    if (options.title) {
      ctx.fillStyle = options.textColor;
      ctx.font = options.titleFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(options.title, centerX, titleY);
    }
    ctx.fillStyle = options.progressTrackColor;
    ctx.beginPath();
    ctx.roundRect(barX, progressY, progressWidth, progressHeight, radius);
    ctx.fill();
    if (Number.isFinite(options.progress)) {
      var progress = Math.min(1, Math.max(0, options.progress));
      var fillWidth = progressWidth * progress;
      if (fillWidth > 0) {
        ctx.fillStyle = options.progressColor;
        ctx.beginPath();
        ctx.roundRect(barX, progressY, fillWidth, progressHeight, Math.min(radius, fillWidth / 2));
        ctx.fill();
      }
      ctx.fillStyle = options.mutedTextColor;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(progress * 100)}%`, barX + progressWidth + percentageGap, progressY + progressHeight / 2);
    } else {
      var segmentWidth = Math.max(24, progressWidth * 0.28);
      var travel = progressWidth + segmentWidth;
      var offset = (Date.now() / 8) % travel;
      var segmentX = barX + offset - segmentWidth;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(barX, progressY, progressWidth, progressHeight, radius);
      ctx.clip();
      ctx.fillStyle = options.progressColor;
      ctx.beginPath();
      ctx.roundRect(segmentX, progressY, segmentWidth, progressHeight, radius);
      ctx.fill();
      ctx.restore();
    }
    if (options.status) {
      ctx.fillStyle = options.mutedTextColor;
      ctx.font = options.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(options.status, centerX, progressY + progressHeight + 14);
    }
    ctx.restore();
  }
}
export {
  Loading
}

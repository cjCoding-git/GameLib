class Size {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  mod(dw, dh) {
    this.width += dw;
    this.height += dh;
  }
  modTo(w, h) {
    this.width = w;
    this.height = h;
  }
}
export {
  Size
}

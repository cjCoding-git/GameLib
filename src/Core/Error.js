class GameLibError extends Error {
  constructor(message, options) {
    super(message);
    this.name = this.constructor.name;
  }
}
export {
  GameLibError
}

class GameLibError extends Error {
  constructor(message, options) {
    super(message);
    this.name = "GameLibError";
  }
}
export {
  GameLibError
}

import { Coord } from "./Coord.js"
import { Size } from "./Size.js"
import { Box } from "./Box.js"
import { Rotation } from "./Rotation.js"
import { Renderable } from "./Renderable.js"
import { Sprite } from "./Sprite.js"
import { GameLib } from "./GameLib.js"
class GameLib2D {
  constructor() {
    throw new GameLibCore.Error("Wrapper class GameLib2D may not be constructed!");
  }
  static Coord = Coord;
  static Size = Size;
  static Box = Box;
  static Rotation = Rotation;
  static Renderable = Renderable;
  static Sprite = Sprite;
  static GameLib = GameLib;
}
export {
  GameLib2D
}

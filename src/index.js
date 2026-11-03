/*!
  GameLib
  Copyright (c) 2025, Charles Jager
  glMatrix 3.4.4 Copyright (c) 2015-2025, Brandon Jones, Colin MacKenzie IV.
*/
import { GameLibCore } from "./Core/index.js"
import { GameLib2D } from "./2D/index.js"
import { GameLib3D } from "./3D/index.js"
var libraryExports = {
  GameLibCore,
  GameLib2D,
  GameLib3D
};
for(var i=0;i<Object.keys(libraryExports).length;i++) {
  var key = Object.keys(libraryExports)[i];
  self[key] = libraryExports[key];
}

/*!
  GameLib
  Copyright (c) 2025 Charles Jager
  Libraries Used in GameLib:
    glMatrix Copyright (c) 2015-2025, Brandon Jones, Colin MacKenzie IV
    Ammo.js Copyright (c) 2011 ammo.js contributors
    PeerJS Copyright (c) 2015 Michelle Bu and Eric Zhang
    Matter.js Liam Brummitt Copyright (c) and contributors
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

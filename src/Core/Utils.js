import { GameLibCore } from "src/Core/index.js"
class Utils {
  constructor() {
    throw new GameLibCore.Error("Class Utils may not be constructed!");
  }
  static imagePromise(url) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = (function () {
        resolve(image);
      });
      image.src = url;
    });
  }
  static getRandomListItem(list) {
    var index = Math.floor(Math.random() * list.length);
    return list[index];
  }
}
export {
  Utils
}

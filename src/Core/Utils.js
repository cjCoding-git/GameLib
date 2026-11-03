import { GameLibError } from "src/Core/Error.js"
class Utils {
  constructor() {
    throw new GameLibError("Class Utils may not be constructed!");
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

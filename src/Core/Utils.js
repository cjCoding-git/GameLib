import { GameLibCore } from "./index.js"
class Utils {
  constructor() {
    throw new GameLibCore.Error("Class Utils may not be constructed!");
  }
  static getRandomListItem(list) {
    var index = Math.floor(Math.random() * list.length);
    return list[index];
  }
  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  static getRandomDigits(numberOfDigits) {
    var digits = "0123456789";
    var resultString = "";
    for (var i = 0; i < numberOfDigits; i++) {
      var randomNumber = Utils.getRandomInt(0, digits.length);
      var newDigit = digits.substring(randomNumber, randomNumber + 1);
      resultString += newDigit;
    }
    return resultString;
  }
	static UUID() {
		return crypto.randomUUID();
	}
}
export {
  Utils
}

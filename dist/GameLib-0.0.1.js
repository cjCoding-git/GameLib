(() => {
  // src/Test.js
  function createPopup(text) {
    alert(text);
    console.log("Custom Popup:", text);
  }

  // src/index.js
  createPopup("Blah!");
})();

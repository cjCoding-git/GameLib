# Getting Started
This guide is to help you get started with the GameLib 3D engine.

## 1. Create a Canvas
To begin, you need to create a canvas. It is easiest to add it directly to the HTML code of your page:
```html
<canvas width="500" height="500" id="yourCanvas"></canvas>
```
You can replace width and height with your desired dimensions.

## 2. Get the Context
Next, you need to get the rendering context of your canvas, to use it in your JavaScript code. To do this, first you need to obtain a reference to the element.
```javascript
var canvas = document.querySelector("#yourCanvas");
```
Then, you need to get the WebGL rendering context from the canvas. To do this, GameLib provides a function to get the context from your canvas:
```javascript
var ctx = GameLib3D.GameLib.getContext(canvas, webgl2);
```
Where **canvas** is your canvas reference and **webGL2** controls whether or not the context will be configured to use WebGL1 or WebGL2.

## 3. Create the Engine Instance
After getting the context, you need to create an instance of the 3D Engine. To do this, use:
```javascript
var gl = new GameLib3D.GameLib(canvas, ctx, options
```
Where **canvas** is your canvas, **ctx** is the rendering context for the canvas, and **options** is an object. Available options are:
- **webGL2:** Whether or not to configure the game engine to use WebGL 2.

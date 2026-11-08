# GameLib Documentation
GameLib has multiple components, each with a different API.

## Loading GameLib
GameLib can be hosted from your own server, inlined in the page, or loaded from a CDN. There are two different versions provided:
- **Unminified:** Good for writing a game, still has all variable and parameter names intact.
- **Minified:** Use this for release builds. The exposed API remains the same but it has a smaller file size, and internal variables have been renamed.
To get the code yourself, download the latest release at https://github.com/cjCoding-git/GameLib/releases. To load from a CDN, add this snippet to the top of your page:
```html
<script src="https://cdn.jsdelivr.net/npm/@cjcoding-git/gamelib@latest"></script>
```

## Core Engine
The core engine includes common code like input and audio.

[Getting Started](Core/GETTING_STARTED.md)

[API Refrence](Core/API.md)

## 2D Engine
The 2D engine is the part of the game engine for creating graphics with the 2D canvas API.

[Getting Started](2D/GETTING_STARTED.md)

[API Refrence](2D/API.md)

## 3D Engine
The 3D engine makes WebGL development significantly easier.

[Getting Started](3D/GETTING_STARTED.md)

[API Refrence](3D/API.md)

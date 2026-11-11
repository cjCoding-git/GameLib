attribute vec3 aPosition;
attribute vec4 aColor;
attribute float aSize;
attribute vec4 aOutlineColor;
attribute float aOutlineWidth;
uniform mat4 uViewProjection;
uniform float uShape;
uniform vec4 uOutlineColor;
uniform float uOutlineWidth;
varying vec4 vColor;
varying vec2 vPoint;
void main() {
  gl_Position = uViewProjection * vec4(aPosition, 1.0);
  gl_PointSize = max(1.0, aSize);
  vColor = aColor;
  vPoint = gl_PointCoord * 2.0 - vec2(1.0);
}

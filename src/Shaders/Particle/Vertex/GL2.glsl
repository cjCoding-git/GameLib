#version 300 es
precision mediump float;
in vec3 aPosition;
in vec4 aColor;
in float aSize;
in vec4 aOutlineColor;
in float aOutlineWidth;
uniform mat4 uViewProjection;
uniform float uShape;
uniform vec4 uOutlineColor;
uniform float uOutlineWidth;
out vec4 vColor;
out vec2 vPoint;
void main() {
  gl_Position = uViewProjection * vec4(aPosition, 1.0);
  gl_PointSize = max(1.0, aSize);
  vColor = aColor;
  vPoint = gl_PointCoord * 2.0 - vec2(1.0);
}

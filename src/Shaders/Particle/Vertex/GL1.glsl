attribute vec3 aPosition;
attribute vec4 aColor;
uniform mat4 uViewProjection;
uniform float uPointSize;
varying vec4 vColor;
void main() {
  gl_Position = uViewProjection * vec4(aPosition, 1.0);
  gl_PointSize = uPointSize;
  vColor = aColor;
}

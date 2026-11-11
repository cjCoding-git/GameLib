#version 300 es
in vec3 aPosition;
in vec4 aColor;
uniform mat4 uViewProjection;
uniform float uPointSize;
out vec4 vColor;
void main() {
  gl_Position = uViewProjection * vec4(aPosition, 1.0);
  gl_PointSize = uPointSize;
  vColor = aColor;
}

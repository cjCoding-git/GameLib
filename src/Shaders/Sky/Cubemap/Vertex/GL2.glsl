#version 300 es
in vec3 aPosition;
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
out vec3 vTexCoords;
void main() {
  vTexCoords = aPosition;
  vec4 pos = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
  gl_Position = pos.xyww;
}

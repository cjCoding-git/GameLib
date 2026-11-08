#version 300 es
in vec2 aPosition;
in vec2 aUV;
uniform vec2 uResolution;
out vec2 vUV;
void main() {
  vec2 clipPosition = (aPosition / uResolution) * 2.0 - 1.0;
  clipPosition.y *= -1.0;
  gl_Position = vec4(clipPosition, 0.0, 1.0);
  vUV = aUV;
}

attribute vec2 aPosition;
attribute vec4 aColor;
uniform vec2 uResolution;
varying vec4 vColor;
void main() {
  vec2 clipPosition = (aPosition / uResolution) * 2.0 - 1.0;
  clipPosition.y *= -1.0;
  gl_Position = vec4(clipPosition, 0.0, 1.0);
  vColor = aColor;
}

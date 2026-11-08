attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;
attribute vec2 aTextureCoord;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uNormalMatrix;
varying vec4 vColor;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
  vec4 viewPosition = uModelViewMatrix * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
  vUV = aTextureCoord;
  vNormal = normalize((uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz);
  vViewPosition = viewPosition.xyz;
  gl_Position = uProjectionMatrix * viewPosition;
}

#version 300 es
in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec4 aVertexColor;
in vec2 aTextureCoord;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uNormalMatrix;
out vec4 vColor;
out vec2 vUV;
out vec3 vNormal;
out vec3 vViewPosition;
void main() {
  vec4 viewPosition = uModelViewMatrix * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
  vUV = aTextureCoord;
  vNormal = normalize((uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz);
  vViewPosition = viewPosition.xyz;
  gl_Position = uProjectionMatrix * viewPosition;
}

#version 300 es
precision mediump float;
in vec3 vTexCoords;
uniform samplerCube uSkybox;
out vec4 outColor;
void main() {
  outColor = texture(uSkybox, vTexCoords);
}

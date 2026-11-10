precision mediump float;
varying vec3 vTexCoords;
uniform samplerCube uSkybox;
void main() {
  gl_FragColor = textureCube(uSkybox, vTexCoords);
}

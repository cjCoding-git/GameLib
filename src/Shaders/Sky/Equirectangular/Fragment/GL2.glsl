#version 300 es
precision mediump float;
in vec3 vTexCoords;
uniform sampler2D uEquirectangularMap;
const vec2 invAtan = vec2(0.15915494, 0.31830988);
out vec4 outColor;
vec2 sampleSphericalMap(vec3 dir) {
  vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
  uv *= invAtan;
  uv += 0.5;
  return uv;
}
void main() {
  vec3 dir = normalize(vTexCoords);
  vec2 uv = sampleSphericalMap(dir);
  outColor = texture(uEquirectangularMap, uv);
}

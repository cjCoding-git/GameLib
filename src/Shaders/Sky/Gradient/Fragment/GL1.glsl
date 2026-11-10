precision mediump float;
varying vec3 vTexCoords;
uniform vec3 uZenithColor;
uniform vec3 uHorizonColor;
uniform vec3 uGroundColor;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uSunExponent;
void main() {
  vec3 dir = normalize(vTexCoords);
  float y = dir.y;
  vec3 skyColor;
  if (y > 0.0) {
    skyColor = mix(uHorizonColor, uZenithColor, pow(y, 0.6));
  } else {
    skyColor = mix(uHorizonColor, uGroundColor, pow(-y, 0.6));
  }
  float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
  float sunGlow = pow(sunDot, uSunExponent);
  skyColor += uSunColor * sunGlow;
  gl_FragColor = vec4(skyColor, 1.0);
}

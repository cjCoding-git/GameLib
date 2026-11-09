precision mediump float;
#define MAX_LIGHTS 8
varying vec4 vColor;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform sampler2D uTexture;
uniform bool uUseTexture;
uniform int uLightCount;
uniform int uLightType[MAX_LIGHTS];
uniform vec3 uLightColor[MAX_LIGHTS];
uniform vec3 uLightVector[MAX_LIGHTS];
uniform vec3 uClearColor;
uniform float uLightIntensity[MAX_LIGHTS];
uniform float uLightRange[MAX_LIGHTS];
vec3 calculateLighting() {
  vec3 normal = normalize(vNormal);
  vec3 illumination = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) {
      break;
    }
    if (uLightType[i] == 0) {
      illumination += uLightColor[i] * uLightIntensity[i];
    } else {
      vec3 toLight;
      float attenuation = 1.0;
      if (uLightType[i] == 1) {
        toLight = normalize(uLightVector[i]);
      } else {
        vec3 delta = uLightVector[i] - vViewPosition;
        float distanceToLight = length(delta);
        toLight = normalize(delta);
        float ratio = distanceToLight / max(uLightRange[i], 0.0001);
        attenuation = 1.0 / (1.0 + ratio * ratio);
      }
      float diffuse = max(dot(normal, toLight), 0.0);
      illumination += uLightColor[i] * uLightIntensity[i] * diffuse * attenuation;
    }
  }
  return illumination;
}
void main() {
  vec4 color = vColor;
  if (uUseTexture) {
    color *= texture2D(uTexture, vUV);
  }
  vec3 lightVec = calculateLighting();
  vec3 litColor = color.rgb * lightVec;
  float rawLight = (lightVec.r + lightVec.g + lightVec.b) / 3.0;
  float blendFactor = clamp(sqrt(rawLight), 0.0, 1.0);
  vec3 litRGB = mix(uClearColor, litColor, blendFactor);
  gl_FragColor = vec4(litColor, color.a);
}

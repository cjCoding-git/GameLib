#version 300 es
precision mediump float;
#define MAX_LIGHTS 8
in vec4 vColor;
in vec2 vUV;
in vec3 vNormal;
in vec3 vViewPosition;
uniform sampler2D uTexture;
uniform bool uUseTexture;
uniform int uLightCount;
uniform int uLightType[MAX_LIGHTS];
uniform vec3 uLightColor[MAX_LIGHTS];
uniform vec3 uLightVector[MAX_LIGHTS];
uniform vec3 uClearColor;
uniform float uLightIntensity[MAX_LIGHTS];
uniform float uLightRange[MAX_LIGHTS];
out vec4 outColor;
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
    color *= texture(uTexture, vUV);
  }
  vec3 lightVec = calculateLighting();
  vec3 litColor = color.rgb * lightVec;
  float rawLight = (lightVec.r + lightVec.g + lightVec.b) / 3.0;
  float blendFactor = clamp(sqrt(rawLight), 0.0, 1.0);
  vec3 litRGB = mix(uClearColor, litColor, blendFactor);
  outColor = vec4(litRGB, color.a);
}

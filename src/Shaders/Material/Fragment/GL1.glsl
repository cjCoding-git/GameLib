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
void calculateLighting(out vec3 ambient, out vec3 diffuse) {
  vec3 normal = normalize(vNormal);
  ambient = vec3(0.0);
  diffuse = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) {
      break;
    }
    if (uLightType[i] == 0) {
      ambient += uLightColor[i] * uLightIntensity[i];
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
      float diff = max(dot(normal, toLight), 0.0);
      diffuse += uLightColor[i] * uLightIntensity[i] * diff * attenuation;
    }
  }
}
void main() {
  vec4 color = vColor;
  if (uUseTexture) {
    color *= texture2D(uTexture, vUV);
  }
  vec3 ambientLight, diffuseLight;
  calculateLighting(ambientLight, diffuseLight);
  float ambIntensity = max(ambientLight.r, max(ambientLight.g, ambientLight.b));
  float ambFactor = clamp(sqrt(ambIntensity), 0.0, 1.0);
  vec3 ambientBase = mix(uClearColor, color.rgb * ambientLight, ambFactor);
  vec3 litRGB = ambientBase + (color.rgb * diffuseLight);
  gl_FragColor = vec4(litRGB, color.a);
}

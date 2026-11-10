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
uniform float uRoughness;
uniform float uMetallic;
uniform vec4 uEmissive;
uniform vec4 uSpecular;
uniform float uShininess;
out vec4 outColor;
void calculateLighting(out vec3 ambient, out vec3 diffuse, out vec3 specular, vec3 baseColor) {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(-vViewPosition);
  ambient = vec3(0.0);
  diffuse = vec3(0.0);
  specular = vec3(0.0);
  float specPower = mix(uShininess, 2.0, uRoughness);
  vec3 specColor = mix(uSpecular.rgb, baseColor, uMetallic);
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
      vec3 halfVector = normalize(toLight + viewDir);
      float specAngle = max(dot(normal, halfVector), 0.0);
      float spec = specAngle > 0.0 ? pow(specAngle, specPower) * (1.0 - uRoughness) : 0.0;
      specular += uLightColor[i] * specColor * spec * uLightIntensity[i] * attenuation;
    }
  }
}
void main() {
  vec4 color = vColor;
  if (uUseTexture) {
    color *= texture(uTexture, vUV);
  }
  vec3 ambientLight, diffuseLight, specularLight;
  calculateLighting(ambientLight, diffuseLight, specularLight, color.rgb);
  float ambIntensity = max(ambientLight.r, max(ambientLight.g, ambientLight.b));
  float ambFactor = clamp(sqrt(ambIntensity), 0.0, 1.0);
  vec3 ambientBase = mix(uClearColor, color.rgb * ambientLight, ambFactor);
  vec3 diffuseComponent = color.rgb * diffuseLight * (1.0 - uMetallic);
  vec3 litRGB = ambientBase + diffuseComponent + specularLight + uEmissive.rgb;
  outColor = vec4(litRGB, color.a);
}

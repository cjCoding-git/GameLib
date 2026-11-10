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
uniform float uRoughness;
uniform float uMetallic;
uniform vec4 uEmissive;
uniform vec4 uSpecular;
uniform float uShininess;
uniform samplerCube uEnvironmentMap;
uniform int uSkyMode;
uniform mat4 uInverseViewMatrix;
uniform vec3 uZenithColor;
uniform vec3 uHorizonColor;
uniform vec3 uGroundColor;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uSunExponent;
vec3 sampleEnvironment(vec3 reflectDirWorld) {
  if (uSkyMode == 1) {
    return textureCube(uEnvironmentMap, reflectDirWorld).rgb;
  } else if (uSkyMode == 2) {
    vec3 dir = normalize(reflectDirWorld);
    float y = dir.y;
    vec3 skyColor;
    if (y > 0.0) {
      skyColor = mix(uHorizonColor, uZenithColor, pow(y, 0.6));
    } else {
      skyColor = mix(uHorizonColor, uGroundColor, pow(-y, 0.6));
    }
    float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
    float sunGlow = pow(sunDot, uSunExponent);
    return skyColor + uSunColor * sunGlow;
  }
  return vec3(0.0);
}
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
    color *= texture2D(uTexture, vUV);
  }
  vec3 envReflection = vec3(0.0);
  if (uSkyMode > 0) {
    vec3 viewDir = normalize(-vViewPosition);
    vec3 reflectDirView = reflect(-viewDir, normalize(vNormal));
    vec3 reflectDirWorld = (uInverseViewMatrix * vec4(reflectDirView, 0.0)).xyz;
    envReflection = sampleEnvironment(reflectDirWorld);
  }
  vec3 ambientLight, diffuseLight, specularLight;
  calculateLighting(ambientLight, diffuseLight, specularLight, color.rgb);
  float ambIntensity = max(ambientLight.r, max(ambientLight.g, ambientLight.b));
  float ambFactor = clamp(sqrt(ambIntensity), 0.0, 1.0);
  vec3 ambientBase = mix(uClearColor, color.rgb * ambientLight, ambFactor);
  vec3 metalSpecColor = mix(uSpecular.rgb, color.rgb, uMetallic);
  vec3 reflectionComponent = envReflection * metalSpecColor * (1.0 - uRoughness * 0.8);
  vec3 diffuseComponent = color.rgb * diffuseLight * (1.0 - uMetallic);
  vec3 litRGB = ambientBase + diffuseComponent + specularLight + mix(vec3(0.0), reflectionComponent, uMetallic) + uEmissive.rgb;
  gl_FragColor = vec4(litRGB, color.a);
}

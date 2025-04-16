export const fragmentShader = `
precision mediump float;

// PlayCanvas specific uniforms
uniform sampler2D uMainTex;
uniform vec2 uTime;
uniform vec3 view_position;
uniform float exposure;
uniform vec4 uScreenSize;
uniform vec3 light0_color;
uniform vec3 light0_direction;
uniform vec3 light_globalAmbient;
uniform vec3 fog_color;
uniform float fog_density;
uniform vec4 uColor;

// Shader specific parameters
#define DISPAMOUNT 0.0025

// Varying inputs from vertex shader
varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vLightDir0;
varying vec3 vLightDir1;
varying vec2 vUv0;
varying float vFogCoord;

// This fog function emulates the exponential fog
vec3 ApplyFog(vec3 color) {
  float density = fog_density / 0.693147 * 10.0;
  float fogFactor = vFogCoord * density;
  fogFactor = exp2(-fogFactor);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
  return mix(fog_color, color.xyz, fogFactor);
}

// Utility functions for lighting
float Pow5(float x) {
  return x * x * x * x * x;
}

float DisneyDiffuseTerm(float NdotV, float NdotL, float LdotH, float perceptualRoughness) {
  float fd90 = 0.5 + 2.0 * LdotH * LdotH * perceptualRoughness;
  float lightScatter = 1.0 + (fd90 - 1.0) * Pow5(1.0 - NdotL);
  float viewScatter = 1.0 + (fd90 - 1.0) * Pow5(1.0 - NdotV);
  return lightScatter * viewScatter;
}

float SmithJointVisibilityTerm(float NdotL, float NdotV, float roughness) {
  float lambdaV = NdotL * mix(NdotV, 1.0, roughness);
  float lambdaL = NdotV * mix(NdotL, 1.0, roughness);
  return 0.5 / (lambdaV + lambdaL + 1e-5);
}

float GgxDistributionTerm(float NdotH, float roughness) {
  float a2 = roughness * roughness;
  float d = (NdotH * a2 - NdotH) * NdotH + 1.0;
  return 0.31830988618 * a2 / (d * d + 1e-7);
}

vec3 FresnelTerm(vec3 F0, float cosA) {
  float t = Pow5(1.0 - cosA);
  return F0 + (vec3(1.0) - F0) * t;
}

// Thin film interference calculation for diamond hull effect
float thinFilmReflectance(float cos0, float lambda, float thickness, float n0, float n1, float n2) {
  float PI = 3.1415926536;

  // Phase change terms.
  float d10 = mix(PI, 0.0, float(n1 > n0));
  float d12 = mix(PI, 0.0, float(n1 > n2));
  float delta = d10 + d12;

  // Cosine of the reflected angle.
  float sin1 = pow(n0 / n1, 2.0) * (1.0 - pow(cos0, 2.0));

  // Total internal reflection.
  if (sin1 > 1.0) return 1.0;
  float cos1 = sqrt(1.0 - sin1);

  // Cosine of the final transmitted angle, i.e. cos(theta_2)
  float sin2 = pow(n0 / n2, 2.0) * (1.0 - pow(cos0, 2.0));

  // Total internal reflection.
  if (sin2 > 1.0) return 1.0;

  float cos2 = sqrt(1.0 - sin2);

  // Reflection transmission amplitude Fresnel coefficients.
  float rs_val = ((n1 * cos1 - n0 * cos0) / (n1 * cos1 + n0 * cos0)) * 
                 ((n1 * cos1 - n2 * cos2) / (n1 * cos1 + n2 * cos2));
                 
  float rp_val = ((n0 * cos1 - n1 * cos0) / (n1 * cos0 + n0 * cos1)) * 
                 ((n2 * cos1 - n1 * cos2) / (n1 * cos2 + n2 * cos1));
                 
  float ts_val = ((2.0 * n0 * cos0) / (n1 * cos1 + n0 * cos0)) * 
                 ((2.0 * n1 * cos1) / (n1 * cos1 + n2 * cos2));
                 
  float tp_val = ((2.0 * n0 * cos0) / (n1 * cos0 + n0 * cos1)) * 
                 ((2.0 * n1 * cos1) / (n1 * cos2 + n2 * cos1));

  // Compute the phase term (phi).
  float phi = (2.0 * PI / lambda) * (2.0 * n1 * thickness * cos1) + delta;

  // Evaluate the transmitted intensity for the two possible polarizations.
  float ts = pow(ts_val, 2.0) / (pow(rs_val, 2.0) - 2.0 * rs_val * cos(phi) + 1.0);
  float tp = pow(tp_val, 2.0) / (pow(rp_val, 2.0) - 2.0 * rp_val * cos(phi) + 1.0);

  // Take into account conservation of energy for transmission.
  float beamRatio = (n2 * cos2) / (n0 * cos0);

  // Calculate the average transmitted intensity
  float t = beamRatio * (ts + tp) / 2.0;

  // Derive the reflected intensity.
  return 1.0 - t;
}

vec3 GetDiffraction(vec3 thickTex, vec3 I, vec3 N) {
  const float thicknessMin = 250.0;
  const float thicknessMax = 400.0;
  const float nmedium = 1.0;
  const float nfilm = 1.3;
  const float ninternal = 1.0;
  
  float cos0 = abs(dot(I, N));

  float t = (thickTex.r + thickTex.g + thickTex.b) / 3.0;
  float thick = thicknessMin*(1.0 - t) + thicknessMax*t;

  float red = thinFilmReflectance(cos0, 650.0, thick, nmedium, nfilm, ninternal);
  float green = thinFilmReflectance(cos0, 510.0, thick, nmedium, nfilm, ninternal);
  float blue = thinFilmReflectance(cos0, 475.0, thick, nmedium, nfilm, ninternal);

  return vec3(red, green, blue);
}

// Surface shader implementation for specular-gloss workflow
vec3 SurfaceShaderSpecularGloss(
    vec3 normal,
    vec3 lightDir,
    vec3 eyeDir,
    vec3 lightColor,
    vec3 albedoColor,
    vec3 specularColor,
    float gloss) {
    
  // Constants for specular calculation
  const vec3 GAMMA_DIELECTRIC_SPEC = vec3(0.220916301);
  const float GAMMA_ONE_MINUS_DIELECTRIC = 0.779083699;
  const float PI = 3.141592654;
  
  float oneMinusSpecularIntensity = 1.0 - clamp(max(max(specularColor.r, specularColor.g), specularColor.b), 0.0, 1.0);
  vec3 diffuseColor = albedoColor * oneMinusSpecularIntensity;
  float perceptualRoughness = 1.0 - gloss;
  float roughness = perceptualRoughness * perceptualRoughness;

  float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
  float NdotV = abs(dot(normal, eyeDir));

  vec3 halfVector = normalize(lightDir + eyeDir);
  float NdotH = clamp(dot(normal, halfVector), 0.0, 1.0);
  float LdotH = clamp(dot(lightDir, halfVector), 0.0, 1.0);

  float diffuseTerm = NdotL * DisneyDiffuseTerm(NdotV, NdotL, LdotH, perceptualRoughness);

  if (length(specularColor) < 1e-5) {
    return diffuseColor * (lightColor * diffuseTerm);
  }

  float V = GgxDistributionTerm(NdotH, roughness);
  float D = SmithJointVisibilityTerm(NdotL, NdotV, roughness);
  float specularTerm = V * D * PI;

  specularTerm = sqrt(max(1e-4, specularTerm));
  specularTerm *= NdotL;

  vec3 fresnelColor = FresnelTerm(specularColor, LdotH);

  return lightColor * (diffuseTerm * diffuseColor + specularTerm * fresnelColor);
}

// Simplified shader for second light and ambient
vec3 ShShaderWithSpec(
    vec3 normal,
    vec3 lightDir,
    vec3 lightColor,
    vec3 diffuseColor,
    vec3 specularColor) {
        
  float specularGrayscale = dot(specularColor, vec3(0.3, 0.59, 0.11));
  float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
  float shIntensityMultiplier = 1.0 - specularGrayscale;
  shIntensityMultiplier *= shIntensityMultiplier;
  return diffuseColor * lightColor * NdotL * shIntensityMultiplier;
}

vec3 computeLighting(vec3 normal, vec3 albedo, vec3 specColor, float shininess) {
  if (!gl_FrontFacing) {
    normal *= -1.0;
  }
  
  vec3 lightDir0 = normalize(vLightDir0);
  vec3 lightDir1 = normalize(vLightDir1);
  vec3 eyeDir = -normalize(vPosition);

  vec3 lightOut0 = SurfaceShaderSpecularGloss(
    normal, 
    lightDir0, 
    eyeDir, 
    light0_color,
    albedo, 
    specColor, 
    shininess
  );
  
  vec3 lightOut1 = ShShaderWithSpec(
    normal, 
    lightDir1, 
    vec3(0.5, 0.5, 0.5), // Secondary light color approximation
    albedo, 
    specColor
  );
  
  vec3 ambientOut = albedo * light_globalAmbient;

  return (lightOut0 + lightOut1 + ambientOut);
}

void main() {

  float shininess = .8;
  vec3 albedo = uColor.rgb * .2;

  // mainTex
  vec3 mainTex = texture(uMainTex, vUv0).rgb;

  vec3 viewDir = normalize(view_position - vWorldPosition);
  vec3 normal = vNormal;

  float rim = 1.0 - abs(dot(normalize(viewDir), vWorldNormal));
  rim *= 1.0 - pow(rim, 5.0);

  rim = mix(rim, 150.0, 1.0 - clamp(abs(dot(normalize(viewDir), vWorldNormal)) / .1, 0.0, 1.0));

  vec3 diffraction = texture(uMainTex, vec2(rim + uTime.x * .3 + normal.x, rim + normal.y)).xyz;

  diffraction = GetDiffraction(diffraction, normal, normalize(viewDir));

  vec3 emission = rim * uColor.rgb * diffraction * .5 + rim * diffraction * .25;
  vec3 specColor = uColor.rgb * clamp(diffraction, 0.0, 1.0);

  gl_FragColor = vec4(computeLighting(vNormal, albedo, specColor, shininess) + emission, 1.0);

}
`;

// Copyright 2020 The Tilt Brush Authors
// Updated to OpenGL ES 3.0 by the Icosa Gallery Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
attribute vec2 aUv0;

// PlayCanvas specific uniforms
uniform mat4 matrix_model;
uniform mat4 matrix_viewProjection;
uniform mat4 matrix_view;
uniform mat3 matrix_normal;

// Pass-through to fragment shader
varying vec4 vColor;
varying vec3 vWorldNormal;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv0;
varying vec3 vLightDir0;
varying vec3 vLightDir1;
varying float vFogCoord;

// Light direction matrices (adapted from original shader)
uniform mat4 light0_shadowMatrix; // Using as a stand-in for the scene light matrix
uniform vec3 light0_direction;
uniform vec3 light0_color;
uniform vec3 light_globalAmbient;

void main() {
  // Transform position
  vec4 worldPos = matrix_model * vec4(aPosition, 1.0);
  vec4 viewPos = matrix_view * worldPos;
  gl_Position = matrix_viewProjection * worldPos;
  vFogCoord = gl_Position.z;

  // Pass through normal data
  vNormal = matrix_normal * aNormal;
  vWorldNormal = mat3(matrix_model) * aNormal;
  
  // Pass vertex position data
  vPosition = viewPos.xyz;
  vWorldPosition = worldPos.xyz;
  
  // Compute light directions (simulated from the provided light uniforms)
  vLightDir0 = -light0_direction;
  // For the second light, we'll use an opposite direction as a simple approximation
  vLightDir1 = normalize(vec3(1.0, 1.0, -1.0)); 
  
  // Pass color and UV data
  vColor = aColor;
  vUv0 = aUv0;
}
`;

// Bond picking shaders - render bonds with a fixed ID (0xFFFFFE) so they're visible but not clickable

export const bondPickingVertexShader = /* glsl */ `
uniform mat4 inverseModelMatrix;
attribute vec3 position1;
attribute vec3 position2;
attribute float bondRadius;

vec3 mul3(mat4 M, vec3 v) {
  vec4 u = M * vec4(v, 1.0);
  return u.xyz / u.w;
}

void main() {
  vec3 center = (inverseModelMatrix * vec4(0.5 * (position1 + position2), 1.0)).xyz;
  float height = length(position2 - position1);
  vec3 newPosition = position;
  
  vec3 objectToCameraModelSpace = (inverseModelMatrix * vec4(cameraPosition - center, 1.0)).xyz;
  
  vec3 lDir = normalize(position1 - position2);
  if (dot(objectToCameraModelSpace, lDir) < 0.0) {
    lDir *= -1.0;
  }

  vec3 left = normalize(cross(objectToCameraModelSpace, lDir));
  vec3 up = normalize(cross(left, lDir));

  vec3 surfacePoint = center + mat3(0.5 * height * lDir, bondRadius * left, bondRadius * up) * newPosition;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(surfacePoint, 1.0);
}
`

export const bondPickingFragmentShader = /* glsl */ `
void main() {
  // Output RGB (255, 255, 254) which encodes to 0xFFFFFE (16777214)
  // This is slightly less than white (0xFFFFFF = background)
  // When this color is clicked, PickingHandler will return undefined (not clickable)
  gl_FragColor = vec4(1.0, 1.0, 254.0/255.0, 1.0);
}
`

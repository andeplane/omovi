export default /* glsl */ `
precision highp float;

uniform mat4 projectionMatrix;

varying vec3 vSurfacePoint;
varying vec3 vCenter;
varying float vRadius;
varying float vParticleIndex;

void main() {
  vec3 rayTarget = vSurfacePoint;
  vec3 rayDirection = normalize(rayTarget); // rayOrigin is (0,0,0) in camera space

  vec3 diff = rayTarget - vCenter.xyz;
  vec3 E = diff;
  vec3 D = rayDirection;

  float a = dot(D, D);
  float b = dot(E, D);
  float c = dot(E, E) - vRadius * vRadius;

  // discriminant of sphere equation (factor 2 removed from b above)
  float d = b * b - a * c;
  if (d < 0.0)
    discard;

  // Encode particle index as RGB color (supports up to ~16M particles)
  // index = r * 65536 + g * 256 + b
  float index = vParticleIndex;
  float r = floor(index / 65536.0);
  float g = floor(mod(index, 65536.0) / 256.0);
  float b_val = mod(index, 256.0);
  
  gl_FragColor = vec4(r / 255.0, g / 255.0, b_val / 255.0, 1.0);
}
`

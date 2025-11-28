export default /* glsl */ `
uniform float dataTextureWidth;
uniform float dataTextureHeight;
uniform sampler2D radiusTexture;
uniform mat4 inverseModelMatrix;
attribute vec3 particlePosition;
attribute float particleIndex;

varying vec3 vSurfacePoint;
varying vec3 vCenter;
varying float vRadius;
varying float vParticleIndex;

float unpack(vec4 rgba) {
  float value = (rgba.r * 255. * 255. + rgba.g * 255. + rgba.b);
  if (rgba.a < 1.0) {
    return -value;
  }
  return value;
}

vec3 makePerpendicular(vec3 v) {
    if(v.x == 0.0 && v.y == 0.0) {
        if(v.z == 0.0) {
            return vec3(0.0, 0.0, 0.0);
        }
        return vec3(0.0, 1.0, 0.0);
    }
    return vec3(-v.y, v.x, 0.0);
}

vec3 mul3(mat4 M, vec3 v) {
  vec4 u = M * vec4(v, 1.0);
  return u.xyz / u.w;
}

void main() {
  float x = mod(particleIndex, dataTextureWidth);
  float y = floor(particleIndex / dataTextureWidth);
  float xCoord = (x + 0.5) / dataTextureWidth;
  float yCoord = (y + 0.5) / dataTextureHeight;
  vec2 textureIndex = vec2(xCoord, yCoord);
  float particleRadius = unpack(texture2D(radiusTexture, textureIndex));

  vParticleIndex = particleIndex;

  vec3 transformed = position;

  #ifdef USE_INSTANCING
  vec3 objectToCameraModelSpace = (inverseModelMatrix * vec4(particlePosition - cameraPosition, 1.0)).xyz;
  vec3 view = normalize(objectToCameraModelSpace);
  vec3 right = normalize(makePerpendicular(view));
  vec3 up = cross(right, view);
  
  // Factor 2.0 is because geometry is 0.5x
  vec3 displacement = 2.0 * particleRadius * (position.x * right + position.y * up);
  // particlePosition + displacement is the current vertex, also move closer to camera so billboard covers the sphere
  transformed = particlePosition + displacement - particleRadius * view;
  
  vSurfacePoint = mul3(modelViewMatrix, transformed);
  vCenter = mul3(modelViewMatrix, particlePosition);
  vRadius = particleRadius;
  #endif

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`


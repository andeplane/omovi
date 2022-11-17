export const ssao = `

// From http://www.science-and-fiction.org/rendering/noise.html
float rand2d(vec2 co){
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

uniform mat4 projMatrix;
uniform mat4 inverseProjectionMatrix;
uniform vec3 kernel[MAX_KERNEL_SIZE];
uniform sampler2D tDepth;
uniform sampler2D tDiffuse;
uniform float sampleRadius;
uniform float bias;
uniform float time;

in vec2 vUv;

vec3 viewPosFromDepth(float depth, vec2 uv) {
  // Depth to clip space: [0, 1] -> [-1, 1]
  float z = depth * 2.0 - 1.0;

  // Fragment in clip space
  vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, z, 1.0);
  vec4 viewSpacePosition = inverseProjectionMatrix * clipSpacePosition;

  // Perspective division
  viewSpacePosition /= viewSpacePosition.w;

  return viewSpacePosition.xyz;
}

vec3 computeWorldNormalFromDepth(sampler2D depthTexture, vec2 resolution, vec2 uv, float sampleDepth){
  float dx = 1.0 / resolution.x;
  float dy = 1.0 / resolution.y;

  vec2 uv1 = uv + vec2(dx, 0.0); // right
  float d1 = texture(depthTexture, uv1).r; 

  vec2 uv2 = uv + vec2(0.0, dy);  // up
  float d2 = texture(depthTexture, uv2).r;

  vec2 uv3 = uv + vec2(-dx, 0.0); // left
  float d3 = texture(depthTexture, uv3).r;

  vec2 uv4 = uv + vec2(0.0, -dy);  // down
  float d4 = texture(depthTexture, uv4).r;

  bool horizontalSampleCondition = abs(d1 - sampleDepth) < abs(d3 - sampleDepth);

  float horizontalSampleDepth = horizontalSampleCondition ? d1 : d3;
  vec2 horizontalSampleUv = horizontalSampleCondition ? uv1 : uv3;

  bool verticalSampleCondition = abs(d2 - sampleDepth) < abs(d4 - sampleDepth);

  float verticalSampleDepth = verticalSampleCondition ? d2 : d4;
  vec2 verticalSampleUv = verticalSampleCondition ? uv2 : uv4;

  vec3 viewPos = viewPosFromDepth(sampleDepth, vUv);
  
  vec3 viewPos1 = (horizontalSampleCondition == verticalSampleCondition) ? viewPosFromDepth(horizontalSampleDepth, horizontalSampleUv) : viewPosFromDepth(verticalSampleDepth, verticalSampleUv);
  vec3 viewPos2 = (horizontalSampleCondition == verticalSampleCondition) ? viewPosFromDepth(verticalSampleDepth, verticalSampleUv) : viewPosFromDepth(horizontalSampleDepth, horizontalSampleUv);

  return normalize(cross(viewPos1 - viewPos, viewPos2 - viewPos));
}

void main(){
  float d = texture(tDepth, vUv).r;
  vec3 c = texture(tDiffuse, vUv).rgb;

  ivec2 textureSize = textureSize(tDepth, 0);

  vec3 viewNormal = computeWorldNormalFromDepth(tDepth, vec2(float(textureSize.x), float(textureSize.y)), vUv, d);

  vec3 viewPosition = viewPosFromDepth(d, vUv);

  vec3 randomVec = normalize(vec3(rand2d( (vUv + cos(time))), rand2d((vUv + cos(time)) * 3.0), rand2d((vUv + cos(time)) * 5.0)));
  // vec3 randomVec = normalize(vec3(rand2d( (vUv + time)), rand2d((vUv + time) * 3.0), rand2d((vUv + time) * 5.0)));
  // vec3 randomVec = normalize(vec3(rand2d(viewPosition.xy + time), rand2d( (viewPosition.xz + time) * 3.0), rand2d((viewPosition.yz + time) * 5.0)));

  vec3 tangent = normalize(randomVec - viewNormal * dot(randomVec, viewNormal));

  vec3 bitangent = cross(viewNormal, tangent);

  mat3 TBN = mat3(tangent, bitangent, viewNormal);

  float occlusion = 0.0;

  for (int i = 0; i < MAX_KERNEL_SIZE; i++){
    
    vec3 sampleVector = TBN * kernel[i];
    sampleVector = viewPosition + sampleVector * sampleRadius;

    vec4 offset = projMatrix * vec4(sampleVector, 1.0);
    offset.xyz /= offset.w;
    offset.xyz = offset.xyz * 0.5 + 0.5;

    float realDepth = texture(tDepth, offset.xy).r;
    vec3 realPos = viewPosFromDepth(realDepth, offset.xy);

    float rangeCheck = smoothstep(0.0, 1.0, sampleRadius / length(viewPosition - realPos));

    occlusion += (realPos.z >= sampleVector.z + bias ? 1.0 : 0.0) * rangeCheck;
  }

  float occlusionFactor = 1.0 - clamp(occlusion / float(MAX_KERNEL_SIZE), 0.0, 1.0);
  gl_FragColor = vec4(c.r * occlusionFactor, c.g * occlusionFactor, c.b * occlusionFactor, 1.0);
}`

export const ssaoFinal = `
// Efficient Gaussian blur based on technique described by Daniel Rákos in
// http://rastergrid.com/blog/2010/09/efficient-gaussian-blur-with-linear-sampling/

varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform sampler2D ssaoTexture;

uniform vec2 size;

const bool blur = true;

void main() {
  vec3 blurredAO;
  if (blur) {
    vec3 result = 0.5 * (
      2.0 * texture2D(ssaoTexture, vUv).rgb * 0.2270270270 +
      texture2D(ssaoTexture, vUv + vec2(1.3746153846, 0.0) / size.x).rgb * 0.3162162162 +
      texture2D(ssaoTexture, vUv + vec2(3.2307692308, 0.0) / size.x).rgb * 0.0702702703 +
      texture2D(ssaoTexture, vUv - vec2(1.3746153846, 0.0) / size.x).rgb * 0.3162162162 +
      texture2D(ssaoTexture, vUv - vec2(3.2307692308, 0.0) / size.x).rgb * 0.0702702703 +
      texture2D(ssaoTexture, vUv + vec2(0.0, 1.3746153846) / size.y).rgb * 0.3162162162 +
      texture2D(ssaoTexture, vUv + vec2(0.0, 3.2307692308) / size.y).rgb * 0.0702702703 +
      texture2D(ssaoTexture, vUv - vec2(0.0, 1.3746153846) / size.y).rgb * 0.3162162162 +
      texture2D(ssaoTexture, vUv - vec2(0.0, 3.2307692308) / size.y).rgb * 0.0702702703
    );
    blurredAO = result;
  } else {
    blurredAO = texture2D(ssaoTexture, vUv).rgb;
  }
  vec4 color = texture2D(tDiffuse, vUv);
  gl_FragColor = vec4(vec3(color.rgb * blurredAO), color.a);
}
`
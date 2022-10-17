export const ssao = `
uniform float cameraNear;
uniform float cameraFar;
#ifdef USE_LOGDEPTHBUF
  uniform float logDepthBufFC;
#endif

uniform float radius;    // ao radius
uniform bool onlyAO;     // use only ambient occlusion pass?

uniform vec2 size;       // texture width, height
uniform float aoClamp;   // depth clamp - reduces haloing at screen edges

uniform float lumInfluence; // how much luminance affects occlusion

uniform sampler2D tDiffuse;
uniform highp sampler2D tDepth;

varying vec2 vUv;

#define DL 2.399963229728653 // PI * ( 3.0 - sqrt( 5.0 ) )
#define EULER 2.718281828459045

// user variables

const int samples = 12;   // ao sample count

const bool useNoise = true;     // use noise instead of pattern for sample dithering
const float noiseAmount = 0.0004;// dithering amount

const float diffArea = 0.4;  // self-shadowing reduction
const float gDisplace = 0.4; // gauss bell center


// RGBA depth

#include <packing>

// generating noise / pattern texture for dithering

vec2 rand( const vec2 coord ) {
  vec2 noise;
  if (useNoise) {
    float nx = dot(coord, vec2(12.9898, 78.233));
    float ny = dot(coord, vec2(12.9898, 78.233) * 2.0);
    noise = clamp(fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0);
  } else {
    float ff = fract( 1.0 - coord.s * ( size.x / 2.0 ) );
    float gg = fract( coord.t * ( size.y / 2.0 ) );
    noise = vec2( 0.25, 0.75 ) * vec2( ff ) + vec2( 0.75, 0.25 ) * gg;
  }
  return ( noise * 2.0  - 1.0 ) * noiseAmount;
}

float readDepth( vec2 coord ) {
  float fragCoordZ = texture2D( tDepth, coord ).x;
  float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
  return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

float compareDepths( const in float depth1, const in float depth2, inout int far ) {
  float garea = 8.0;                        // gauss bell width
  float diff = ( depth1 - depth2 ) * 100.0; // depth difference (0-100)

  // reduce left bell width to avoid self-shadowing
  if ( diff < gDisplace ) {
    garea = diffArea;
  } else {
    far = 1;
  }

  float dd = diff - gDisplace;
  float gauss = pow( EULER, -2.0 * ( dd * dd ) / ( garea * garea ) );
  return gauss;
}

float calcAO( float depth, float dw, float dh ) {
  vec2 vv = vec2( dw, dh );

  vec2 coord1 = vUv + radius * vv;
  vec2 coord2 = vUv - radius * vv;

  float temp1 = 0.0;
  float temp2 = 0.0;

  int far = 0;
  temp1 = compareDepths( depth, readDepth( coord1 ), far );

  // DEPTH EXTRAPOLATION

  if (far > 0) {
    temp2 = compareDepths( readDepth( coord2 ), depth, far );
    temp1 += ( 1.0 - temp1 ) * temp2;
  }
  return temp1;
}

void main() {
  vec2 noise = rand( vUv );
  float depth = readDepth( vUv );

  float tt = clamp( depth, aoClamp, 1.0 );

  float w = ( 1.0 / size.x ) / tt + ( noise.x * ( 1.0 - noise.x ) );
  float h = ( 1.0 / size.y ) / tt + ( noise.y * ( 1.0 - noise.y ) );

  float ao = 0.0;

  float dz = 1.0 / float( samples );
  float l = 0.0;
  float z = 1.0 - dz / 2.0;

  for ( int i = 0; i <= samples; i ++ ) {
    float r = sqrt( 1.0 - z );
    float pw = cos( l ) * r;
    float ph = sin( l ) * r;
    ao += calcAO( depth, pw * w, ph * h );
    z = z - dz;
    l = l + DL;
  }

  ao /= float( samples );
  ao = 1.0 - ao;

  vec3 color = texture2D( tDiffuse, vUv ).rgb;

  vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );
  float lum = dot( color.rgb, lumcoeff );
  vec3 luminance = vec3( lum );

  vec3 final = vec3( mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) ); // ambient occlusion only
  if (!onlyAO) {
    final = vec3( color * mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) ); // mix( color * ao, white, luminance )
  }

  gl_FragColor = vec4( final, 1.0 );
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
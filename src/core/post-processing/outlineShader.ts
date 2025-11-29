// Post-processing shader for drawing outlines around selected particles
// Based on Reveal's outline detection approach

export const outlineVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const outlineFragmentShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float outlineOffset;
uniform float outlineAlphaDivisor;

varying vec2 vUv;

// Decode outline index from alpha channel
// Alpha encoding: alpha = (255 - index * outlineAlphaDivisor) / 255
// So: alpha = 1.0 means index = 0, alpha ≈ 0.94 means index = 1
// Note: outlineAlphaDivisor uniform comes from OUTLINE_ALPHA_DIVISOR in src/core/constants.ts
int decodeOutlineIndex(float alpha) {
  float rawValue = 255.0 - alpha * 255.0;
  return int(rawValue / outlineAlphaDivisor + 0.5);
}

// Sample outline index at pixel offset
int sampleOutlineIndex(vec2 uv, vec2 offset) {
  vec2 sampleUv = uv + offset / resolution;
  if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
    return 0; // Out of bounds = no outline
  }
  float alpha = texture2D(tDiffuse, sampleUv).a;
  return decodeOutlineIndex(alpha);
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  int outlineIndex = decodeOutlineIndex(color.a);
  
  // If this pixel has an outline index, check neighbors for edges
  if (outlineIndex > 0) {
    // Sample 4 cardinal neighbors at the specified offset
    int outlineN = sampleOutlineIndex(vUv, vec2(0.0, outlineOffset));
    int outlineS = sampleOutlineIndex(vUv, vec2(0.0, -outlineOffset));
    int outlineE = sampleOutlineIndex(vUv, vec2(outlineOffset, 0.0));
    int outlineW = sampleOutlineIndex(vUv, vec2(-outlineOffset, 0.0));
    
    // Check if any neighbor has a different outline index (or none)
    bool isEdge = (outlineN != outlineIndex) || 
                  (outlineS != outlineIndex) || 
                  (outlineE != outlineIndex) || 
                  (outlineW != outlineIndex);
    
    // If it's an edge, draw white outline (opaque)
    if (isEdge) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      return;
    }
  }
  
  // Not an edge - make it transparent so we don't overwrite SSAO render
  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
`

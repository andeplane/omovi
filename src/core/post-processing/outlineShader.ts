// Post-processing shader for drawing outlines around selected particles
// Based on Reveal's outline detection approach

export const outlineVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const outlineFragmentShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float outlineOffset;

varying vec2 vUv;

// Decode outline index from alpha channel (bits 5-8)
int decodeOutlineIndex(float alpha) {
  return int(floor((alpha * 255.0) + 0.5)) >> 4;
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
    
    // If it's an edge, draw white outline
    if (isEdge) {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      return;
    }
  }
  
  // Not an edge, keep original color
  gl_FragColor = vec4(color.rgb, 1.0);
}
`;


export const rttFragment = `
varying vec2 vUv;

// selection outline
varying vec2 vUv0;
varying vec2 vUv1;
varying vec2 vUv2;
varying vec2 vUv3;

uniform sampler2D tBase;
uniform sampler2D tSelected;
uniform vec3 uHighlightColor;

void main() {
  vec4 t0 = texture2D(tBase, vUv);
  vec4 t1 = texture2D(tSelected, vUv);

  vec3 highlightColor = uHighlightColor;
  // blend in a bit of the original color into the highlight color
  highlightColor.r = 0.8*highlightColor.r + 0.2*highlightColor.r * t1.r;
  highlightColor.g = 0.8*highlightColor.g + 0.2*highlightColor.g * t1.g;
  highlightColor.b = 0.8*highlightColor.b + 0.2*highlightColor.b * t1.b;

  t1.rgb = highlightColor;
  t1.a = min(t1.a, 0.5);

  vec4 c = vec4(t0.a);
  c.rgb = mix(t0.rgb, t1.rgb, t1.a);
  
  gl_FragColor = c;

  float a0 = texture2D(tSelected, vUv0).a;
  float a1 = texture2D(tSelected, vUv1).a;
  float a2 = texture2D(tSelected, vUv2).a;
  float a3 = texture2D(tSelected, vUv3).a;
  float visibilityFactor = a0 + a1 + a2 + a3;

  // it doesn't have a color itself, but at least one neighbour has
  if (t1.a == 0.0 && visibilityFactor > 0.0) {
    gl_FragColor = vec4(1.0);
  }
}
`

export const rttVertex = `
varying vec2 vUv;

// selection outline
uniform vec2 texelSize;
varying vec2 vUv0;
varying vec2 vUv1;
varying vec2 vUv2;
varying vec2 vUv3;

void main() {
  vUv = uv;

  // selection outline
  vUv0 = vec2(uv.x + texelSize.x, uv.y);
	vUv1 = vec2(uv.x - texelSize.x, uv.y);
	vUv2 = vec2(uv.x, uv.y + texelSize.y);
  vUv3 = vec2(uv.x, uv.y - texelSize.y);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

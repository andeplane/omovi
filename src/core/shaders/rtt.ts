export const rttFragment = `
varying vec2 vUv;

// selection outline
varying vec2 vUv0;
varying vec2 vUv1;
varying vec2 vUv2;
varying vec2 vUv3;

uniform sampler2D tBase;

void main() {
  vec4 t0 = texture2D(tBase, vUv);
  
  vec4 c = t0;
  
  gl_FragColor = c;
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

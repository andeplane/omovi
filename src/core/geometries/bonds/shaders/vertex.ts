export default /* glsl */ `
#define LAMBERT

varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

uniform mat4 inverseModelMatrix;
attribute vec3 position1;
attribute vec3 position2;
attribute float bondRadius;

varying vec4 v_position1;
varying vec4 v_position2;

// U, V, axis represent the 3x3 cone basis.
// They are vec4 to pack extra data into the w-component
// since Safari on iOS only supports 8 varying vec4 registers.
varying vec4 U;
varying vec4 V;
varying vec4 axis;
varying float height;

#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

vec3 mul3(mat4 M, vec3 v) {
	vec4 u = M * vec4(v, 1.0);
	return u.xyz / u.w;
}

void main() {

	#include <uv_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED

	vNormal = normalize( transformedNormal );

#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>

	vec4 mvPosition = vec4( transformed, 1.0 );

    // vec3 center = 0.5 * (position1 + position2);
	vec3 center = (inverseModelMatrix*vec4(0.5 * (position1 + position2), 1.0)).xyz;
	height = length(position2-position1);
    vec3 newPosition = position;
	
    vec3 objectToCameraModelSpace = (inverseModelMatrix*vec4(cameraPosition - center, 1.0)).xyz;
	
    vec3 lDir = normalize(position1-position2);
	float dirSign = 1.0;
    if (dot(objectToCameraModelSpace, lDir) < 0.0) { // direction vector looks away, flip it
      dirSign = -1.0;
      lDir *= -1.;
    }

    vec3 left = normalize(cross(objectToCameraModelSpace, lDir));
    vec3 up = normalize(cross(left, lDir));

	// compute basis for cylinder
    axis.xyz = lDir * dirSign;
    U.xyz = cross(objectToCameraModelSpace, axis.xyz);
    V.xyz = cross(U.xyz, axis.xyz);
    // Transform to camera space
    axis.xyz = normalize(normalMatrix * axis.xyz);
    U.xyz = normalize(normalMatrix * U.xyz);
    V.xyz = normalize(normalMatrix * V.xyz);

	v_position1.xyz = mul3(viewMatrix, mul3(modelMatrix, position1));
    v_position2.xyz = mul3(viewMatrix, mul3(modelMatrix, position2));

    // Pack radii as w components of v_centerA and v_centerB
    v_position1.w = bondRadius;
    v_position2.w = bondRadius;

	vec3 surfacePoint = center + mat3(0.5 * height * lDir, bondRadius * left, bondRadius * up) * newPosition;
    transformed = surfacePoint;

	surfacePoint = mul3(modelViewMatrix, surfacePoint);

	// We pack surfacePoint as w-components of U, V and axis
    U.w = surfacePoint.x;
    V.w = surfacePoint.y;
    axis.w = surfacePoint.z;

    mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
	
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`

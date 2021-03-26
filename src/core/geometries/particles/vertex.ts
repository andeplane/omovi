export default /* glsl */ `
#define PHONG
varying vec3 vViewPosition;

#ifndef FLAT_SHADED

	varying vec3 vNormal;

#endif

uniform mat4 inverseModelMatrix;
attribute vec3 particlePosition;
attribute float particleRadius;

varying vec3 vSurfacePoint;
varying vec3 vCenter;
varying float vRadius;

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

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

	#include <uv_vertex>
	#include <uv2_vertex>
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

    #ifdef USE_INSTANCING

	vec3 objectToCameraModelSpace = (inverseModelMatrix*vec4(particlePosition - cameraPosition, 1.0)).xyz;
    vec3 view = normalize(objectToCameraModelSpace);
    vec3 right = normalize(makePerpendicular(view));
    vec3 up = cross(right, view);
	
	// Factor 2.0 is because geometry is 0.5x
	vec3 displacement = 2.0*particleRadius*(position.x * right + position.y * up);
	transformed = particlePosition + displacement;
	
	vSurfacePoint = mul3(modelViewMatrix, transformed);
    vCenter = mul3(modelViewMatrix, particlePosition);
	vRadius = particleRadius;
    #endif

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
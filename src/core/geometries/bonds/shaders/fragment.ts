export default /* glsl */ `
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform sampler2D colorTexture;
uniform mat4 projectionMatrix;
varying vec4 v_position1;
varying vec4 v_position2;
varying vec4 U;
varying vec4 V;
varying vec4 axis;
varying float height;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	mat3 basis = mat3(U.xyz, V.xyz, axis.xyz);
    vec3 surfacePoint = vec3(U.w, V.w, axis.w);
    vec3 rayTarget = surfacePoint;
	vec3 rayDirection;
	vec3 rayOrigin;
	
	if (isOrthographic) {
		// Orthographic: parallel rays along -Z axis, origin at fragment position
		rayDirection = vec3(0.0, 0.0, -1.0);
		rayOrigin = rayTarget;
	} else {
		// Perspective: rays diverge from camera at origin (0,0,0)
		rayDirection = normalize(rayTarget);
		rayOrigin = vec3(0.0, 0.0, 0.0);
	}

	vec3 diff = rayOrigin - v_position2.xyz;
    vec3 E = diff * basis;
    float L = height;
    vec3 D = rayDirection * basis;

    float R1 = v_position1.w;
    float R2 = v_position2.w;
    float dR = R2 - R1;

    float a = dot(D.xy, D.xy);
    float b = dot(E.xy, D.xy);
    float c = dot(E.xy, E.xy)-R1*R1;
    float L2Inv = 1.0/(L*L);

	// Calculate a dicriminant of the above quadratic equation (factor 2 removed from all b-terms above)
    float d = b*b - a*c;

    // d < 0.0 means the ray hits outside an infinitely long eccentric cone
    if (d < 0.0) {
		discard;
    }

	float sqrtd = sqrt(d);
    float dist1 = (-b - sqrtd)/a;
    float dist2 = (-b + sqrtd)/a;

    // Make sure dist1 is the smaller one
    if (dist2 < dist1) {
      float tmp = dist1;
      dist1 = dist2;
      dist2 = tmp;
    }

	// Check the smallest root, it is closest camera. Only test if the z-component is outside the truncated eccentric cone
    float dist = dist1;
    float intersectionPointZ = E.z + dist*D.z;
    // Intersection point in camera space
    vec3 p = rayOrigin + dist*rayDirection;
    bool isInner = false;

    if (intersectionPointZ <= 0.0 ||
      intersectionPointZ >= L
      ) {
      // Either intersection point is behind starting point (happens inside the cone),
      // or the intersection point is outside the end caps. This is not a valid solution.
      isInner = true;
      dist = dist2;
      intersectionPointZ = E.z + dist*D.z;
      p = rayOrigin + dist*rayDirection;

      if (intersectionPointZ <= 0.0 ||
        intersectionPointZ >= L
      ) {
        // Missed the other point too
		discard;
      }
    }

	// Find normal vector
    vec3 n = normalize(-axis.xyz);
    vec3 position1 = v_position1.xyz;
    vec3 position2 = v_position2.xyz;
    vec3 A = cross(position1 - p, position2 - p);

    vec3 t = normalize(cross(n, A));
    vec3 o1 = position1 + R1 * t;
    vec3 o2 = position2 + R2 * t;
    vec3 B = o2-o1;
    normal = normalize(cross(A, B));

#ifdef FRAG_DEPTH
	float projectedIntersection_z = projectionMatrix[0][2]*p.x + projectionMatrix[1][2]*p.y + projectionMatrix[2][2]*p.z + projectionMatrix[3][2];
	float projectedIntersection_w = projectionMatrix[0][3]*p.x + projectionMatrix[1][3]*p.y + projectionMatrix[2][3]*p.z + projectionMatrix[3][3];
	gl_FragDepthEXT = ((gl_DepthRange.diff * (projectedIntersection_z / projectedIntersection_w)) + gl_DepthRange.near + gl_DepthRange.far) * 0.5;
#endif

	#include <emissivemap_fragment>

	// accumulation
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
  
}

`

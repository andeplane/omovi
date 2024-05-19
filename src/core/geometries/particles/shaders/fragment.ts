export default /* glsl */ `
#define LAMBERT

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform sampler2D colorTexture;
uniform mat4 projectionMatrix;
uniform float dataTextureWidth;
uniform float dataTextureHeight;
varying vec3 vSurfacePoint;
varying vec3 vCenter;
varying float vRadius;
varying float vParticleIndex;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
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
	float x = mod(vParticleIndex, dataTextureWidth);
	float y = floor(vParticleIndex / dataTextureWidth);
	float xCoord = (x + 0.5) / dataTextureWidth;
	float yCoord = (y + 0.5) / dataTextureHeight; // invert Y axis
	vec2 textureIndex = vec2(xCoord, yCoord);
	vec4 particleColor = texture2D(colorTexture, textureIndex);

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>
	
	diffuseColor.rgb *= particleColor.rgb;
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	vec3 rayTarget = vSurfacePoint;
	vec3 rayDirection = normalize(rayTarget); // rayOrigin is (0,0,0) in camera space

	vec3 diff = rayTarget - vCenter.xyz;
    vec3 E = diff;
    vec3 D = rayDirection;

    float a = dot(D, D);
    float b = dot(E, D);
    float c = dot(E, E) - vRadius*vRadius;

    // discriminant of sphere equation (factor 2 removed from b above)
    float d = b*b - a*c;
    if(d < 0.0)
        discard;
	
    float sqrtd = sqrt(d);
    float dist1 = (-b - sqrtd)/a;
    float dist2 = (-b + sqrtd)/a;

    // Make sure dist1 is the smaller one
    if (dist2 < dist1) {
        float tmp = dist1;
        dist1 = dist2;
        dist2 = tmp;
    }

    float dist = dist1;
    float intersectionPointZ = E.z + dist*D.z;
	vec3 p = rayTarget + dist*rayDirection;

	// Find normal vector in local space
    normal = normalize(vec3(p - vCenter.xyz));
    // Transform into camera space
    if (dot(normal, rayDirection) >  0.) {
        normal = -normal;
    }

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
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}
`

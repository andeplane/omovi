declare const _default: "\n#define PHONG\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n\n\tvarying vec3 vNormal;\n\n#endif\n\nuniform mat4 inverseModelMatrix;\nattribute vec3 particlePosition;\nattribute float particleRadius;\n\nvarying vec3 vSurfacePoint;\nvarying vec3 vCenter;\nvarying float vRadius;\n\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvec3 makePerpendicular(vec3 v) {\n    if(v.x == 0.0 && v.y == 0.0) {\n        if(v.z == 0.0) {\n            return vec3(0.0, 0.0, 0.0);\n        }\n        return vec3(0.0, 1.0, 0.0);\n    }\n    return vec3(-v.y, v.x, 0.0);\n}\n\nvec3 mul3(mat4 M, vec3 v) {\n\tvec4 u = M * vec4(v, 1.0);\n\treturn u.xyz / u.w;\n}\n\nvoid main() {\n\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n\n\tvNormal = normalize( transformedNormal );\n\n#endif\n\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t\n    vec4 mvPosition = vec4( transformed, 1.0 );\n\n    #ifdef USE_INSTANCING\n\n\tvec3 objectToCameraModelSpace = (inverseModelMatrix*vec4(particlePosition - cameraPosition, 1.0)).xyz;\n    vec3 view = normalize(objectToCameraModelSpace);\n    vec3 right = normalize(makePerpendicular(view));\n    vec3 up = cross(right, view);\n\t\n\t// Factor 2.0 is because geometry is 0.5x\n\tvec3 displacement = 2.0*particleRadius*(position.x * right + position.y * up);\n\t// particlePosition + displacement is the current vertex, also move closer to camera so billboard covers the sphere\n\ttransformed = particlePosition + displacement - particleRadius * view;\n\t\n\tvSurfacePoint = mul3(modelViewMatrix, transformed);\n    vCenter = mul3(modelViewMatrix, particlePosition);\n\tvRadius = particleRadius;\n    #endif\n\n    mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n    gl_Position = projectionMatrix * mvPosition;\n\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\n\tvViewPosition = - mvPosition.xyz;\n\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n\n}\n";
export default _default;

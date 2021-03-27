(this["webpackJsonpomovi-example"]=this["webpackJsonpomovi-example"]||[]).push([[0],{17:function(n,e,t){n.exports=t(25)},18:function(n,e,t){},24:function(n,e,t){},25:function(n,e,t){"use strict";t.r(e);t(18);var i=t(7),r=t.n(i),a=t(14),o=t.n(a),s=t(10),c=t(15),l=t(0),d=t(3),u=t(1),m=t(2),p=t(5),f=t(16),v=t.n(f),g=function(n){Object(u.a)(t,n);var e=Object(m.a)(t);function t(n,i){var r;return Object(l.a)(this,t),(r=e.call(this,i)).materialType=n,r.uniforms={},r.extensions={},r}return Object(d.a)(t,[{key:"copy",value:function(n){p.MeshPhongMaterial.prototype.copy.call(this,n);var e=n;return this.type=e.type,this.defines=Object(c.a)({},e.defines),this.extensions=e.extensions,this.uniforms=e.uniforms,this.onBeforeCompile=e.onBeforeCompile,this}},{key:"clone",value:function(){var n=new p.MeshPhongMaterial;return t.prototype.copy.call(n,this),n}}]),t}(p.MeshPhongMaterial),h={},_={};function x(n,e){if(function(n){if(n in _)return _[n];var e=new p.WebGLRenderer,t=e.domElement.getContext("webgl");return _[n]=!!t&&null!=t.getExtension(n),e.dispose(),_[n]}(n)){if("EXT_frag_depth"===n)return e.extensions.fragDepth=!0,!0;throw Error("Error adding unsupported extension "+n)}return!1}var y,b=function(n,e,t){if(null!=h[n])return h[n];var i=new g(n,{color:16711680});return i.uniforms.inverseModelMatrix={value:new p.Matrix4},i.uniforms.inverseNormalMatrix={value:new p.Matrix3},x("EXT_frag_depth",i),i.onBeforeCompile=function(n){Object.assign(n.uniforms,i.uniforms),i.uniforms=n.uniforms,n.vertexShader=e,n.fragmentShader=t},i.onBeforeCompile.toString=function(){return n},h[n]=i,i},w=new p.Matrix4,M=new p.Matrix4,z=new p.Matrix3,j=new p.Matrix3,P=function n(e){var t=this;Object(l.a)(this,n),this.add=function(n){if(console.log("Adding ",n),n.material instanceof g){var e=n.material,i=e.type;null==t.materials[i]&&(t.materials[i]=e)}t.object.add(n)},this.remove=function(n){t.object.remove(n)},this.setupLights=function(n,e,t){n.intensity=.3,e.intensity=.7,t.add(e),t.add(n)},this.setupCanvas=function(n){n.style.width="640px",n.style.height="480px",n.style.minWidth="100%",n.style.minHeight="100%",n.style.maxWidth="100%",n.style.maxHeight="100%"},this.setupCamera=function(n){n.position.set(10,10,10),n.lookAt(new p.Vector3(0,0,0))},this.updateUniforms=function(n){t.object.matrixWorld.copy(t.object.matrixWorld).invert(),M.copy(n.matrixWorldInverse).multiply(t.object.matrixWorld),z.getNormalMatrix(M),j.copy(z).invert(),Object.values(t.materials).forEach((function(n){null!=n.uniforms.inverseModelMatrix&&n.uniforms.inverseModelMatrix.value.copy(w),null!=n.uniforms.inverseNormalMatrix&&n.uniforms.inverseNormalMatrix.value.copy(j)}))},this.animate=function(){t.resizeIfNeeded(),t.controls.update(t.clock.getDelta()),t.updateUniforms(t.camera),t.renderer.render(t.scene,t.camera),t.latestRequestId=requestAnimationFrame(t.animate.bind(t))},this.resizeIfNeeded=function(){var n=t.renderer.getSize(new p.Vector2),e=n.width,i=n.height,r=0!==t.domElement.clientWidth?t.domElement.clientWidth:t.canvas.clientWidth,a=0!==t.domElement.clientHeight?t.domElement.clientHeight:t.canvas.clientHeight,o=window.devicePixelRatio*r,s=window.devicePixelRatio*a,c=o*s,l=c>14e5?Math.sqrt(14e5/c):1,d=o*l,u=s*l;return!(Math.abs(e-d)<.1&&Math.abs(i-u)<.1)&&(t.renderer.setSize(d,u),function(n,e,t){n instanceof p.PerspectiveCamera&&(n.aspect=e/t),n.updateProjectionMatrix()}(t.camera,d,u),!0)},this.renderer=new p.WebGLRenderer,this.canvas=this.renderer.domElement,this.domElement=e,this.domElement.appendChild(this.canvas),this.setupCanvas(this.canvas),this.scene=new p.Scene,this.ambientLight=new p.AmbientLight(16777215),this.directionalLight=new p.DirectionalLight(16777215),this.setupLights(this.ambientLight,this.directionalLight,this.scene),this.camera=new p.PerspectiveCamera(60,640/480,.1,1e4),this.setupCamera(this.camera),this.controls=new v.a(this.camera,this.canvas),this.latestRequestId=void 0,this.clock=new p.Clock,this.object=new p.Object3D,this.scene.add(this.object),this.materials={},this.animate()},D=function(n){var e=n.particles,t=n.bonds,a=Object(i.useRef)(null),o=Object(i.useState)(void 0),c=Object(s.a)(o,2),l=c[0],d=c[1];Object(i.useEffect)((function(){a.current&&!y&&(y=new P(a.current),d(y))}),[a,l]);var u=Object(i.useRef)();Object(i.useEffect)((function(){u.current=e}));var m=u.current,p=Object(i.useRef)();Object(i.useEffect)((function(){p.current=t}));var f=p.current;return Object(i.useEffect)((function(){l&&(m&&l.remove(m.getMesh()),e&&l.add(e.getMesh()),f&&l.remove(f.getMesh()),t&&l.add(t.getMesh()))}),[e,t,l]),r.a.createElement("div",{style:{height:"100%",width:"100%"}},r.a.createElement("div",{style:{height:"100%",width:"100%"},ref:a}))},A=function(){function n(e){var t=this;Object(l.a)(this,n),this.getRadius=function(n){return t.radii[n]},this.getPosition=function(n){return new p.Vector3(t.positions[3*n+0],t.positions[3*n+1],t.positions[3*n+2])},this.getGeometry=function(){var n=new p.PlaneBufferGeometry(1,1,1,1),e=new p.InstancedBufferGeometry;return e.instanceCount=t.count,e.setIndex(n.getIndex()),e.setAttribute("position",n.getAttribute("position")),e.setAttribute("normal",n.getAttribute("normal")),e.setAttribute("particlePosition",new p.InstancedBufferAttribute(t.positions,3,!1,1)),e.setAttribute("particleRadius",new p.InstancedBufferAttribute(t.radii,1,!1,1)),e},this.getMesh=function(){if(null!=t.mesh)return t.mesh;var n=t.getGeometry(),e=b("particle","\n#define PHONG\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n\n\tvarying vec3 vNormal;\n\n#endif\n\nuniform mat4 inverseModelMatrix;\nattribute vec3 particlePosition;\nattribute float particleRadius;\n\nvarying vec3 vSurfacePoint;\nvarying vec3 vCenter;\nvarying float vRadius;\n\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvec3 makePerpendicular(vec3 v) {\n    if(v.x == 0.0 && v.y == 0.0) {\n        if(v.z == 0.0) {\n            return vec3(0.0, 0.0, 0.0);\n        }\n        return vec3(0.0, 1.0, 0.0);\n    }\n    return vec3(-v.y, v.x, 0.0);\n}\n\nvec3 mul3(mat4 M, vec3 v) {\n\tvec4 u = M * vec4(v, 1.0);\n\treturn u.xyz / u.w;\n}\n\nvoid main() {\n\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n\n\tvNormal = normalize( transformedNormal );\n\n#endif\n\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t\n    vec4 mvPosition = vec4( transformed, 1.0 );\n\n    #ifdef USE_INSTANCING\n\n\tvec3 objectToCameraModelSpace = (inverseModelMatrix*vec4(particlePosition - cameraPosition, 1.0)).xyz;\n    vec3 view = normalize(objectToCameraModelSpace);\n    vec3 right = normalize(makePerpendicular(view));\n    vec3 up = cross(right, view);\n\t\n\t// Factor 2.0 is because geometry is 0.5x\n\tvec3 displacement = 2.0*particleRadius*(position.x * right + position.y * up);\n\t// particlePosition + displacement is the current vertex, also move closer to camera so billboard covers the sphere\n\ttransformed = particlePosition + displacement - particleRadius * view;\n\t\n\tvSurfacePoint = mul3(modelViewMatrix, transformed);\n    vCenter = mul3(modelViewMatrix, particlePosition);\n\tvRadius = particleRadius;\n    #endif\n\n    mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n    gl_Position = projectionMatrix * mvPosition;\n\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\n\tvViewPosition = - mvPosition.xyz;\n\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n\n}\n","\n#define PHONG\n\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n\nuniform mat4 projectionMatrix;\nvarying vec3 vSurfacePoint;\nvarying vec3 vCenter;\nvarying float vRadius;\n\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\nvoid main() {\n\n\t#include <clipping_planes_fragment>\n\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\n\tvec3 rayTarget = vSurfacePoint;\n\tvec3 rayDirection = normalize(rayTarget); // rayOrigin is (0,0,0) in camera space\n\n\tvec3 diff = rayTarget - vCenter.xyz;\n    vec3 E = diff;\n    vec3 D = rayDirection;\n\n    float a = dot(D, D);\n    float b = dot(E, D);\n    float c = dot(E, E) - vRadius*vRadius;\n\n    // discriminant of sphere equation (factor 2 removed from b above)\n    float d = b*b - a*c;\n    if(d < 0.0)\n        discard;\n\t\n    float sqrtd = sqrt(d);\n    float dist1 = (-b - sqrtd)/a;\n    float dist2 = (-b + sqrtd)/a;\n\n    // Make sure dist1 is the smaller one\n    if (dist2 < dist1) {\n        float tmp = dist1;\n        dist1 = dist2;\n        dist2 = tmp;\n    }\n\n    float dist = dist1;\n    float intersectionPointZ = E.z + dist*D.z;\n\tvec3 p = rayTarget + dist*rayDirection;\n\n\t// Find normal vector in local space\n    normal = normalize(vec3(p - vCenter.xyz));\n    // Transform into camera space\n    if (dot(normal, rayDirection) >  0.) {\n        normal = -normal;\n    }\n\n// #ifdef GL_EXT_frag_depth\n\tfloat projectedIntersection_z = projectionMatrix[0][2]*p.x + projectionMatrix[1][2]*p.y + projectionMatrix[2][2]*p.z + projectionMatrix[3][2];\n\tfloat projectedIntersection_w = projectionMatrix[0][3]*p.x + projectionMatrix[1][3]*p.y + projectionMatrix[2][3]*p.z + projectionMatrix[3][3];\n\tgl_FragDepthEXT = ((gl_DepthRange.diff * (projectedIntersection_z / projectedIntersection_w)) + gl_DepthRange.near + gl_DepthRange.far) * 0.5;\n// #endif\n\n\t#include <emissivemap_fragment>\n\n\t// accumulation\n\t#include <lights_phong_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\n\t// modulation\n\t#include <aomap_fragment>\n\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\n\t#include <envmap_fragment>\n\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n\n}\n");t.mesh=new p.InstancedMesh(n,e,t.count);for(var i=new p.Matrix4,r=0;r<t.count;r++)t.mesh.setMatrixAt(r,i),t.mesh.setColorAt(r,t.colors[r]);return t.mesh.frustumCulled=!1,t.mesh},this.positions=new Float32Array(3*e),this.indices=new Float32Array(e),this.radii=new Float32Array(e),this.colors=[],this.count=0,this.capacity=e,this.mesh=void 0}return Object(d.a)(n,[{key:"add",value:function(n,e,t,i){var r=arguments.length>4&&void 0!==arguments[4]?arguments[4]:255,a=arguments.length>5&&void 0!==arguments[5]?arguments[5]:0,o=arguments.length>6&&void 0!==arguments[6]?arguments[6]:0;if(this.count!==this.capacity){var s=this.count;this.positions[3*s+0]=n,this.positions[3*s+1]=e,this.positions[3*s+2]=t,this.colors.push(new p.Color(r/255,a/255,o/255)),this.radii[s]=.25*i,this.indices[s]=s,this.count+=1}else console.log("Warning, can't add particle because arrays are full")}}]),n}(),E=function(){function n(e){var t=this;Object(l.a)(this,n),this.getRadius=function(n){return t.radii[n]},this.getPosition1=function(n){return new p.Vector3(t.positions1[3*n+0],t.positions1[3*n+1],t.positions1[3*n+2])},this.getGeometry=function(){var n=[];n.push(-1,1,-1),n.push(-1,-1,-1),n.push(1,1,-1),n.push(1,-1,-1),n.push(1,1,1),n.push(1,-1,1);var e=new p.BufferAttribute(new Float32Array(n),3),i=new p.BufferAttribute(new Uint16Array([1,2,0,1,3,2,3,4,2,3,5,4]),1),r=new p.InstancedBufferGeometry;return r.instanceCount=t.count,r.setIndex(i),r.setAttribute("position",e),r.setAttribute("normal",e),r.setAttribute("position1",new p.InstancedBufferAttribute(t.positions1,3,!1,1)),r.setAttribute("position2",new p.InstancedBufferAttribute(t.positions2,3,!1,1)),r.setAttribute("bondRadius",new p.InstancedBufferAttribute(t.radii,1,!1,1)),r},this.getMesh=function(){if(null!=t.mesh)return t.mesh;var n=t.getGeometry(),e=b("bonds","\n#define PHONG\n\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n\n\tvarying vec3 vNormal;\n\n#endif\n\nuniform mat4 inverseModelMatrix;\nattribute vec3 position1;\nattribute vec3 position2;\nattribute float bondRadius;\n\nvarying vec4 v_position1;\nvarying vec4 v_position2;\n\n// U, V, axis represent the 3x3 cone basis.\n// They are vec4 to pack extra data into the w-component\n// since Safari on iOS only supports 8 varying vec4 registers.\nvarying vec4 U;\nvarying vec4 V;\nvarying vec4 axis;\nvarying float height;\n\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvec3 mul3(mat4 M, vec3 v) {\n\tvec4 u = M * vec4(v, 1.0);\n\treturn u.xyz / u.w;\n}\n\nvoid main() {\n\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n\n\tvNormal = normalize( transformedNormal );\n\n#endif\n\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\n\tvec4 mvPosition = vec4( transformed, 1.0 );\n\n    // vec3 center = 0.5 * (position1 + position2);\n\tvec3 center = (inverseModelMatrix*vec4(0.5 * (position1 + position2), 1.0)).xyz;\n\theight = length(position2-position1);\n    vec3 newPosition = position;\n\t\n    vec3 objectToCameraModelSpace = (inverseModelMatrix*vec4(cameraPosition - center, 1.0)).xyz;\n\t\n    vec3 lDir = normalize(position1-position2);\n\tfloat dirSign = 1.0;\n    if (dot(objectToCameraModelSpace, lDir) < 0.0) { // direction vector looks away, flip it\n      dirSign = -1.0;\n      lDir *= -1.;\n    }\n\n    vec3 left = normalize(cross(objectToCameraModelSpace, lDir));\n    vec3 up = normalize(cross(left, lDir));\n\n\t// compute basis for cylinder\n    axis.xyz = lDir * dirSign;\n    U.xyz = cross(objectToCameraModelSpace, axis.xyz);\n    V.xyz = cross(U.xyz, axis.xyz);\n    // Transform to camera space\n    axis.xyz = normalize(normalMatrix * axis.xyz);\n    U.xyz = normalize(normalMatrix * U.xyz);\n    V.xyz = normalize(normalMatrix * V.xyz);\n\n\tv_position1.xyz = mul3(viewMatrix, mul3(modelMatrix, position1));\n    v_position2.xyz = mul3(viewMatrix, mul3(modelMatrix, position2));\n\n    // Pack radii as w components of v_centerA and v_centerB\n    v_position1.w = bondRadius;\n    v_position2.w = bondRadius;\n\n\tvec3 surfacePoint = center + mat3(0.5 * height * lDir, bondRadius * left, bondRadius * up) * newPosition;\n    transformed = surfacePoint;\n\n\tsurfacePoint = mul3(modelViewMatrix, surfacePoint);\n\n\t// We pack surfacePoint as w-components of U, V and axis\n    U.w = surfacePoint.x;\n    V.w = surfacePoint.y;\n    axis.w = surfacePoint.z;\n\n    mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n    gl_Position = projectionMatrix * mvPosition;\n\t\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\n\tvViewPosition = - mvPosition.xyz;\n\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n\n}\n","\n#define PHONG\n\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n\nuniform mat4 projectionMatrix;\nvarying vec4 v_position1;\nvarying vec4 v_position2;\nvarying vec4 U;\nvarying vec4 V;\nvarying vec4 axis;\nvarying float height;\n\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\nvoid main() {\n\n\t#include <clipping_planes_fragment>\n\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\n\tmat3 basis = mat3(U.xyz, V.xyz, axis.xyz);\n    vec3 surfacePoint = vec3(U.w, V.w, axis.w);\n    vec3 rayTarget = surfacePoint;\n\tvec3 rayDirection = normalize(rayTarget); // rayOrigin is (0,0,0) in camera space\n\n\tvec3 diff = rayTarget - v_position2.xyz;\n    vec3 E = diff * basis;\n    float L = height;\n    vec3 D = rayDirection * basis;\n\n    float R1 = v_position1.w;\n    float R2 = v_position2.w;\n    float dR = R2 - R1;\n\n    float a = dot(D.xy, D.xy);\n    float b = dot(E.xy, D.xy);\n    float c = dot(E.xy, E.xy)-R1*R1;\n    float L2Inv = 1.0/(L*L);\n\n\t// Calculate a dicriminant of the above quadratic equation (factor 2 removed from all b-terms above)\n    float d = b*b - a*c;\n\n    // d < 0.0 means the ray hits outside an infinitely long eccentric cone\n    if (d < 0.0) {\n\t\tdiscard;\n    }\n\n\tfloat sqrtd = sqrt(d);\n    float dist1 = (-b - sqrtd)/a;\n    float dist2 = (-b + sqrtd)/a;\n\n    // Make sure dist1 is the smaller one\n    if (dist2 < dist1) {\n      float tmp = dist1;\n      dist1 = dist2;\n      dist2 = tmp;\n    }\n\n\t// Check the smallest root, it is closest camera. Only test if the z-component is outside the truncated eccentric cone\n    float dist = dist1;\n    float intersectionPointZ = E.z + dist*D.z;\n    // Intersection point in camera space\n    vec3 p = rayTarget + dist*rayDirection;\n    bool isInner = false;\n\n    if (intersectionPointZ <= 0.0 ||\n      intersectionPointZ >= L\n      ) {\n      // Either intersection point is behind starting point (happens inside the cone),\n      // or the intersection point is outside the end caps. This is not a valid solution.\n      isInner = true;\n      dist = dist2;\n      intersectionPointZ = E.z + dist*D.z;\n      p = rayTarget + dist*rayDirection;\n\n      if (intersectionPointZ <= 0.0 ||\n        intersectionPointZ >= L\n      ) {\n        // Missed the other point too\n\t\tdiscard;\n      }\n    }\n\n\t// Find normal vector\n    vec3 n = normalize(-axis.xyz);\n    vec3 position1 = v_position1.xyz;\n    vec3 position2 = v_position2.xyz;\n    vec3 A = cross(position1 - p, position2 - p);\n\n    vec3 t = normalize(cross(n, A));\n    vec3 o1 = position1 + R1 * t;\n    vec3 o2 = position2 + R2 * t;\n    vec3 B = o2-o1;\n    normal = normalize(cross(A, B));\n\n// #ifdef GL_EXT_frag_depth\n\tfloat projectedIntersection_z = projectionMatrix[0][2]*p.x + projectionMatrix[1][2]*p.y + projectionMatrix[2][2]*p.z + projectionMatrix[3][2];\n\tfloat projectedIntersection_w = projectionMatrix[0][3]*p.x + projectionMatrix[1][3]*p.y + projectionMatrix[2][3]*p.z + projectionMatrix[3][3];\n\tgl_FragDepthEXT = ((gl_DepthRange.diff * (projectedIntersection_z / projectedIntersection_w)) + gl_DepthRange.near + gl_DepthRange.far) * 0.5;\n// #endif\n\n\t#include <emissivemap_fragment>\n\n\t// accumulation\n\t#include <lights_phong_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\n\t// modulation\n\t#include <aomap_fragment>\n\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\n\t#include <envmap_fragment>\n\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n  \n}\n");t.mesh=new p.InstancedMesh(n,e,t.count);for(var i=new p.Matrix4,r=0;r<t.count;r++)t.mesh.setMatrixAt(r,i),t.mesh.setColorAt(r,t.colors[r]);return t.mesh.frustumCulled=!1,t.mesh},this.positions1=new Float32Array(3*e),this.positions2=new Float32Array(3*e),this.indices=new Float32Array(e),this.radii=new Float32Array(e),this.colors=[],this.count=0,this.capacity=e,this.mesh=void 0}return Object(d.a)(n,[{key:"add",value:function(n,e,t,i,r,a,o){var s=arguments.length>7&&void 0!==arguments[7]?arguments[7]:255,c=arguments.length>8&&void 0!==arguments[8]?arguments[8]:255,l=arguments.length>9&&void 0!==arguments[9]?arguments[9]:255;if(this.count!==this.capacity){var d=this.count;this.positions1[3*d+0]=n,this.positions1[3*d+1]=e,this.positions1[3*d+2]=t,this.positions2[3*d+0]=i,this.positions2[3*d+1]=r,this.positions2[3*d+2]=a,this.colors.push(new p.Color(s/255,c/255,l/255)),this.radii[d]=.25*o,this.indices[d]=d,this.count+=1}else console.log("Warning, can't add particle because arrays are full")}}]),n}();t(24);var R=new A(2);R.add(-1,0,0,.5),R.add(1,0,0,.5);var L=new E(1);L.add(-1,0,0,1,0,0,.1);var C=function(){return r.a.createElement(D,{particles:R,bonds:L})};o.a.render(r.a.createElement(C,null),document.getElementById("root"))}},[[17,1,2]]]);
//# sourceMappingURL=main.eed9f9f7.chunk.js.map
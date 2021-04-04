import React, { useRef, useState, useEffect } from 'react';
import { MeshPhongMaterial, Matrix4, Matrix3, WebGLRenderer, Vector3, Vector2, Scene, AmbientLight, DirectionalLight, PerspectiveCamera, Clock, Object3D, PlaneBufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, InstancedMesh, Color, BufferAttribute, Box3 } from 'three';
import ComboControls from '@cognite/three-combo-controls';

class Material extends MeshPhongMaterial {
  constructor(materialType, parameters) {
    super(parameters);
    this.materialType = materialType;
    this.uniforms = {};
    this.extensions = {};
    this.defines = {};
  }

  copy(source) {
    MeshPhongMaterial.prototype.copy.call(this, source);
    const castedSource = source;
    this.type = castedSource.type;
    this.defines = { ...castedSource.defines
    };
    this.extensions = castedSource.extensions;
    this.uniforms = castedSource.uniforms;
    this.onBeforeCompile = castedSource.onBeforeCompile;
    return this;
  }

  clone() {
    const material = new MeshPhongMaterial();
    Material.prototype.copy.call(material, this);
    return material;
  }

}

const materialMap = {};

let _fragDepthSupported;

function fragDepthSupported() {
  if (_fragDepthSupported !== undefined) {
    return _fragDepthSupported;
  }

  const renderer = new WebGLRenderer();
  const gl = renderer.domElement.getContext('webgl');

  if (renderer.capabilities.isWebGL2 || gl != null && gl.getExtension('EXT_frag_depth') != null) {
    _fragDepthSupported = true;
  } else {
    _fragDepthSupported = false;
  }

  renderer.dispose();
  return _fragDepthSupported;
}

const createMaterial = (type, vertexShader, fragmentShader) => {
  if (materialMap[type] != null) {
    return materialMap[type];
  }

  const material = new Material(type, {
    color: 0xffffff
  });
  material.uniforms.inverseModelMatrix = {
    value: new Matrix4()
  };
  material.uniforms.inverseNormalMatrix = {
    value: new Matrix3()
  };

  if (fragDepthSupported()) {
    material.extensions.fragDepth = true;
    material.defines.FRAG_DEPTH = 1;
  }

  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, material.uniforms);
    material.uniforms = shader.uniforms;
    shader.vertexShader = vertexShader;
    shader.fragmentShader = fragmentShader;
  };

  material.onBeforeCompile.toString = () => type;

  materialMap[type] = material;
  return material;
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var stats_min = createCommonjsModule(function (module, exports) {
// stats.js - http://github.com/mrdoob/stats.js
(function(f,e){module.exports=e();})(commonjsGlobal,function(){var f=function(){function e(a){c.appendChild(a.dom);return a}function u(a){for(var d=0;d<c.children.length;d++)c.children[d].style.display=d===a?"block":"none";l=a;}var l=0,c=document.createElement("div");c.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";c.addEventListener("click",function(a){a.preventDefault();
u(++l%c.children.length);},!1);var k=(performance||Date).now(),g=k,a=0,r=e(new f.Panel("FPS","#0ff","#002")),h=e(new f.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var t=e(new f.Panel("MB","#f08","#201"));u(0);return {REVISION:16,dom:c,addPanel:e,showPanel:u,begin:function(){k=(performance||Date).now();},end:function(){a++;var c=(performance||Date).now();h.update(c-k,200);if(c>g+1E3&&(r.update(1E3*a/(c-g),100),g=c,a=0,t)){var d=performance.memory;t.update(d.usedJSHeapSize/
1048576,d.jsHeapSizeLimit/1048576);}return c},update:function(){k=this.end();},domElement:c,setMode:u}};f.Panel=function(e,f,l){var c=Infinity,k=0,g=Math.round,a=g(window.devicePixelRatio||1),r=80*a,h=48*a,t=3*a,v=2*a,d=3*a,m=15*a,n=74*a,p=30*a,q=document.createElement("canvas");q.width=r;q.height=h;q.style.cssText="width:80px;height:48px";var b=q.getContext("2d");b.font="bold "+9*a+"px Helvetica,Arial,sans-serif";b.textBaseline="top";b.fillStyle=l;b.fillRect(0,0,r,h);b.fillStyle=f;b.fillText(e,t,v);
b.fillRect(d,m,n,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d,m,n,p);return {dom:q,update:function(h,w){c=Math.min(c,h);k=Math.max(k,h);b.fillStyle=l;b.globalAlpha=1;b.fillRect(0,0,r,m);b.fillStyle=f;b.fillText(g(h)+" "+e+" ("+g(c)+"-"+g(k)+")",t,v);b.drawImage(q,d+a,m,n-a,p,d,m,n-a,p);b.fillRect(d+n-a,m,a,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d+n-a,m,a,g((1-h/w)*p));}}};return f});
});

const inverseModelMatrix = new Matrix4();
const modelViewMatrix = new Matrix4();
const normalMatrix = new Matrix3();
const inverseNormalMatrix = new Matrix3();

const adjustCamera = (camera, width, height) => {
  if (camera instanceof PerspectiveCamera) {
    camera.aspect = width / height;
  }

  camera.updateProjectionMatrix();
};

class Visualizer {
  constructor(domElement) {
    this.add = object => {
      if (object == null) {
        return;
      }

      if (object.material instanceof Material) {
        const material = object.material;
        const materialType = material.type;

        if (this.materials[materialType] == null) {
          this.materials[materialType] = material;
        }
      }

      this.object.add(object);
    };

    this.remove = object => {
      this.object.remove(object);
    };

    this.setupLights = (ambientLight, directionalLight, scene) => {
      ambientLight.intensity = 0.3;
      directionalLight.intensity = 0.7;
      scene.add(directionalLight);
      scene.add(ambientLight);
    };

    this.setupCanvas = canvas => {
      canvas.style.width = '640px';
      canvas.style.height = '480px';
      canvas.style.minWidth = '100%';
      canvas.style.minHeight = '100%';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
    };

    this.setupCamera = camera => {
      camera.position.set(10, 10, 10);
      camera.lookAt(new Vector3(0, 0, 0));
    };

    this.updateUniforms = camera => {
      this.object.matrixWorld.copy(this.object.matrixWorld).invert();
      modelViewMatrix.copy(camera.matrixWorldInverse).multiply(this.object.matrixWorld);
      normalMatrix.getNormalMatrix(modelViewMatrix);
      inverseNormalMatrix.copy(normalMatrix).invert();
      Object.values(this.materials).forEach(material => {
        if (material.uniforms.inverseModelMatrix != null) {
          material.uniforms.inverseModelMatrix.value.copy(inverseModelMatrix);
        }

        if (material.uniforms.inverseNormalMatrix != null) {
          material.uniforms.inverseNormalMatrix.value.copy(inverseNormalMatrix);
        }
      });
    };

    this.dispose = () => {
      this.domElement.removeChild(this.canvas);
      this.renderer.dispose();
    };

    this.getCameraPosition = () => {
      return this.controls.getState().position;
    };

    this.getCameraTarget = () => {
      return this.controls.getState().target;
    };

    this.setCameraPosition = position => {
      this.controls.setState(position, this.getCameraTarget());
    };

    this.setCameraTarget = target => {
      this.controls.setState(this.getCameraPosition(), target);
    };

    this.animate = () => {
      this.stats.begin();
      this.resizeIfNeeded();
      this.controls.update(this.clock.getDelta());
      this.updateUniforms(this.camera);
      this.renderer.render(this.scene, this.camera);
      this.stats.end();
      this.latestRequestId = requestAnimationFrame(this.animate.bind(this));
    };

    this.resizeIfNeeded = () => {
      const maxTextureSize = 1.4e6;
      const rendererSize = this.renderer.getSize(new Vector2());
      const rendererPixelWidth = rendererSize.width;
      const rendererPixelHeight = rendererSize.height;
      const clientWidth = this.domElement.clientWidth !== 0 ? this.domElement.clientWidth : this.canvas.clientWidth;
      const clientHeight = this.domElement.clientHeight !== 0 ? this.domElement.clientHeight : this.canvas.clientHeight;
      const clientPixelWidth = window.devicePixelRatio * clientWidth;
      const clientPixelHeight = window.devicePixelRatio * clientHeight;
      const clientTextureSize = clientPixelWidth * clientPixelHeight;
      const scale = clientTextureSize > maxTextureSize ? Math.sqrt(maxTextureSize / clientTextureSize) : 1;
      const width = clientPixelWidth * scale;
      const height = clientPixelHeight * scale;
      const maxError = 0.1;
      const isOptimalSize = Math.abs(rendererPixelWidth - width) < maxError && Math.abs(rendererPixelHeight - height) < maxError;

      if (isOptimalSize) {
        return false;
      }

      this.renderer.setSize(width, height);
      adjustCamera(this.camera, width, height);
      return true;
    };

    this.renderer = new WebGLRenderer();
    this.canvas = this.renderer.domElement;
    this.domElement = domElement;
    this.domElement.appendChild(this.canvas);
    this.setupCanvas(this.canvas);
    this.scene = new Scene();
    this.ambientLight = new AmbientLight(0xffffff);
    this.directionalLight = new DirectionalLight(0xffffff);
    this.setupLights(this.ambientLight, this.directionalLight, this.scene);
    this.camera = new PerspectiveCamera(60, 640 / 480, 0.1, 10000);
    this.setupCamera(this.camera);
    this.controls = new ComboControls(this.camera, this.canvas);
    this.latestRequestId = undefined;
    this.clock = new Clock();
    this.object = new Object3D();
    this.scene.add(this.object);
    this.stats = new stats_min();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    this.materials = {};
    this.animate();
  }

}

let newVisualizer;

const OMOVIVisualizer = ({
  particles,
  bonds,
  cameraTarget,
  cameraPosition
}) => {
  const domElement = useRef(null);
  const [visualizer, setVisualizer] = useState(undefined);
  useEffect(() => {
    if (domElement.current && !newVisualizer) {
      newVisualizer = new Visualizer(domElement.current);
      setVisualizer(newVisualizer);
    }
  }, [domElement, visualizer]);
  const prevParticlesRef = useRef();
  useEffect(() => {
    prevParticlesRef.current = particles;
  });
  const prevParticles = prevParticlesRef.current;
  const prevBondsRef = useRef();
  useEffect(() => {
    prevBondsRef.current = bonds;
  });
  const prevBonds = prevBondsRef.current;
  useEffect(() => {
    if (!visualizer) {
      return;
    }

    if (prevParticles) {
      visualizer.remove(prevParticles.getMesh());
    }

    if (particles) {
      visualizer.add(particles.getMesh());
    }

    if (prevBonds) {
      visualizer.remove(prevBonds.getMesh());
    }

    if (bonds) {
      visualizer.add(bonds.getMesh());
    }
  }, [particles, bonds, visualizer]);
  useEffect(() => {
    if (visualizer) {
      if (cameraTarget) {
        visualizer.setCameraTarget(cameraTarget);
      }
    }
  }, [cameraTarget, visualizer]);
  useEffect(() => {
    if (visualizer) {
      if (cameraPosition) {
        visualizer.setCameraPosition(cameraPosition);
      }
    }
  }, [cameraPosition, visualizer]);
  useEffect(() => {
    return () => {
      console.log('Should dispose visualizer');
    };
  }, []);
  return React.createElement("div", {
    style: {
      height: '100%',
      width: '100%'
    }
  }, React.createElement("div", {
    style: {
      height: '100%',
      width: '100%'
    },
    ref: domElement
  }));
};

var fragmentShader = `
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform mat4 projectionMatrix;
varying vec3 vSurfacePoint;
varying vec3 vCenter;
varying float vRadius;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
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

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;

var vertexShader = `
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
	// particlePosition + displacement is the current vertex, also move closer to camera so billboard covers the sphere
	transformed = particlePosition + displacement - particleRadius * view;
	
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
`;

class Particles {
  constructor(capacity) {
    this.getRadius = index => {
      return this.radii[index];
    };

    this.getPosition = index => {
      return new Vector3(this.positions[3 * index + 0], this.positions[3 * index + 1], this.positions[3 * index + 2]);
    };

    this.getType = index => {
      return this.types[index];
    };

    this.getGeometry = () => {
      const baseGeometry = new PlaneBufferGeometry(1, 1, 1, 1);
      const geometry = new InstancedBufferGeometry();
      geometry.instanceCount = this.count;
      geometry.setIndex(baseGeometry.getIndex());
      geometry.setAttribute('position', baseGeometry.getAttribute('position'));
      geometry.setAttribute('normal', baseGeometry.getAttribute('normal'));
      geometry.setAttribute('particlePosition', new InstancedBufferAttribute(this.positions, 3, false, 1));
      geometry.setAttribute('particleRadius', new InstancedBufferAttribute(this.radii, 1, false, 1));
      return geometry;
    };

    this.getMesh = () => {
      if (this.mesh != null) {
        return this.mesh;
      }

      const geometry = this.getGeometry();
      const material = createMaterial('particle', vertexShader, fragmentShader);
      this.mesh = new InstancedMesh(geometry, material, this.count);
      const matrix = new Matrix4();

      for (let i = 0; i < this.count; i++) {
        this.mesh.setMatrixAt(i, matrix);
        this.mesh.setColorAt(i, this.colors[i]);
      }

      this.mesh.frustumCulled = false;
      return this.mesh;
    };

    this.types = [];
    this.positions = new Float32Array(3 * capacity);
    this.indices = new Float32Array(capacity);
    this.radii = new Float32Array(capacity);
    this.colors = [];
    this.count = 0;
    this.capacity = capacity;
    this.mesh = undefined;
  }

  add({
    x,
    y,
    z,
    radius,
    type = 'H',
    r = 255.0,
    g = 0.0,
    b = 0.0
  }) {
    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full");
      return;
    }

    const index = this.count;
    this.positions[3 * index + 0] = x;
    this.positions[3 * index + 1] = y;
    this.positions[3 * index + 2] = z;
    this.colors.push(new Color(r / 255, g / 255, b / 255));
    this.radii[index] = radius * 0.25;
    this.indices[index] = index;
    this.types.push(type);
    this.count += 1;
  }

}

var fragmentShader$1 = `
#define PHONG

uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

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
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
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
	vec3 rayDirection = normalize(rayTarget); // rayOrigin is (0,0,0) in camera space

	vec3 diff = rayTarget - v_position2.xyz;
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
    vec3 p = rayTarget + dist*rayDirection;
    bool isInner = false;

    if (intersectionPointZ <= 0.0 ||
      intersectionPointZ >= L
      ) {
      // Either intersection point is behind starting point (happens inside the cone),
      // or the intersection point is outside the end caps. This is not a valid solution.
      isInner = true;
      dist = dist2;
      intersectionPointZ = E.z + dist*D.z;
      p = rayTarget + dist*rayDirection;

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

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
  
}

`;

var vertexShader$1 = `
#define PHONG

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
`;

class Bonds {
  constructor(capacity) {
    this.getRadius = index => {
      return this.radii[index];
    };

    this.getPosition1 = index => {
      return new Vector3(this.positions1[3 * index + 0], this.positions1[3 * index + 1], this.positions1[3 * index + 2]);
    };

    this.getGeometry = () => {
      const positions = [];
      positions.push(-1, 1, -1);
      positions.push(-1, -1, -1);
      positions.push(1, 1, -1);
      positions.push(1, -1, -1);
      positions.push(1, 1, 1);
      positions.push(1, -1, 1);
      const positionBufferAttribute = new BufferAttribute(new Float32Array(positions), 3);
      const indexBufferAttribute = new BufferAttribute(new Uint16Array([1, 2, 0, 1, 3, 2, 3, 4, 2, 3, 5, 4]), 1);
      const geometry = new InstancedBufferGeometry();
      geometry.instanceCount = this.count;
      geometry.setIndex(indexBufferAttribute);
      geometry.setAttribute('position', positionBufferAttribute);
      geometry.setAttribute('normal', positionBufferAttribute);
      geometry.setAttribute('position1', new InstancedBufferAttribute(this.positions1, 3, false, 1));
      geometry.setAttribute('position2', new InstancedBufferAttribute(this.positions2, 3, false, 1));
      geometry.setAttribute('bondRadius', new InstancedBufferAttribute(this.radii, 1, false, 1));
      return geometry;
    };

    this.getMesh = () => {
      if (this.mesh != null) {
        return this.mesh;
      }

      if (this.count === 0) {
        return null;
      }

      const geometry = this.getGeometry();
      const material = createMaterial('bonds', vertexShader$1, fragmentShader$1);
      this.mesh = new InstancedMesh(geometry, material, this.count);
      const matrix = new Matrix4();

      for (let i = 0; i < this.count; i++) {
        this.mesh.setMatrixAt(i, matrix);
        this.mesh.setColorAt(i, this.colors[i]);
      }

      this.mesh.frustumCulled = false;
      return this.mesh;
    };

    this.positions1 = new Float32Array(3 * capacity);
    this.positions2 = new Float32Array(3 * capacity);
    this.indices = new Float32Array(capacity);
    this.radii = new Float32Array(capacity);
    this.colors = [];
    this.count = 0;
    this.capacity = capacity;
    this.mesh = undefined;
  }

  add(x1, y1, z1, x2, y2, z2, radius, r = 255.0, g = 255.0, b = 255.0) {
    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full");
      return;
    }

    const index = this.count;
    this.positions1[3 * index + 0] = x1;
    this.positions1[3 * index + 1] = y1;
    this.positions1[3 * index + 2] = z1;
    this.positions2[3 * index + 0] = x2;
    this.positions2[3 * index + 1] = y2;
    this.positions2[3 * index + 2] = z2;
    this.colors.push(new Color(r / 255, g / 255, b / 255));
    this.radii[index] = radius * 0.25;
    this.indices[index] = index;
    this.count += 1;
  }

}

const AtomTypes = {
  H: {
    shortname: 'H',
    fullname: 'hydrogen',
    radius: 1.2,
    color: {
      r: 204,
      g: 204,
      b: 204
    }
  },
  He: {
    shortname: 'He',
    fullname: 'helium',
    radius: 1.4,
    color: {
      r: 217,
      g: 255,
      b: 255
    }
  },
  Li: {
    shortname: 'Li',
    fullname: 'lithium',
    radius: 1.82,
    color: {
      r: 204,
      g: 128,
      b: 255
    }
  },
  Be: {
    shortname: 'Be',
    fullname: 'beryllium',
    radius: 1.53,
    color: {
      r: 194,
      g: 255,
      b: 0
    }
  },
  B: {
    shortname: 'B',
    fullname: 'boron',
    radius: 1.92,
    color: {
      r: 255,
      g: 181,
      b: 181
    }
  },
  C: {
    shortname: 'C',
    fullname: 'carbon',
    radius: 1.7,
    color: {
      r: 80,
      g: 80,
      b: 80
    }
  },
  N: {
    shortname: 'N',
    fullname: 'nitrogen',
    radius: 1.55,
    color: {
      r: 48,
      g: 80,
      b: 248
    }
  },
  O: {
    shortname: 'O',
    fullname: 'oxygen',
    radius: 1.52,
    color: {
      r: 170,
      g: 0,
      b: 0
    }
  },
  F: {
    shortname: 'F',
    fullname: 'fluorine',
    radius: 1.35,
    color: {
      r: 144,
      g: 224,
      b: 80
    }
  },
  Ne: {
    shortname: 'Ne',
    fullname: 'neon',
    radius: 1.54,
    color: {
      r: 48,
      g: 80,
      b: 248
    }
  },
  Na: {
    shortname: 'Na',
    fullname: 'sodium',
    radius: 2.27,
    color: {
      r: 171,
      g: 92,
      b: 242
    }
  },
  Mg: {
    shortname: 'Mg',
    fullname: 'magnesium',
    radius: 1.73,
    color: {
      r: 138,
      g: 255,
      b: 0
    }
  },
  Al: {
    shortname: 'Al',
    fullname: 'aluminium',
    radius: 1.84,
    color: {
      r: 191,
      g: 166,
      b: 166
    }
  },
  Si: {
    shortname: 'Si',
    fullname: 'silicon',
    radius: 2.27,
    color: {
      r: 240,
      g: 200,
      b: 160
    }
  },
  P: {
    shortname: 'P',
    fullname: 'phosphorus',
    radius: 1.8,
    color: {
      r: 255,
      g: 128,
      b: 0
    }
  },
  S: {
    shortname: 'S',
    fullname: 'sulfur',
    radius: 1.8,
    color: {
      r: 255,
      g: 255,
      b: 48
    }
  },
  Cl: {
    shortname: 'Cl',
    fullname: 'chlorine',
    radius: 1.75,
    color: {
      r: 31,
      g: 240,
      b: 31
    }
  },
  Ar: {
    shortname: 'Ar',
    fullname: 'argon',
    radius: 1.88,
    color: {
      r: 128,
      g: 209,
      b: 227
    }
  },
  K: {
    shortname: 'K',
    fullname: 'potassium',
    radius: 2.75,
    color: {
      r: 143,
      g: 64,
      b: 212
    }
  },
  Ca: {
    shortname: 'Ca',
    fullname: 'calcium',
    radius: 2.31,
    color: {
      r: 61,
      g: 255,
      b: 0
    }
  },
  Sc: {
    shortname: 'Sc',
    fullname: 'scandium',
    radius: 2.11,
    color: {
      r: 230,
      g: 230,
      b: 230
    }
  },
  Ti: {
    shortname: 'Ti',
    fullname: 'titanium',
    radius: 2.0,
    color: {
      r: 191,
      g: 194,
      b: 199
    }
  },
  V: {
    shortname: 'V',
    fullname: 'vanadium',
    radius: 2.0,
    color: {
      r: 166,
      g: 166,
      b: 171
    }
  },
  Cr: {
    shortname: 'Cr',
    fullname: 'chromium',
    radius: 2.0,
    color: {
      r: 138,
      g: 153,
      b: 199
    }
  },
  Mn: {
    shortname: 'Mn',
    fullname: 'manganese',
    radius: 2.0,
    color: {
      r: 156,
      g: 122,
      b: 199
    }
  },
  Fe: {
    shortname: 'Fe',
    fullname: 'iron',
    radius: 2.0,
    color: {
      r: 224,
      g: 102,
      b: 51
    }
  },
  Co: {
    shortname: 'Co',
    fullname: 'cobalt',
    radius: 2.0,
    color: {
      r: 240,
      g: 144,
      b: 160
    }
  },
  Ni: {
    shortname: 'Ni',
    fullname: 'nickel',
    radius: 1.63,
    color: {
      r: 80,
      g: 208,
      b: 80
    }
  },
  Cu: {
    shortname: 'Cu',
    fullname: 'copper',
    radius: 1.4,
    color: {
      r: 200,
      g: 128,
      b: 51
    }
  },
  Zn: {
    shortname: 'Zn',
    fullname: 'zinc',
    radius: 1.39,
    color: {
      r: 125,
      g: 128,
      b: 176
    }
  },
  Ga: {
    shortname: 'Ga',
    fullname: 'gallium',
    radius: 1.87,
    color: {
      r: 194,
      g: 143,
      b: 143
    }
  },
  Ge: {
    shortname: 'Ge',
    fullname: 'germanium',
    radius: 2.11,
    color: {
      r: 102,
      g: 143,
      b: 143
    }
  },
  As: {
    shortname: 'As',
    fullname: 'arsenic',
    radius: 1.85,
    color: {
      r: 189,
      g: 128,
      b: 227
    }
  },
  Se: {
    shortname: 'Se',
    fullname: 'selenium',
    radius: 1.9,
    color: {
      r: 255,
      g: 161,
      b: 0
    }
  },
  Br: {
    shortname: 'Br',
    fullname: 'bromine',
    radius: 1.85,
    color: {
      r: 166,
      g: 41,
      b: 41
    }
  },
  Kr: {
    shortname: 'Kr',
    fullname: 'krypton',
    radius: 2.02,
    color: {
      r: 92,
      g: 184,
      b: 209
    }
  },
  Rb: {
    shortname: 'Rb',
    fullname: 'rubidium',
    radius: 3.03,
    color: {
      r: 112,
      g: 46,
      b: 176
    }
  },
  Sr: {
    shortname: 'Sr',
    fullname: 'strontium',
    radius: 2.49,
    color: {
      r: 0,
      g: 255,
      b: 0
    }
  },
  Y: {
    shortname: 'Y',
    fullname: 'yttrium',
    radius: 2.0,
    color: {
      r: 148,
      g: 255,
      b: 255
    }
  },
  Zr: {
    shortname: 'Zr',
    fullname: 'zirconium',
    radius: 2.0,
    color: {
      r: 148,
      g: 224,
      b: 224
    }
  },
  Nb: {
    shortname: 'Nb',
    fullname: 'niobium',
    radius: 2.0,
    color: {
      r: 115,
      g: 194,
      b: 201
    }
  },
  Mo: {
    shortname: 'Mo',
    fullname: 'molybdenum',
    radius: 2.0,
    color: {
      r: 84,
      g: 181,
      b: 181
    }
  },
  Tc: {
    shortname: 'Tc',
    fullname: 'technetium',
    radius: 2.0,
    color: {
      r: 59,
      g: 158,
      b: 158
    }
  },
  Ru: {
    shortname: 'Ru',
    fullname: 'ruthenium',
    radius: 2.0,
    color: {
      r: 36,
      g: 143,
      b: 143
    }
  },
  Rh: {
    shortname: 'Rh',
    fullname: 'rhodium',
    radius: 2.0,
    color: {
      r: 10,
      g: 125,
      b: 140
    }
  },
  Pd: {
    shortname: 'Pd',
    fullname: 'palladium',
    radius: 1.63,
    color: {
      r: 0,
      g: 105,
      b: 133
    }
  },
  Ag: {
    shortname: 'Ag',
    fullname: 'silver',
    radius: 1.72,
    color: {
      r: 192,
      g: 192,
      b: 192
    }
  },
  Cd: {
    shortname: 'Cd',
    fullname: 'cadmium',
    radius: 1.58,
    color: {
      r: 255,
      g: 217,
      b: 143
    }
  },
  In: {
    shortname: 'In',
    fullname: 'indium',
    radius: 1.93,
    color: {
      r: 166,
      g: 117,
      b: 115
    }
  },
  Sn: {
    shortname: 'Sn',
    fullname: 'tin',
    radius: 2.17,
    color: {
      r: 102,
      g: 128,
      b: 128
    }
  },
  Sb: {
    shortname: 'Sb',
    fullname: 'antimony',
    radius: 2.06,
    color: {
      r: 158,
      g: 99,
      b: 181
    }
  },
  Te: {
    shortname: 'Te',
    fullname: 'tellurium',
    radius: 2.06,
    color: {
      r: 212,
      g: 122,
      b: 0
    }
  },
  I: {
    shortname: 'I',
    fullname: 'iodine',
    radius: 1.98,
    color: {
      r: 148,
      g: 0,
      b: 148
    }
  },
  Xe: {
    shortname: 'Xe',
    fullname: 'xenon',
    radius: 2.16,
    color: {
      r: 66,
      g: 158,
      b: 176
    }
  },
  Cs: {
    shortname: 'Cs',
    fullname: 'caesium',
    radius: 3.43,
    color: {
      r: 87,
      g: 23,
      b: 143
    }
  },
  Ba: {
    shortname: 'Ba',
    fullname: 'barium',
    radius: 2.68,
    color: {
      r: 0,
      g: 201,
      b: 0
    }
  },
  La: {
    shortname: 'La',
    fullname: 'lanthanum',
    radius: 2.0,
    color: {
      r: 112,
      g: 212,
      b: 255
    }
  },
  Ce: {
    shortname: 'Ce',
    fullname: 'cerium',
    radius: 2.0,
    color: {
      r: 255,
      g: 255,
      b: 199
    }
  },
  Pr: {
    shortname: 'Pr',
    fullname: 'praseodymium',
    radius: 2.0,
    color: {
      r: 217,
      g: 255,
      b: 199
    }
  },
  Nd: {
    shortname: 'Nd',
    fullname: 'neodymium',
    radius: 2.0,
    color: {
      r: 199,
      g: 255,
      b: 199
    }
  },
  Pm: {
    shortname: 'Pm',
    fullname: 'promethium',
    radius: 2.0,
    color: {
      r: 163,
      g: 255,
      b: 199
    }
  },
  Sm: {
    shortname: 'Sm',
    fullname: 'samarium',
    radius: 2.0,
    color: {
      r: 143,
      g: 255,
      b: 199
    }
  },
  Eu: {
    shortname: 'Eu',
    fullname: 'europium',
    radius: 2.0,
    color: {
      r: 97,
      g: 255,
      b: 199
    }
  },
  Gd: {
    shortname: 'Gd',
    fullname: 'gadolinium',
    radius: 2.0,
    color: {
      r: 69,
      g: 255,
      b: 199
    }
  },
  Tb: {
    shortname: 'Tb',
    fullname: 'terbium',
    radius: 2.0,
    color: {
      r: 48,
      g: 255,
      b: 199
    }
  },
  Dy: {
    shortname: 'Dy',
    fullname: 'dysprosium',
    radius: 2.0,
    color: {
      r: 31,
      g: 255,
      b: 199
    }
  },
  Ho: {
    shortname: 'Ho',
    fullname: 'holmium',
    radius: 2.0,
    color: {
      r: 0,
      g: 255,
      b: 156
    }
  },
  Er: {
    shortname: 'Er',
    fullname: 'erbium',
    radius: 2.0,
    color: {
      r: 0,
      g: 230,
      b: 117
    }
  },
  Tm: {
    shortname: 'Tm',
    fullname: 'thulium',
    radius: 2.0,
    color: {
      r: 0,
      g: 212,
      b: 82
    }
  },
  Yb: {
    shortname: 'Yb',
    fullname: 'ytterbium',
    radius: 2.0,
    color: {
      r: 0,
      g: 191,
      b: 56
    }
  },
  Lu: {
    shortname: 'Lu',
    fullname: 'lutetium',
    radius: 2.0,
    color: {
      r: 0,
      g: 171,
      b: 36
    }
  },
  Hf: {
    shortname: 'Hf',
    fullname: 'hafnium',
    radius: 2.0,
    color: {
      r: 77,
      g: 194,
      b: 255
    }
  },
  Ta: {
    shortname: 'Ta',
    fullname: 'tantalum',
    radius: 2.0,
    color: {
      r: 77,
      g: 166,
      b: 255
    }
  },
  W: {
    shortname: 'W',
    fullname: 'tungsten',
    radius: 2.0,
    color: {
      r: 33,
      g: 148,
      b: 214
    }
  }
};

class SimulationData {
  constructor() {
    this.getFrame = index => {
      const frame = this.frames[index];

      if (this.generateBondsFunction && frame.bonds == null) {
        const bonds = this.generateBondsFunction(frame);

        if (bonds.count > 0) {
          frame.bonds = bonds;
        }
      }

      return frame;
    };

    this.getNumFrames = () => {
      return this.frames.length;
    };

    this.frames = [];
  }

}

class SimulationCell {
  constructor(vector1, vector2, vector3, origin) {
    this.getCenter = () => {
      const center = this.origin.clone().add(this.vector1.clone().multiplyScalar(0.5)).add(this.vector2.clone().multiplyScalar(0.5)).add(this.vector3.clone().multiplyScalar(0.5));
      return center;
    };

    this.getOrigin = () => {
      return this.origin.clone();
    };

    this.getBoundingBox = () => {
      const box = new Box3();
      box.expandByPoint(this.origin.clone().add(this.vector1));
      box.expandByPoint(this.origin.clone().add(this.vector2));
      box.expandByPoint(this.origin.clone().add(this.vector3));
      box.expandByPoint(this.origin);
      return box;
    };

    this.vector1 = vector1;
    this.vector2 = vector2;
    this.vector3 = vector3;
    this.origin = origin;
  }

}

class SimulationDataFrame {
  constructor(particles, simulationCell) {
    this.generateSimulationCell = () => {
      let box = new Box3();

      for (let i = 0; i < this.particles.count; i++) {
        box = box.expandByPoint(this.particles.getPosition(i));
      }

      const size = box.getSize(new Vector3());
      const origin = box.getCenter(new Vector3()).sub(size.clone().multiplyScalar(0.5));
      const simulationCell = new SimulationCell(new Vector3(size.x, 0, 0), new Vector3(0, size.y, 0), new Vector3(0, 0, size.x), origin);
      return simulationCell;
    };

    this.particles = particles;
    const particleTypeMap = {};
    particles.types.forEach(particleType => {
      particleTypeMap[particleType] = true;
    });
    this.particleTypes = Object.keys(particleTypeMap);

    if (simulationCell) {
      this.simulationCell = simulationCell;
    } else {
      this.simulationCell = this.generateSimulationCell();
    }
  }

}

function addParticlesToFrame(lines, i, particles) {
  for (let j = 0; j < particles.capacity; j++) {
    const lineData = lines[i + j].split(/\s+/).filter(Boolean);
    const element = lineData[0];
    const atomType = AtomTypes[element];
    let color = {
      r: 255,
      g: 102,
      b: 102
    };
    let radius = 1.0;

    if (atomType) {
      radius = atomType.radius;
      color = atomType.color;
    }

    const x = parseFloat(lineData[1]);
    const y = parseFloat(lineData[2]);
    const z = parseFloat(lineData[3]);
    particles.add({
      x,
      y,
      z,
      radius,
      r: color.r,
      g: color.g,
      b: color.b,
      type: atomType.shortname
    });
  }
}

const parseXyz = data => {
  let particles;
  const frames = [];
  const lines = data.split('\n');
  const numLines = lines.length;
  let i = 0;
  let skipNextLine = false;
  let readNumParticles = true;

  while (i < numLines) {
    if (lines[i] === '') {
      i++;
      continue;
    }

    if (skipNextLine) {
      skipNextLine = false;
    } else if (readNumParticles) {
      const numParticles = parseInt(lines[i], 10);

      if (isNaN(numParticles)) {
        console.log('Warning, got NaN as numParticles');
        break;
      }

      particles = new Particles(numParticles);
      readNumParticles = false;
      skipNextLine = true;
    } else {
      if (particles) {
        addParticlesToFrame(lines, i, particles);
        const frame = new SimulationDataFrame(particles);
        frames.push(frame);
        i += particles.count - 1;
        readNumParticles = true;
      }
    }

    i++;
  }

  const simulationData = new SimulationData();
  simulationData.frames = frames;
  return simulationData;
};

class BinaryHeap {
  constructor(scoreFunction) {
    this.scoreFunction = scoreFunction;
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  push(element) {
    this.content.push(element);
    this.bubbleUp(this.content.length - 1);
  }

  pop() {
    const result = this.content[0];
    const end = this.content.pop();

    if (end && this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }

    return result;
  }

  peek() {
    return this.content[0];
  }

  remove(element) {
    const len = this.content.length;

    for (let i = 0; i < len; i++) {
      if (this.content[i] === element) {
        const end = this.content.pop();

        if (end && i !== len - 1) {
          this.content[i] = end;

          if (this.scoreFunction(end) < this.scoreFunction(element)) {
            this.bubbleUp(i);
          } else {
            this.sinkDown(i);
          }
        }

        return;
      }
    }

    throw new Error('Node not found.');
  }

  size() {
    return this.content.length;
  }

  bubbleUp(n) {
    const element = this.content[n];

    while (n > 0) {
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.content[parentN];

      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        n = parentN;
      } else {
        break;
      }
    }
  }

  sinkDown(n) {
    const length = this.content.length;
    const element = this.content[n];
    const elemScore = this.scoreFunction(element);
    let child1Score = 0;
    let child2Score = 0;

    while (true) {
      const child2N = (n + 1) * 2;
      const child1N = child2N - 1;
      let swap = null;

      if (child1N < length) {
        const child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);
        if (child1Score < elemScore) swap = child1N;
      }

      if (child2N < length) {
        const child2 = this.content[child2N];
        child2Score = this.scoreFunction(child2);
        if (child2Score < (swap === null ? elemScore : child1Score)) swap = child2N;
      }

      if (swap !== null) {
        this.content[n] = this.content[swap];
        this.content[swap] = element;
        n = swap;
      } else {
        break;
      }
    }
  }

}

const reusableArray = new Float32Array(3);

class Kdtree {
  constructor(points, metric) {
    this.points = points;
    this.metric = metric;
    this.maxDepth = 0;
    this.currentNode = 0;
    const n = points.length / 3;
    const indices = new Uint32Array(n);

    for (let i = 0; i < n; ++i) {
      indices[i] = i;
    }

    this.indices = indices;
    this.nodes = new Int32Array(n * 4);
    this.rootIndex = this.buildTree(0, -1, 0, n);
  }

  buildTree(depth, parent, arrBegin, arrEnd) {
    if (depth > this.maxDepth) this.maxDepth = depth;
    const plength = arrEnd - arrBegin;

    if (plength === 0) {
      return -1;
    }

    const nodeIndex = this.currentNode * 4;
    const nodes = this.nodes;
    this.currentNode += 1;

    if (plength === 1) {
      nodes[nodeIndex] = arrBegin;
      nodes[nodeIndex + 1] = -1;
      nodes[nodeIndex + 2] = -1;
      nodes[nodeIndex + 3] = parent;
      return nodeIndex;
    }

    const indices = this.indices;
    const points = this.points;
    const arrMedian = arrBegin + Math.floor(plength / 2);
    const currentDim = depth % 3;
    let j, tmp, pivotIndex, pivotValue, storeIndex;
    let left = arrBegin;
    let right = arrEnd - 1;

    while (right > left) {
      pivotIndex = left + right >> 1;
      pivotValue = points[indices[pivotIndex] * 3 + currentDim];
      tmp = indices[pivotIndex];
      indices[pivotIndex] = indices[right];
      indices[right] = tmp;
      storeIndex = left;

      for (j = left; j < right; ++j) {
        if (points[indices[j] * 3 + currentDim] < pivotValue) {
          tmp = indices[storeIndex];
          indices[storeIndex] = indices[j];
          indices[j] = tmp;
          ++storeIndex;
        }
      }

      tmp = indices[right];
      indices[right] = indices[storeIndex];
      indices[storeIndex] = tmp;
      pivotIndex = storeIndex;

      if (arrMedian === pivotIndex) {
        break;
      } else if (arrMedian < pivotIndex) {
        right = pivotIndex - 1;
      } else {
        left = pivotIndex + 1;
      }
    }

    nodes[nodeIndex] = arrMedian;
    nodes[nodeIndex + 1] = this.buildTree(depth + 1, nodeIndex, arrBegin, arrMedian);
    nodes[nodeIndex + 2] = this.buildTree(depth + 1, nodeIndex, arrMedian + 1, arrEnd);
    nodes[nodeIndex + 3] = parent;
    return nodeIndex;
  }

  getNodeDepth(nodeIndex) {
    const parentIndex = this.nodes[nodeIndex + 3];
    return parentIndex === -1 ? 0 : this.getNodeDepth(parentIndex) + 1;
  }

  nearest(point, maxNodes, maxDistance) {
    const bestNodes = new BinaryHeap(e => -e[1]);
    const nodes = this.nodes;
    const points = this.points;
    const indices = this.indices;

    const nearestSearch = nodeIndex => {
      let bestChild, otherChild;
      const dimension = this.getNodeDepth(nodeIndex) % 3;
      const pointIndex = indices[nodes[nodeIndex]] * 3;
      const ownPoint = points.subarray(pointIndex, pointIndex + 3);
      const ownDistance = this.metric(point, ownPoint);

      function saveNode(nodeIndex, distance) {
        bestNodes.push([nodeIndex, distance]);

        if (bestNodes.size() > maxNodes) {
          bestNodes.pop();
        }
      }

      const leftIndex = nodes[nodeIndex + 1];
      const rightIndex = nodes[nodeIndex + 2];

      if (rightIndex === -1 && leftIndex === -1) {
        if ((bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) && ownDistance <= maxDistance) {
          saveNode(nodeIndex, ownDistance);
        }

        return;
      }

      if (rightIndex === -1) {
        bestChild = leftIndex;
      } else if (leftIndex === -1) {
        bestChild = rightIndex;
      } else {
        if (point[dimension] <= points[pointIndex + dimension]) {
          bestChild = leftIndex;
        } else {
          bestChild = rightIndex;
        }
      }

      nearestSearch(bestChild);

      if ((bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) && ownDistance <= maxDistance) {
        saveNode(nodeIndex, ownDistance);
      }

      const linearPoint = reusableArray;

      for (let i = 0; i < 3; i += 1) {
        if (i === dimension) {
          linearPoint[i] = point[i];
        } else {
          linearPoint[i] = points[pointIndex + i];
        }
      }

      const linearDistance = this.metric(linearPoint, ownPoint);

      if ((bestNodes.size() < maxNodes || Math.abs(linearDistance) < bestNodes.peek()[1]) && Math.abs(linearDistance) <= maxDistance) {
        if (bestChild === leftIndex) {
          otherChild = rightIndex;
        } else {
          otherChild = leftIndex;
        }

        if (otherChild !== -1) {
          nearestSearch(otherChild);
        }
      }
    };

    nearestSearch(this.rootIndex);
    const result = [];

    for (let i = 0, il = Math.min(bestNodes.size(), maxNodes); i < il; i += 1) {
      result.push(bestNodes.content[i]);
    }

    return result;
  }

  verify(nodeIndex, depth = 0) {
    let count = 1;

    if (nodeIndex === undefined) {
      nodeIndex = this.rootIndex;
    }

    if (nodeIndex === -1) {
      throw new Error('node is null');
    }

    const dim = depth % 3;
    const nodes = this.nodes;
    const points = this.points;
    const indices = this.indices;
    const leftIndex = nodes[nodeIndex + 1];
    const rightIndex = nodes[nodeIndex + 2];

    if (leftIndex !== -1) {
      if (points[indices[nodes[leftIndex]] * 3 + dim] > points[indices[nodes[nodeIndex]] * 3 + dim]) {
        throw new Error('left child is > parent!');
      }

      count += this.verify(leftIndex, depth + 1);
    }

    if (rightIndex !== -1) {
      if (points[indices[nodes[rightIndex]] * 3 + dim] < points[indices[nodes[nodeIndex]] * 3 + dim]) {
        throw new Error('right child is < parent!');
      }

      count += this.verify(rightIndex, depth + 1);
    }

    return count;
  }

}

const createBondsByDistance = ({
  radius: _radius = 0.5,
  pairDistances: _pairDistances = []
}) => {
  return frame => {
    const particles = frame.particles;

    const distance = (a, b) => {
      return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
    };

    const pairDistancesMap = {};

    _pairDistances.forEach(pairDistance => {
      if (pairDistancesMap[pairDistance.type1] == null) {
        pairDistancesMap[pairDistance.type1] = {};
      }

      if (pairDistancesMap[pairDistance.type2] == null) {
        pairDistancesMap[pairDistance.type2] = {};
      }

      pairDistancesMap[pairDistance.type1][pairDistance.type2] = pairDistance.distance;
      pairDistancesMap[pairDistance.type2][pairDistance.type1] = pairDistance.distance;
    });

    const pairs = {};
    var tree = new Kdtree(particles.positions.subarray(0, 3 * particles.count), distance);
    const position1 = [];
    const position2 = [];

    for (let i = 0; i < particles.count; i++) {
      const particle1Type = particles.getType(i);

      if (pairDistancesMap[particle1Type] == null) {
        continue;
      }

      const nearest = tree.nearest(particles.positions.subarray(3 * i, 3 * (i + 1)), 4, 1.4);

      for (let j = 0; j < nearest.length; j++) {
        const nodeIndex = nearest[j][0];
        const index = tree.indices[tree.nodes[nodeIndex]];

        if (index === i) {
          continue;
        }

        const particle2Type = particles.getType(index);

        if (pairDistancesMap[particle1Type][particle2Type] == null) {
          continue;
        }

        const distanceThreshold = pairDistancesMap[particle1Type][particle2Type];
        const _distance = nearest[j][1];

        if (_distance > distanceThreshold) {
          continue;
        }

        const pairKey = index < i ? `${index}-${i}` : `${i}-${index}`;

        if (pairs[pairKey] == null) {
          position1.push(particles.getPosition(i));
          position2.push(particles.getPosition(index));
          pairs[pairKey] = true;
        }
      }
    }

    const bonds = new Bonds(position1.length);

    for (let i = 0; i < position1.length; i++) {
      bonds.add(position1[i].x, position1[i].y, position1[i].z, position2[i].x, position2[i].y, position2[i].z, _radius);
    }

    return bonds;
  };
};

export { Bonds, OMOVIVisualizer, Particles, SimulationData, SimulationDataFrame, createBondsByDistance, parseXyz };
//# sourceMappingURL=index.modern.js.map

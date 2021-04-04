import React, { useRef, useState, useEffect } from 'react';
import { MeshPhongMaterial, Matrix4, Matrix3, WebGLRenderer, Vector3, Vector2, Scene, AmbientLight, DirectionalLight, PerspectiveCamera, Clock, Object3D, Color, PlaneBufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, InstancedMesh, BufferAttribute, Box3 } from 'three';
import ComboControls from '@cognite/three-combo-controls';
import Stats from 'stats.js';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;

  _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

var Material = /*#__PURE__*/function (_THREE$MeshPhongMater) {
  _inheritsLoose(Material, _THREE$MeshPhongMater);

  function Material(materialType, parameters) {
    var _this;

    _this = _THREE$MeshPhongMater.call(this, parameters) || this;
    _this.materialType = materialType;
    _this.uniforms = {};
    _this.extensions = {};
    _this.defines = {};
    return _this;
  }

  var _proto = Material.prototype;

  _proto.copy = function copy(source) {
    MeshPhongMaterial.prototype.copy.call(this, source);
    var castedSource = source;
    this.type = castedSource.type;
    this.defines = _extends({}, castedSource.defines);
    this.extensions = castedSource.extensions;
    this.uniforms = castedSource.uniforms;
    this.onBeforeCompile = castedSource.onBeforeCompile;
    return this;
  };

  _proto.clone = function clone() {
    var material = new MeshPhongMaterial();
    Material.prototype.copy.call(material, this);
    return material;
  };

  return Material;
}(MeshPhongMaterial);

var materialMap = {};

var _fragDepthSupported;

function fragDepthSupported() {
  if (_fragDepthSupported !== undefined) {
    return _fragDepthSupported;
  }

  var renderer = new WebGLRenderer();
  var gl = renderer.domElement.getContext('webgl');

  if (renderer.capabilities.isWebGL2 || gl != null && gl.getExtension('EXT_frag_depth') != null) {
    _fragDepthSupported = true;
  } else {
    _fragDepthSupported = false;
  }

  renderer.dispose();
  return _fragDepthSupported;
}

var createMaterial = function createMaterial(type, vertexShader, fragmentShader) {
  if (materialMap[type] != null) {
    return materialMap[type];
  }

  var material = new Material(type, {
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

  material.onBeforeCompile = function (shader) {
    Object.assign(shader.uniforms, material.uniforms);
    material.uniforms = shader.uniforms;
    shader.vertexShader = vertexShader;
    shader.fragmentShader = fragmentShader;
  };

  material.onBeforeCompile.toString = function () {
    return type;
  };

  materialMap[type] = material;
  return material;
};

var inverseModelMatrix = new Matrix4();
var modelViewMatrix = new Matrix4();
var normalMatrix = new Matrix3();
var inverseNormalMatrix = new Matrix3();

var adjustCamera = function adjustCamera(camera, width, height) {
  if (camera instanceof PerspectiveCamera) {
    camera.aspect = width / height;
  }

  camera.updateProjectionMatrix();
};

var Visualizer = function Visualizer(domElement) {
  var _this = this;

  this.add = function (object) {
    if (object == null) {
      return;
    }

    if (object.material instanceof Material) {
      var material = object.material;
      var materialType = material.type;

      if (_this.materials[materialType] == null) {
        _this.materials[materialType] = material;
      }
    }

    _this.object.add(object);
  };

  this.remove = function (object) {
    _this.object.remove(object);
  };

  this.setupLights = function (ambientLight, directionalLight, scene) {
    ambientLight.intensity = 0.3;
    directionalLight.intensity = 0.7;
    scene.add(directionalLight);
    scene.add(ambientLight);
  };

  this.setupCanvas = function (canvas) {
    canvas.style.width = '640px';
    canvas.style.height = '480px';
    canvas.style.minWidth = '100%';
    canvas.style.minHeight = '100%';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
  };

  this.setupCamera = function (camera) {
    camera.position.set(10, 10, 10);
    camera.lookAt(new Vector3(0, 0, 0));
  };

  this.updateUniforms = function (camera) {
    _this.object.matrixWorld.copy(_this.object.matrixWorld).invert();

    modelViewMatrix.copy(camera.matrixWorldInverse).multiply(_this.object.matrixWorld);
    normalMatrix.getNormalMatrix(modelViewMatrix);
    inverseNormalMatrix.copy(normalMatrix).invert();
    Object.values(_this.materials).forEach(function (material) {
      if (material.uniforms.inverseModelMatrix != null) {
        material.uniforms.inverseModelMatrix.value.copy(inverseModelMatrix);
      }

      if (material.uniforms.inverseNormalMatrix != null) {
        material.uniforms.inverseNormalMatrix.value.copy(inverseNormalMatrix);
      }
    });
  };

  this.dispose = function () {
    _this.domElement.removeChild(_this.canvas);

    _this.renderer.dispose();
  };

  this.getCameraPosition = function () {
    return _this.controls.getState().position;
  };

  this.getCameraTarget = function () {
    return _this.controls.getState().target;
  };

  this.setCameraPosition = function (position) {
    _this.controls.setState(position, _this.getCameraTarget());
  };

  this.setCameraTarget = function (target) {
    _this.controls.setState(_this.getCameraPosition(), target);
  };

  this.animate = function () {
    _this.memoryStats.update();

    _this.cpuStats.begin();

    _this.resizeIfNeeded();

    _this.controls.update(_this.clock.getDelta());

    _this.updateUniforms(_this.camera);

    _this.renderer.render(_this.scene, _this.camera);

    _this.cpuStats.end();

    _this.latestRequestId = requestAnimationFrame(_this.animate.bind(_this));
  };

  this.resizeIfNeeded = function () {
    var maxTextureSize = 1.4e6;

    var rendererSize = _this.renderer.getSize(new Vector2());

    var rendererPixelWidth = rendererSize.width;
    var rendererPixelHeight = rendererSize.height;
    var clientWidth = _this.domElement.clientWidth !== 0 ? _this.domElement.clientWidth : _this.canvas.clientWidth;
    var clientHeight = _this.domElement.clientHeight !== 0 ? _this.domElement.clientHeight : _this.canvas.clientHeight;
    var clientPixelWidth = window.devicePixelRatio * clientWidth;
    var clientPixelHeight = window.devicePixelRatio * clientHeight;
    var clientTextureSize = clientPixelWidth * clientPixelHeight;
    var scale = clientTextureSize > maxTextureSize ? Math.sqrt(maxTextureSize / clientTextureSize) : 1;
    var width = clientPixelWidth * scale;
    var height = clientPixelHeight * scale;
    var maxError = 0.1;
    var isOptimalSize = Math.abs(rendererPixelWidth - width) < maxError && Math.abs(rendererPixelHeight - height) < maxError;

    if (isOptimalSize) {
      return false;
    }

    _this.renderer.setSize(width, height);

    adjustCamera(_this.camera, width, height);
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
  this.cpuStats = new Stats();
  this.memoryStats = new Stats();
  this.cpuStats.showPanel(0);
  this.memoryStats.showPanel(2);
  document.body.appendChild(this.cpuStats.dom);
  this.cpuStats.domElement.style.cssText = 'position:absolute;top:0px;right:80px;';
  this.memoryStats.domElement.style.cssText = 'position:absolute;top:0px;right:0px;';
  document.body.appendChild(this.memoryStats.dom);
  this.materials = {};
  this.animate();
};

var newVisualizer;

var OMOVIVisualizer = function OMOVIVisualizer(_ref) {
  var particles = _ref.particles,
      bonds = _ref.bonds,
      cameraTarget = _ref.cameraTarget,
      cameraPosition = _ref.cameraPosition;
  var domElement = useRef(null);

  var _useState = useState(undefined),
      visualizer = _useState[0],
      setVisualizer = _useState[1];

  useEffect(function () {
    if (domElement.current && !newVisualizer) {
      newVisualizer = new Visualizer(domElement.current);
      setVisualizer(newVisualizer);
    }
  }, [domElement, visualizer]);
  var prevParticlesRef = useRef();
  useEffect(function () {
    prevParticlesRef.current = particles;
  });
  var prevParticles = prevParticlesRef.current;
  var prevBondsRef = useRef();
  useEffect(function () {
    prevBondsRef.current = bonds;
  });
  var prevBonds = prevBondsRef.current;
  useEffect(function () {
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
  useEffect(function () {
    if (visualizer) {
      if (cameraTarget) {
        visualizer.setCameraTarget(cameraTarget);
      }
    }
  }, [cameraTarget, visualizer]);
  useEffect(function () {
    if (visualizer) {
      if (cameraPosition) {
        visualizer.setCameraPosition(cameraPosition);
      }
    }
  }, [cameraPosition, visualizer]);
  useEffect(function () {
    console.log('Will create visualizer');
    return function () {
      console.log('Should dispose visualizer');
      newVisualizer = undefined;
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

var fragmentShader = "\n#define PHONG\n\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n\nuniform mat4 projectionMatrix;\nvarying vec3 vSurfacePoint;\nvarying vec3 vCenter;\nvarying float vRadius;\n\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\nvoid main() {\n\n\t#include <clipping_planes_fragment>\n\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\n\tvec3 rayTarget = vSurfacePoint;\n\tvec3 rayDirection = normalize(rayTarget); // rayOrigin is (0,0,0) in camera space\n\n\tvec3 diff = rayTarget - vCenter.xyz;\n    vec3 E = diff;\n    vec3 D = rayDirection;\n\n    float a = dot(D, D);\n    float b = dot(E, D);\n    float c = dot(E, E) - vRadius*vRadius;\n\n    // discriminant of sphere equation (factor 2 removed from b above)\n    float d = b*b - a*c;\n    if(d < 0.0)\n        discard;\n\t\n    float sqrtd = sqrt(d);\n    float dist1 = (-b - sqrtd)/a;\n    float dist2 = (-b + sqrtd)/a;\n\n    // Make sure dist1 is the smaller one\n    if (dist2 < dist1) {\n        float tmp = dist1;\n        dist1 = dist2;\n        dist2 = tmp;\n    }\n\n    float dist = dist1;\n    float intersectionPointZ = E.z + dist*D.z;\n\tvec3 p = rayTarget + dist*rayDirection;\n\n\t// Find normal vector in local space\n    normal = normalize(vec3(p - vCenter.xyz));\n    // Transform into camera space\n    if (dot(normal, rayDirection) >  0.) {\n        normal = -normal;\n    }\n\n#ifdef FRAG_DEPTH\n\tfloat projectedIntersection_z = projectionMatrix[0][2]*p.x + projectionMatrix[1][2]*p.y + projectionMatrix[2][2]*p.z + projectionMatrix[3][2];\n\tfloat projectedIntersection_w = projectionMatrix[0][3]*p.x + projectionMatrix[1][3]*p.y + projectionMatrix[2][3]*p.z + projectionMatrix[3][3];\n\tgl_FragDepthEXT = ((gl_DepthRange.diff * (projectedIntersection_z / projectedIntersection_w)) + gl_DepthRange.near + gl_DepthRange.far) * 0.5;\n#endif\n\n\t#include <emissivemap_fragment>\n\n\t// accumulation\n\t#include <lights_phong_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\n\t// modulation\n\t#include <aomap_fragment>\n\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\n\t#include <envmap_fragment>\n\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n\n}\n";

var vertexShader = "\n#define PHONG\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n\n\tvarying vec3 vNormal;\n\n#endif\n\nuniform mat4 inverseModelMatrix;\nattribute vec3 particlePosition;\nattribute float particleRadius;\n\nvarying vec3 vSurfacePoint;\nvarying vec3 vCenter;\nvarying float vRadius;\n\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvec3 makePerpendicular(vec3 v) {\n    if(v.x == 0.0 && v.y == 0.0) {\n        if(v.z == 0.0) {\n            return vec3(0.0, 0.0, 0.0);\n        }\n        return vec3(0.0, 1.0, 0.0);\n    }\n    return vec3(-v.y, v.x, 0.0);\n}\n\nvec3 mul3(mat4 M, vec3 v) {\n\tvec4 u = M * vec4(v, 1.0);\n\treturn u.xyz / u.w;\n}\n\nvoid main() {\n\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n\n\tvNormal = normalize( transformedNormal );\n\n#endif\n\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t\n    vec4 mvPosition = vec4( transformed, 1.0 );\n\n    #ifdef USE_INSTANCING\n\n\tvec3 objectToCameraModelSpace = (inverseModelMatrix*vec4(particlePosition - cameraPosition, 1.0)).xyz;\n    vec3 view = normalize(objectToCameraModelSpace);\n    vec3 right = normalize(makePerpendicular(view));\n    vec3 up = cross(right, view);\n\t\n\t// Factor 2.0 is because geometry is 0.5x\n\tvec3 displacement = 2.0*particleRadius*(position.x * right + position.y * up);\n\t// particlePosition + displacement is the current vertex, also move closer to camera so billboard covers the sphere\n\ttransformed = particlePosition + displacement - particleRadius * view;\n\t\n\tvSurfacePoint = mul3(modelViewMatrix, transformed);\n    vCenter = mul3(modelViewMatrix, particlePosition);\n\tvRadius = particleRadius;\n    #endif\n\n    mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n    gl_Position = projectionMatrix * mvPosition;\n\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\n\tvViewPosition = - mvPosition.xyz;\n\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n\n}\n";

var Particles = /*#__PURE__*/function () {
  function Particles(capacity) {
    var _this = this;

    this.getRadius = function (index) {
      return _this.radii[index];
    };

    this.getPosition = function (index) {
      return new Vector3(_this.positions[3 * index + 0], _this.positions[3 * index + 1], _this.positions[3 * index + 2]);
    };

    this.getType = function (index) {
      return _this.types[index];
    };

    this.getGeometry = function () {
      var baseGeometry = new PlaneBufferGeometry(1, 1, 1, 1);
      var geometry = new InstancedBufferGeometry();
      geometry.instanceCount = _this.count;
      geometry.setIndex(baseGeometry.getIndex());
      geometry.setAttribute('position', baseGeometry.getAttribute('position'));
      geometry.setAttribute('normal', baseGeometry.getAttribute('normal'));
      geometry.setAttribute('particlePosition', new InstancedBufferAttribute(_this.positions, 3, false, 1));
      geometry.setAttribute('particleRadius', new InstancedBufferAttribute(_this.radii, 1, false, 1));
      return geometry;
    };

    this.getMesh = function () {
      if (_this.mesh != null) {
        return _this.mesh;
      }

      var geometry = _this.getGeometry();

      var material = createMaterial('particle', vertexShader, fragmentShader);
      _this.mesh = new InstancedMesh(geometry, material, _this.count);
      var matrix = new Matrix4();

      for (var i = 0; i < _this.count; i++) {
        _this.mesh.setMatrixAt(i, matrix);

        _this.mesh.setColorAt(i, _this.colors[i]);
      }

      _this.mesh.frustumCulled = false;
      return _this.mesh;
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

  var _proto = Particles.prototype;

  _proto.add = function add(_ref) {
    var x = _ref.x,
        y = _ref.y,
        z = _ref.z,
        radius = _ref.radius,
        _ref$type = _ref.type,
        type = _ref$type === void 0 ? 'H' : _ref$type,
        _ref$r = _ref.r,
        r = _ref$r === void 0 ? 255.0 : _ref$r,
        _ref$g = _ref.g,
        g = _ref$g === void 0 ? 0.0 : _ref$g,
        _ref$b = _ref.b,
        b = _ref$b === void 0 ? 0.0 : _ref$b;

    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full");
      return;
    }

    var index = this.count;
    this.positions[3 * index + 0] = x;
    this.positions[3 * index + 1] = y;
    this.positions[3 * index + 2] = z;
    this.colors.push(new Color(r / 255, g / 255, b / 255));
    this.radii[index] = radius * 0.25;
    this.indices[index] = index;
    this.types.push(type);
    this.count += 1;
  };

  return Particles;
}();

var fragmentShader$1 = "\n#define PHONG\n\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\n\nuniform mat4 projectionMatrix;\nvarying vec4 v_position1;\nvarying vec4 v_position2;\nvarying vec4 U;\nvarying vec4 V;\nvarying vec4 axis;\nvarying float height;\n\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_pars_fragment>\n#include <cube_uv_reflection_fragment>\n#include <fog_pars_fragment>\n#include <bsdfs>\n#include <lights_pars_begin>\n#include <lights_phong_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\nvoid main() {\n\n\t#include <clipping_planes_fragment>\n\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\n\t#include <logdepthbuf_fragment>\n\t#include <map_fragment>\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <specularmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\n\tmat3 basis = mat3(U.xyz, V.xyz, axis.xyz);\n    vec3 surfacePoint = vec3(U.w, V.w, axis.w);\n    vec3 rayTarget = surfacePoint;\n\tvec3 rayDirection = normalize(rayTarget); // rayOrigin is (0,0,0) in camera space\n\n\tvec3 diff = rayTarget - v_position2.xyz;\n    vec3 E = diff * basis;\n    float L = height;\n    vec3 D = rayDirection * basis;\n\n    float R1 = v_position1.w;\n    float R2 = v_position2.w;\n    float dR = R2 - R1;\n\n    float a = dot(D.xy, D.xy);\n    float b = dot(E.xy, D.xy);\n    float c = dot(E.xy, E.xy)-R1*R1;\n    float L2Inv = 1.0/(L*L);\n\n\t// Calculate a dicriminant of the above quadratic equation (factor 2 removed from all b-terms above)\n    float d = b*b - a*c;\n\n    // d < 0.0 means the ray hits outside an infinitely long eccentric cone\n    if (d < 0.0) {\n\t\tdiscard;\n    }\n\n\tfloat sqrtd = sqrt(d);\n    float dist1 = (-b - sqrtd)/a;\n    float dist2 = (-b + sqrtd)/a;\n\n    // Make sure dist1 is the smaller one\n    if (dist2 < dist1) {\n      float tmp = dist1;\n      dist1 = dist2;\n      dist2 = tmp;\n    }\n\n\t// Check the smallest root, it is closest camera. Only test if the z-component is outside the truncated eccentric cone\n    float dist = dist1;\n    float intersectionPointZ = E.z + dist*D.z;\n    // Intersection point in camera space\n    vec3 p = rayTarget + dist*rayDirection;\n    bool isInner = false;\n\n    if (intersectionPointZ <= 0.0 ||\n      intersectionPointZ >= L\n      ) {\n      // Either intersection point is behind starting point (happens inside the cone),\n      // or the intersection point is outside the end caps. This is not a valid solution.\n      isInner = true;\n      dist = dist2;\n      intersectionPointZ = E.z + dist*D.z;\n      p = rayTarget + dist*rayDirection;\n\n      if (intersectionPointZ <= 0.0 ||\n        intersectionPointZ >= L\n      ) {\n        // Missed the other point too\n\t\tdiscard;\n      }\n    }\n\n\t// Find normal vector\n    vec3 n = normalize(-axis.xyz);\n    vec3 position1 = v_position1.xyz;\n    vec3 position2 = v_position2.xyz;\n    vec3 A = cross(position1 - p, position2 - p);\n\n    vec3 t = normalize(cross(n, A));\n    vec3 o1 = position1 + R1 * t;\n    vec3 o2 = position2 + R2 * t;\n    vec3 B = o2-o1;\n    normal = normalize(cross(A, B));\n\n#ifdef FRAG_DEPTH\n\tfloat projectedIntersection_z = projectionMatrix[0][2]*p.x + projectionMatrix[1][2]*p.y + projectionMatrix[2][2]*p.z + projectionMatrix[3][2];\n\tfloat projectedIntersection_w = projectionMatrix[0][3]*p.x + projectionMatrix[1][3]*p.y + projectionMatrix[2][3]*p.z + projectionMatrix[3][3];\n\tgl_FragDepthEXT = ((gl_DepthRange.diff * (projectedIntersection_z / projectedIntersection_w)) + gl_DepthRange.near + gl_DepthRange.far) * 0.5;\n#endif\n\n\t#include <emissivemap_fragment>\n\n\t// accumulation\n\t#include <lights_phong_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\n\t// modulation\n\t#include <aomap_fragment>\n\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\n\t#include <envmap_fragment>\n\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n  \n}\n\n";

var vertexShader$1 = "\n#define PHONG\n\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n\n\tvarying vec3 vNormal;\n\n#endif\n\nuniform mat4 inverseModelMatrix;\nattribute vec3 position1;\nattribute vec3 position2;\nattribute float bondRadius;\n\nvarying vec4 v_position1;\nvarying vec4 v_position2;\n\n// U, V, axis represent the 3x3 cone basis.\n// They are vec4 to pack extra data into the w-component\n// since Safari on iOS only supports 8 varying vec4 registers.\nvarying vec4 U;\nvarying vec4 V;\nvarying vec4 axis;\nvarying float height;\n\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvec3 mul3(mat4 M, vec3 v) {\n\tvec4 u = M * vec4(v, 1.0);\n\treturn u.xyz / u.w;\n}\n\nvoid main() {\n\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n\n#ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n\n\tvNormal = normalize( transformedNormal );\n\n#endif\n\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\n\tvec4 mvPosition = vec4( transformed, 1.0 );\n\n    // vec3 center = 0.5 * (position1 + position2);\n\tvec3 center = (inverseModelMatrix*vec4(0.5 * (position1 + position2), 1.0)).xyz;\n\theight = length(position2-position1);\n    vec3 newPosition = position;\n\t\n    vec3 objectToCameraModelSpace = (inverseModelMatrix*vec4(cameraPosition - center, 1.0)).xyz;\n\t\n    vec3 lDir = normalize(position1-position2);\n\tfloat dirSign = 1.0;\n    if (dot(objectToCameraModelSpace, lDir) < 0.0) { // direction vector looks away, flip it\n      dirSign = -1.0;\n      lDir *= -1.;\n    }\n\n    vec3 left = normalize(cross(objectToCameraModelSpace, lDir));\n    vec3 up = normalize(cross(left, lDir));\n\n\t// compute basis for cylinder\n    axis.xyz = lDir * dirSign;\n    U.xyz = cross(objectToCameraModelSpace, axis.xyz);\n    V.xyz = cross(U.xyz, axis.xyz);\n    // Transform to camera space\n    axis.xyz = normalize(normalMatrix * axis.xyz);\n    U.xyz = normalize(normalMatrix * U.xyz);\n    V.xyz = normalize(normalMatrix * V.xyz);\n\n\tv_position1.xyz = mul3(viewMatrix, mul3(modelMatrix, position1));\n    v_position2.xyz = mul3(viewMatrix, mul3(modelMatrix, position2));\n\n    // Pack radii as w components of v_centerA and v_centerB\n    v_position1.w = bondRadius;\n    v_position2.w = bondRadius;\n\n\tvec3 surfacePoint = center + mat3(0.5 * height * lDir, bondRadius * left, bondRadius * up) * newPosition;\n    transformed = surfacePoint;\n\n\tsurfacePoint = mul3(modelViewMatrix, surfacePoint);\n\n\t// We pack surfacePoint as w-components of U, V and axis\n    U.w = surfacePoint.x;\n    V.w = surfacePoint.y;\n    axis.w = surfacePoint.z;\n\n    mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n    gl_Position = projectionMatrix * mvPosition;\n\t\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\n\tvViewPosition = - mvPosition.xyz;\n\n\t#include <worldpos_vertex>\n\t#include <envmap_vertex>\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n\n}\n";

var Bonds = /*#__PURE__*/function () {
  function Bonds(capacity) {
    var _this = this;

    this.getRadius = function (index) {
      return _this.radii[index];
    };

    this.getPosition1 = function (index) {
      return new Vector3(_this.positions1[3 * index + 0], _this.positions1[3 * index + 1], _this.positions1[3 * index + 2]);
    };

    this.getGeometry = function () {
      var positions = [];
      positions.push(-1, 1, -1);
      positions.push(-1, -1, -1);
      positions.push(1, 1, -1);
      positions.push(1, -1, -1);
      positions.push(1, 1, 1);
      positions.push(1, -1, 1);
      var positionBufferAttribute = new BufferAttribute(new Float32Array(positions), 3);
      var indexBufferAttribute = new BufferAttribute(new Uint16Array([1, 2, 0, 1, 3, 2, 3, 4, 2, 3, 5, 4]), 1);
      var geometry = new InstancedBufferGeometry();
      geometry.instanceCount = _this.count;
      geometry.setIndex(indexBufferAttribute);
      geometry.setAttribute('position', positionBufferAttribute);
      geometry.setAttribute('normal', positionBufferAttribute);
      geometry.setAttribute('position1', new InstancedBufferAttribute(_this.positions1, 3, false, 1));
      geometry.setAttribute('position2', new InstancedBufferAttribute(_this.positions2, 3, false, 1));
      geometry.setAttribute('bondRadius', new InstancedBufferAttribute(_this.radii, 1, false, 1));
      return geometry;
    };

    this.getMesh = function () {
      if (_this.mesh != null) {
        return _this.mesh;
      }

      if (_this.count === 0) {
        return null;
      }

      var geometry = _this.getGeometry();

      var material = createMaterial('bonds', vertexShader$1, fragmentShader$1);
      _this.mesh = new InstancedMesh(geometry, material, _this.count);
      var matrix = new Matrix4();

      for (var i = 0; i < _this.count; i++) {
        _this.mesh.setMatrixAt(i, matrix);

        _this.mesh.setColorAt(i, _this.colors[i]);
      }

      _this.mesh.frustumCulled = false;
      return _this.mesh;
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

  var _proto = Bonds.prototype;

  _proto.add = function add(x1, y1, z1, x2, y2, z2, radius, r, g, b) {
    if (r === void 0) {
      r = 255.0;
    }

    if (g === void 0) {
      g = 255.0;
    }

    if (b === void 0) {
      b = 255.0;
    }

    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full");
      return;
    }

    var index = this.count;
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
  };

  return Bonds;
}();

var AtomTypes = {
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

var SimulationData = function SimulationData() {
  var _this = this;

  this.getFrame = function (index) {
    var frame = _this.frames[index];

    if (_this.generateBondsFunction && frame.bonds == null) {
      var bonds = _this.generateBondsFunction(frame);

      if (bonds.count > 0) {
        frame.bonds = bonds;
      }
    }

    return frame;
  };

  this.getNumFrames = function () {
    return _this.frames.length;
  };

  this.frames = [];
};

var SimulationCell = function SimulationCell(vector1, vector2, vector3, origin) {
  var _this = this;

  this.getCenter = function () {
    var center = _this.origin.clone().add(_this.vector1.clone().multiplyScalar(0.5)).add(_this.vector2.clone().multiplyScalar(0.5)).add(_this.vector3.clone().multiplyScalar(0.5));

    return center;
  };

  this.getOrigin = function () {
    return _this.origin.clone();
  };

  this.getBoundingBox = function () {
    var box = new Box3();
    box.expandByPoint(_this.origin.clone().add(_this.vector1));
    box.expandByPoint(_this.origin.clone().add(_this.vector2));
    box.expandByPoint(_this.origin.clone().add(_this.vector3));
    box.expandByPoint(_this.origin);
    return box;
  };

  this.vector1 = vector1;
  this.vector2 = vector2;
  this.vector3 = vector3;
  this.origin = origin;
};

var SimulationDataFrame = function SimulationDataFrame(particles, simulationCell) {
  var _this = this;

  this.generateSimulationCell = function () {
    var box = new Box3();

    for (var i = 0; i < _this.particles.count; i++) {
      box = box.expandByPoint(_this.particles.getPosition(i));
    }

    var size = box.getSize(new Vector3());
    var origin = box.getCenter(new Vector3()).sub(size.clone().multiplyScalar(0.5));
    var simulationCell = new SimulationCell(new Vector3(size.x, 0, 0), new Vector3(0, size.y, 0), new Vector3(0, 0, size.x), origin);
    return simulationCell;
  };

  this.particles = particles;
  var particleTypeMap = {};
  particles.types.forEach(function (particleType) {
    particleTypeMap[particleType] = true;
  });
  this.particleTypes = Object.keys(particleTypeMap);

  if (simulationCell) {
    this.simulationCell = simulationCell;
  } else {
    this.simulationCell = this.generateSimulationCell();
  }
};

function addParticlesToFrame(lines, i, particles) {
  for (var j = 0; j < particles.capacity; j++) {
    var lineData = lines[i + j].split(/\s+/).filter(Boolean);
    var element = lineData[0];
    var atomType = AtomTypes[element];
    var color = {
      r: 255,
      g: 102,
      b: 102
    };
    var radius = 1.0;

    if (atomType) {
      radius = atomType.radius;
      color = atomType.color;
    }

    var x = parseFloat(lineData[1]);
    var y = parseFloat(lineData[2]);
    var z = parseFloat(lineData[3]);
    particles.add({
      x: x,
      y: y,
      z: z,
      radius: radius,
      r: color.r,
      g: color.g,
      b: color.b,
      type: atomType.shortname
    });
  }
}

var parseXyz = function parseXyz(data) {
  var particles;
  var frames = [];
  var lines = data.split('\n');
  var numLines = lines.length;
  var i = 0;
  var skipNextLine = false;
  var readNumParticles = true;

  while (i < numLines) {
    if (lines[i] === '') {
      i++;
      continue;
    }

    if (skipNextLine) {
      skipNextLine = false;
    } else if (readNumParticles) {
      var numParticles = parseInt(lines[i], 10);

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
        var frame = new SimulationDataFrame(particles);
        frames.push(frame);
        i += particles.count - 1;
        readNumParticles = true;
      }
    }

    i++;
  }

  var simulationData = new SimulationData();
  simulationData.frames = frames;
  return simulationData;
};

var BinaryHeap = /*#__PURE__*/function () {
  function BinaryHeap(scoreFunction) {
    this.scoreFunction = scoreFunction;
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  var _proto = BinaryHeap.prototype;

  _proto.push = function push(element) {
    this.content.push(element);
    this.bubbleUp(this.content.length - 1);
  };

  _proto.pop = function pop() {
    var result = this.content[0];
    var end = this.content.pop();

    if (end && this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }

    return result;
  };

  _proto.peek = function peek() {
    return this.content[0];
  };

  _proto.remove = function remove(element) {
    var len = this.content.length;

    for (var i = 0; i < len; i++) {
      if (this.content[i] === element) {
        var end = this.content.pop();

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
  };

  _proto.size = function size() {
    return this.content.length;
  };

  _proto.bubbleUp = function bubbleUp(n) {
    var element = this.content[n];

    while (n > 0) {
      var parentN = Math.floor((n + 1) / 2) - 1;
      var parent = this.content[parentN];

      if (this.scoreFunction(element) < this.scoreFunction(parent)) {
        this.content[parentN] = element;
        this.content[n] = parent;
        n = parentN;
      } else {
        break;
      }
    }
  };

  _proto.sinkDown = function sinkDown(n) {
    var length = this.content.length;
    var element = this.content[n];
    var elemScore = this.scoreFunction(element);
    var child1Score = 0;
    var child2Score = 0;

    while (true) {
      var child2N = (n + 1) * 2;
      var child1N = child2N - 1;
      var swap = null;

      if (child1N < length) {
        var child1 = this.content[child1N];
        child1Score = this.scoreFunction(child1);
        if (child1Score < elemScore) swap = child1N;
      }

      if (child2N < length) {
        var child2 = this.content[child2N];
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
  };

  return BinaryHeap;
}();

var reusableArray = new Float32Array(3);

var Kdtree = /*#__PURE__*/function () {
  function Kdtree(points, metric) {
    this.points = points;
    this.metric = metric;
    this.maxDepth = 0;
    this.currentNode = 0;
    var n = points.length / 3;
    var indices = new Uint32Array(n);

    for (var i = 0; i < n; ++i) {
      indices[i] = i;
    }

    this.indices = indices;
    this.nodes = new Int32Array(n * 4);
    this.rootIndex = this.buildTree(0, -1, 0, n);
  }

  var _proto = Kdtree.prototype;

  _proto.buildTree = function buildTree(depth, parent, arrBegin, arrEnd) {
    if (depth > this.maxDepth) this.maxDepth = depth;
    var plength = arrEnd - arrBegin;

    if (plength === 0) {
      return -1;
    }

    var nodeIndex = this.currentNode * 4;
    var nodes = this.nodes;
    this.currentNode += 1;

    if (plength === 1) {
      nodes[nodeIndex] = arrBegin;
      nodes[nodeIndex + 1] = -1;
      nodes[nodeIndex + 2] = -1;
      nodes[nodeIndex + 3] = parent;
      return nodeIndex;
    }

    var indices = this.indices;
    var points = this.points;
    var arrMedian = arrBegin + Math.floor(plength / 2);
    var currentDim = depth % 3;
    var j, tmp, pivotIndex, pivotValue, storeIndex;
    var left = arrBegin;
    var right = arrEnd - 1;

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
  };

  _proto.getNodeDepth = function getNodeDepth(nodeIndex) {
    var parentIndex = this.nodes[nodeIndex + 3];
    return parentIndex === -1 ? 0 : this.getNodeDepth(parentIndex) + 1;
  };

  _proto.nearest = function nearest(point, maxNodes, maxDistance) {
    var _this = this;

    var bestNodes = new BinaryHeap(function (e) {
      return -e[1];
    });
    var nodes = this.nodes;
    var points = this.points;
    var indices = this.indices;

    var nearestSearch = function nearestSearch(nodeIndex) {
      var bestChild, otherChild;
      var dimension = _this.getNodeDepth(nodeIndex) % 3;
      var pointIndex = indices[nodes[nodeIndex]] * 3;
      var ownPoint = points.subarray(pointIndex, pointIndex + 3);

      var ownDistance = _this.metric(point, ownPoint);

      function saveNode(nodeIndex, distance) {
        bestNodes.push([nodeIndex, distance]);

        if (bestNodes.size() > maxNodes) {
          bestNodes.pop();
        }
      }

      var leftIndex = nodes[nodeIndex + 1];
      var rightIndex = nodes[nodeIndex + 2];

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

      var linearPoint = reusableArray;

      for (var i = 0; i < 3; i += 1) {
        if (i === dimension) {
          linearPoint[i] = point[i];
        } else {
          linearPoint[i] = points[pointIndex + i];
        }
      }

      var linearDistance = _this.metric(linearPoint, ownPoint);

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
    var result = [];

    for (var i = 0, il = Math.min(bestNodes.size(), maxNodes); i < il; i += 1) {
      result.push(bestNodes.content[i]);
    }

    return result;
  };

  _proto.verify = function verify(nodeIndex, depth) {
    if (depth === void 0) {
      depth = 0;
    }

    var count = 1;

    if (nodeIndex === undefined) {
      nodeIndex = this.rootIndex;
    }

    if (nodeIndex === -1) {
      throw new Error('node is null');
    }

    var dim = depth % 3;
    var nodes = this.nodes;
    var points = this.points;
    var indices = this.indices;
    var leftIndex = nodes[nodeIndex + 1];
    var rightIndex = nodes[nodeIndex + 2];

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
  };

  return Kdtree;
}();

var createBondsByDistance = function createBondsByDistance(_ref) {
  var _ref$radius = _ref.radius,
      radius = _ref$radius === void 0 ? 0.5 : _ref$radius,
      _ref$pairDistances = _ref.pairDistances,
      pairDistances = _ref$pairDistances === void 0 ? [] : _ref$pairDistances;
  return function (frame) {
    var particles = frame.particles;

    var distance = function distance(a, b) {
      return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
    };

    var pairDistancesMap = {};
    pairDistances.forEach(function (pairDistance) {
      if (pairDistancesMap[pairDistance.type1] == null) {
        pairDistancesMap[pairDistance.type1] = {};
      }

      if (pairDistancesMap[pairDistance.type2] == null) {
        pairDistancesMap[pairDistance.type2] = {};
      }

      pairDistancesMap[pairDistance.type1][pairDistance.type2] = pairDistance.distance;
      pairDistancesMap[pairDistance.type2][pairDistance.type1] = pairDistance.distance;
    });
    var pairs = {};
    var tree = new Kdtree(particles.positions.subarray(0, 3 * particles.count), distance);
    var position1 = [];
    var position2 = [];

    for (var i = 0; i < particles.count; i++) {
      var particle1Type = particles.getType(i);

      if (pairDistancesMap[particle1Type] == null) {
        continue;
      }

      var nearest = tree.nearest(particles.positions.subarray(3 * i, 3 * (i + 1)), 4, 1.4);

      for (var j = 0; j < nearest.length; j++) {
        var nodeIndex = nearest[j][0];
        var index = tree.indices[tree.nodes[nodeIndex]];

        if (index === i) {
          continue;
        }

        var particle2Type = particles.getType(index);

        if (pairDistancesMap[particle1Type][particle2Type] == null) {
          continue;
        }

        var distanceThreshold = pairDistancesMap[particle1Type][particle2Type];
        var _distance = nearest[j][1];

        if (_distance > distanceThreshold) {
          continue;
        }

        var pairKey = index < i ? index + "-" + i : i + "-" + index;

        if (pairs[pairKey] == null) {
          position1.push(particles.getPosition(i));
          position2.push(particles.getPosition(index));
          pairs[pairKey] = true;
        }
      }
    }

    var bonds = new Bonds(position1.length);

    for (var _i = 0; _i < position1.length; _i++) {
      bonds.add(position1[_i].x, position1[_i].y, position1[_i].z, position2[_i].x, position2[_i].y, position2[_i].z, radius);
    }

    return bonds;
  };
};

export { Bonds, OMOVIVisualizer, Particles, SimulationData, SimulationDataFrame, createBondsByDistance, parseXyz };
//# sourceMappingURL=index.modern.js.map

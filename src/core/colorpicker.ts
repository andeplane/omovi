import * as THREE from 'three'
import { Material, addDefinitionToMaterial, removeDefinitionFromMaterial } from './materials';
import BaseMesh from './basemesh';
import DataTexture from './datatexture';

function colorToTreeIndex(r: number, g: number, b: number): number {
  return r * 255 * 255 + g * 255 + b;
}

// constants
const MISSED_OBJECT_COLOR = new THREE.Color(1, 1, 1); // White is used to detect missed clicks
const MISSED_OBJECT_ID = colorToTreeIndex(
  MISSED_OBJECT_COLOR.r * 255,
  MISSED_OBJECT_COLOR.g * 255,
  MISSED_OBJECT_COLOR.b * 255
);

// reusable variables
const worldPosition = new THREE.Vector3();
const worldQuaternion = new THREE.Quaternion();
const worldScale = new THREE.Vector3();
const pickedObjectBoundingBox = new THREE.Box3();

interface MaterialCacheEntry {
  pickMaterial: Material;
  depthMaterial: Material;
}

export default class ColorPicker {
  private _pickScene: THREE.Scene;
  private _rootObject: THREE.Object3D
  private _pickObjectWrapper: THREE.Object3D;
  private _pickingTexture: THREE.WebGLRenderTarget;
  private _depthScene: THREE.Scene;
  private _depthObjectWrapper: THREE.Object3D;
  private _depthTexture: THREE.WebGLRenderTarget;
  private _objectParentMap: Map<THREE.Object3D, THREE.Object3D | null>;
  private _pixelBuffer: Uint8Array;
  private _depthBuffer: Uint8Array;
  private _cachedMaterials: Map<Material, MaterialCacheEntry>;

  constructor(rootObject: THREE.Object3D) {
    this._rootObject = rootObject;

    this._pickScene = new THREE.Scene();
    this._pickScene.background = MISSED_OBJECT_COLOR;
    this._pickObjectWrapper = new THREE.Object3D();
    this._pickScene.add(this._pickObjectWrapper);
    this._pickingTexture = new THREE.WebGLRenderTarget(0, 0); // adjust size later

    this._depthScene = new THREE.Scene(); // render only the picked object to the scene
    // no need for background color
    this._depthObjectWrapper = new THREE.Object3D();
    this._depthScene.add(this._depthObjectWrapper);
    this._depthTexture = new THREE.WebGLRenderTarget(0, 0);

    this._objectParentMap = new Map(); // to save the parent of the objects

    this._pixelBuffer = new Uint8Array(4); // Single pixel buffer (rgba)
    this._depthBuffer = new Uint8Array(4);

    // each material only need one pickMaterial. We reuse pickMaterials
    this._cachedMaterials = new Map();
  }

  dispose() {
    this._pickingTexture.dispose();
    this._depthTexture.dispose();
  }

  triggerPickTextureRender(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    this._renderToPickTexture(camera, renderer);
  }

  makeObjectPickable(object: THREE.Object3D) {
    if (object instanceof BaseMesh && object.pickMaterial == null) {
      const { _cachedMaterials } = this;
      const objectMaterial = object.standardMaterial;

      if (_cachedMaterials.has(objectMaterial)) {
        const materials = _cachedMaterials.get(objectMaterial)!; // non-null as per check
        object.pickMaterial = materials.pickMaterial;
        object.depthMaterial = materials.depthMaterial;
      } else {
        object.pickMaterial = objectMaterial.clone();
        object.pickMaterial.map = null;
        object.pickMaterial.specularMap = null;
        object.pickMaterial.envMap = null;
        object.pickMaterial.normalMap = null;
        object.pickMaterial.bumpMap = null;
        object.pickMaterial.lightMap = null;
        addDefinitionToMaterial(object.pickMaterial, 'COGNITE_RENDER_COLOR_ID');
        object.depthMaterial = objectMaterial.clone();
        object.pickMaterial.map = null;
        object.pickMaterial.specularMap = null;
        object.pickMaterial.envMap = null;
        object.pickMaterial.normalMap = null;
        object.pickMaterial.bumpMap = null;
        object.pickMaterial.lightMap = null;
        addDefinitionToMaterial(object.depthMaterial, 'COGNITE_RENDER_DEPTH');
        _cachedMaterials.set(objectMaterial, {
          pickMaterial: object.pickMaterial,
          depthMaterial: object.depthMaterial
        });
      }
    }
  }

  getIntersectedParticleIndexFromPixel(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    x: number,
    y: number
  ): number | null {
    this._renderToPickTexture(camera, renderer);
    return this._getParticleIndexFromPickTexture(renderer, x, y);
  }

  getIntersectionFromPixel(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    boundingBox: THREE.Box3,
    geometriesToRender: THREE.Object3D[],
    x: number,
    y: number
  ): THREE.Vector3 {
    // cache camera near and far
    const { near, far } = camera;

    this._renderToDepthTexture(camera, renderer, geometriesToRender);
    const point3d = this._getUnprojectedPointFromDepthTexture(camera, renderer, x, y);

    // restore camera
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();

    return point3d;
  }

  private _renderToPickTexture(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer
  ) {
    // get the original object transformation
    this._rootObject.getWorldPosition(worldPosition);
    this._rootObject.getWorldQuaternion(worldQuaternion);
    this._rootObject.getWorldScale(worldScale);

    // copy the original transformation to the new parent
    this._pickObjectWrapper.position.copy(worldPosition);
    this._pickObjectWrapper.rotation.setFromQuaternion(worldQuaternion);
    this._pickObjectWrapper.scale.copy(worldScale);

    // add the model to the new object3d object
    this._pickObjectWrapper.add(this._rootObject);

    // change material
    this._rootObject.traverseVisible(object => {
      if (object instanceof BaseMesh && object.pickMaterial != null) {
        object.material = object.pickMaterial;
      }
    });

    // do rendering
    const { width, height } = renderer.getSize(new THREE.Vector2());
    this._pickingTexture.setSize(width, height);
    renderer.setRenderTarget(this._pickingTexture);
    renderer.render(this._pickScene, camera);

    // clean up
    this._rootObject.traverseVisible(object => {
      if (object instanceof BaseMesh) {
        object.material = object.standardMaterial;
      }
    });
    this._rootObject.parent = null
  }

  private _renderToDepthTexture(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    geometries: THREE.Object3D[]
  ) {
    // copy the world transformation of geometry to scene root
    const geometry0 = geometries[0];
    geometry0.getWorldPosition(worldPosition);
    geometry0.getWorldQuaternion(worldQuaternion);
    geometry0.getWorldScale(worldScale);
    this._depthObjectWrapper.position.copy(worldPosition);
    this._depthObjectWrapper.rotation.setFromQuaternion(worldQuaternion);
    this._depthObjectWrapper.scale.copy(worldScale);

    // add the model to the new object3d object and change material
    geometries.forEach(object => {
      if (!this._objectParentMap.has(object)) {
        this._objectParentMap.set(object, object.parent);
      }
      this._depthObjectWrapper.add(object);
      if (object instanceof BaseMesh && object.depthMaterial != null) {
        object.material = object.depthMaterial;
      }
    });

    // do rendering
    const { width, height } = renderer.getSize(new THREE.Vector2());
    this._depthTexture.setSize(width, height);
    renderer.setRenderTarget(this._depthTexture);
    renderer.render(this._depthScene, camera);

    // reset parent and material
    geometries.forEach(object => {
      const parent = this._objectParentMap.get(object);
      if (parent) {
        parent.add(object);
      } else {
        this._depthObjectWrapper.remove(object);
      }
      if (object instanceof BaseMesh) {
        object.material = object.standardMaterial;
      }
    });
  }

  private _getParticleIndexFromPickTexture(renderer: THREE.WebGLRenderer, x: number, y: number): number | null {
    // Read the pixel
    renderer.readRenderTargetPixels(this._pickingTexture, x, this._pickingTexture.height - y, 1, 1, this._pixelBuffer);

    const particleIndex = colorToTreeIndex(this._pixelBuffer[0], this._pixelBuffer[1], this._pixelBuffer[2]);
    return particleIndex === MISSED_OBJECT_ID ? null : particleIndex;
  }

  private _getUnprojectedPointFromDepthTexture(
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
    x: number,
    y: number
  ): THREE.Vector3 {
    renderer.readRenderTargetPixels(this._depthTexture, x, this._depthTexture.height - y, 1, 1, this._depthBuffer);

    const [r, g, b, a] = this._depthBuffer;
    const depth = DataTexture.distanceFloatFromRgba(r, g, b, a);

    const screenZ = 2 * depth - 1;

    const { width, height } = renderer.getSize(new THREE.Vector2());
    const screenX = (x / width) * 2 - 1;
    const screenY = (y / height) * -2 + 1;

    return new THREE.Vector3(screenX, screenY, screenZ).unproject(camera);
  }
}

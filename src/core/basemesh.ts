import * as THREE from 'three'
import { Material } from './materials'

class BaseMesh extends THREE.InstancedMesh {
  boundingBox?: THREE.Box3;
  biggestObjectSize?: number;
  cogniteType: string = '';
  isBillboard: boolean = false;
  standardMaterial: Material;
  pickMaterial?: Material;
  depthMaterial?: Material;

  constructor(geometry: THREE.BufferGeometry, material: Material, count: number) {
    super(geometry, material, count);
    this.standardMaterial = material;
  }

  dispose() {
    this.geometry.dispose();
  }
}
export default BaseMesh
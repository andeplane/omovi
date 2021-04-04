import * as THREE from 'three';
import Material from './material';
export declare class InstancedMesh extends THREE.Mesh {
    constructor(geometry: THREE.BufferGeometry, material: Material);
}

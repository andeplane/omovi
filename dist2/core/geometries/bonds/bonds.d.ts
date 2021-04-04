import * as THREE from 'three';
declare class Bonds {
    positions1: Float32Array;
    positions2: Float32Array;
    indices: Float32Array;
    radii: Float32Array;
    colors: THREE.Color[];
    count: number;
    capacity: number;
    mesh?: THREE.InstancedMesh;
    constructor(capacity: number);
    add(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, radius: number, r?: number, g?: number, b?: number): void;
    getRadius: (index: number) => number;
    getPosition1: (index: number) => THREE.Vector3;
    getGeometry: () => THREE.InstancedBufferGeometry;
    getMesh: () => THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null;
}
export default Bonds;

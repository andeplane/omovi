import * as THREE from 'three';
declare class Particles {
    types: string[];
    positions: Float32Array;
    indices: Float32Array;
    radii: Float32Array;
    colors: THREE.Color[];
    count: number;
    capacity: number;
    mesh?: THREE.InstancedMesh;
    constructor(capacity: number);
    add({ x, y, z, radius, type, r, g, b }: {
        x: number;
        y: number;
        z: number;
        radius: number;
        type: string;
        r: number;
        g: number;
        b: number;
    }): void;
    getRadius: (index: number) => number;
    getPosition: (index: number) => THREE.Vector3;
    getType: (index: number) => string;
    getGeometry: () => THREE.InstancedBufferGeometry;
    getMesh: () => THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>;
}
export default Particles;

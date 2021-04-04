import * as THREE from 'three';
declare class Particles {
    positions: Float32Array;
    indices: Float32Array;
    radii: Float32Array;
    numParticles: number;
    capacity: number;
    constructor(capacity: number);
    addParticle(x: number, y: number, z: number, radius: number): void;
    getRadius: (index: number) => number;
    getPosition: (index: number) => THREE.Vector3;
    getMesh: () => THREE.InstancedMesh<THREE.InstancedBufferGeometry, THREE.MeshPhongMaterial>;
}
export default Particles;

import * as THREE from 'three';
export default class SimulationCell {
    vector1: THREE.Vector3;
    vector2: THREE.Vector3;
    vector3: THREE.Vector3;
    origin: THREE.Vector3;
    constructor(vector1: THREE.Vector3, vector2: THREE.Vector3, vector3: THREE.Vector3, origin: THREE.Vector3);
    getCenter: () => THREE.Vector3;
    getOrigin: () => THREE.Vector3;
    getBoundingBox: () => THREE.Box3;
}

import * as THREE from 'three'

export default class SimulationCell {
  vector1: THREE.Vector3
  vector2: THREE.Vector3
  vector3: THREE.Vector3
  origin: THREE.Vector3
  constructor(
    vector1: THREE.Vector3,
    vector2: THREE.Vector3,
    vector3: THREE.Vector3,
    origin: THREE.Vector3
  ) {
    this.vector1 = vector1
    this.vector2 = vector2
    this.vector3 = vector3
    this.origin = origin
  }

  getCenter = () => {
    const center = this.origin
      .clone()
      .add(this.vector1.clone().multiplyScalar(0.5))
      .add(this.vector2.clone().multiplyScalar(0.5))
      .add(this.vector3.clone().multiplyScalar(0.5))
    return center
  }

  getOrigin = () => {
    return this.origin.clone()
  }

  getBoundingBox = () => {
    const box = new THREE.Box3()
    box.expandByPoint(this.origin.clone().add(this.vector1))
    box.expandByPoint(this.origin.clone().add(this.vector2))
    box.expandByPoint(this.origin.clone().add(this.vector3))
    box.expandByPoint(this.origin)
    return box
  }
}

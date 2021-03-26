import * as THREE from 'three'

class Particles {
  positions: Float32Array
  radii: Float32Array
  numParticles: number
  capacity: number

  constructor(capacity: number) {
    this.positions = new Float32Array(3 * capacity)
    this.radii = new Float32Array(capacity)
    this.numParticles = 0
    this.capacity = capacity
  }

  addParticle(x: number, y: number, z: number, radius: number) {
    if (this.numParticles === this.capacity) {
      console.log("Warning, can't add particle because arrays are full")
      return
    }

    const index = this.numParticles

    this.positions[3 * index + 0] = x
    this.positions[3 * index + 1] = y
    this.positions[3 * index + 2] = z
    this.radii[index] = radius

    this.numParticles += 1
  }

  getRadius = (index: number) => {
    return this.radii[index]
  }

  getPosition = (index: number) => {
    return new THREE.Vector3(
      this.positions[3 * index + 0],
      this.positions[3 * index + 1],
      this.positions[3 * index + 2]
    )
  }
}

export default Particles

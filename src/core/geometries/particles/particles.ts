import * as THREE from 'three'
import fragmentShader from './fragment'
import vertexShader from './vertex'
import createMaterial from 'core/materials'

class Particles {
  positions: Float32Array
  indices: Float32Array
  radii: Float32Array
  numParticles: number
  capacity: number

  constructor(capacity: number) {
    this.positions = new Float32Array(3 * capacity)
    this.indices = new Float32Array(capacity)
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
    this.indices[index] = index

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

  getGeometry = () => {
    const baseGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
    const geometry = new THREE.InstancedBufferGeometry()

    geometry.instanceCount = this.numParticles
    geometry.setIndex(baseGeometry.getIndex())
    geometry.setAttribute('position', baseGeometry.getAttribute('position'))
    geometry.setAttribute('normal', baseGeometry.getAttribute('normal'))
    console.log('geometry: ', geometry)

    geometry.setAttribute(
      'particlePosition',
      new THREE.InstancedBufferAttribute(this.positions, 3, false, 1)
    )
    geometry.setAttribute(
      'particleRadius',
      new THREE.InstancedBufferAttribute(this.radii, 1, false, 1)
    )
    return geometry
  }

  getMesh = () => {
    const geometry = this.getGeometry()
    const material = createMaterial('particle', vertexShader, fragmentShader)
    const mesh = new THREE.InstancedMesh(geometry, material, this.numParticles)

    const matrix = new THREE.Matrix4()
    for (let i = 0; i < this.numParticles; i++) {
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, new THREE.Color('red'))
    }
    mesh.frustumCulled = false

    return mesh
  }
}

export default Particles

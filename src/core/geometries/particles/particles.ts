import * as THREE from 'three'
import fragmentShader from './fragment'
import vertexShader from './vertex'
import createMaterial from 'core/materials'

class Particles {
  positions: Float32Array
  indices: Float32Array
  radii: Float32Array
  colors: THREE.Color[]
  numParticles: number
  capacity: number
  mesh?: THREE.InstancedMesh

  constructor(capacity: number) {
    this.positions = new Float32Array(3 * capacity)
    this.indices = new Float32Array(capacity)
    this.radii = new Float32Array(capacity)
    this.colors = []
    this.numParticles = 0
    this.capacity = capacity
    this.mesh = undefined
  }

  addParticle(
    x: number,
    y: number,
    z: number,
    radius: number,
    r: number = 1.0,
    g: number = 0.0,
    b: number = 0.0
  ) {
    if (this.numParticles === this.capacity) {
      console.log("Warning, can't add particle because arrays are full")
      return
    }

    const index = this.numParticles

    this.positions[3 * index + 0] = x
    this.positions[3 * index + 1] = y
    this.positions[3 * index + 2] = z
    this.colors.push(new THREE.Color(r / 255, g / 255, b / 255))
    this.radii[index] = radius * 0.25
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
    if (this.mesh != null) {
      return this.mesh
    }
    const geometry = this.getGeometry()
    const material = createMaterial('particle', vertexShader, fragmentShader)
    this.mesh = new THREE.InstancedMesh(geometry, material, this.numParticles)

    const matrix = new THREE.Matrix4()
    for (let i = 0; i < this.numParticles; i++) {
      this.mesh.setMatrixAt(i, matrix)
      this.mesh.setColorAt(i, this.colors[i])
    }
    this.mesh.frustumCulled = false

    return this.mesh
  }
}

export default Particles

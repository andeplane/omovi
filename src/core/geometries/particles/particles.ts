import * as THREE from 'three'
import fragmentShader from './shaders/fragment'
import vertexShader from './shaders/vertex'
import createMaterial from 'core/materials'

class Particles {
  types: string[]
  positions: Float32Array
  indices: Float32Array
  radii: Float32Array
  colors: THREE.Color[]
  count: number
  capacity: number
  mesh?: THREE.InstancedMesh
  geometry?: THREE.InstancedBufferGeometry

  constructor(capacity: number) {
    this.types = []
    this.positions = new Float32Array(3 * capacity)
    this.indices = new Float32Array(capacity)
    this.radii = new Float32Array(capacity)
    this.colors = []
    this.count = 0
    this.capacity = capacity
    this.mesh = undefined
    this.geometry = undefined
  }

  add({
    x,
    y,
    z,
    id,
    radius,
    type = 'H',
    r = 255.0,
    g = 0.0,
    b = 0.0
  }: {
    x: number
    y: number
    z: number
    id: number
    radius: number
    type: string
    r: number
    g: number
    b: number
  }) {
    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full")
      return
    }

    const index = this.count

    this.positions[3 * index + 0] = x
    this.positions[3 * index + 1] = y
    this.positions[3 * index + 2] = z
    this.colors.push(new THREE.Color(r / 255, g / 255, b / 255))
    this.radii[index] = radius * 0.25
    this.indices[index] = id
    this.types.push(type)

    this.count += 1
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

  getType = (index: number) => {
    return this.types[index]
  }

  getGeometry = () => {
    const baseGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
    const geometry = new THREE.InstancedBufferGeometry()

    geometry.instanceCount = this.count
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
    const material = createMaterial('particle', vertexShader, fragmentShader)
    this.geometry = this.getGeometry()
    this.mesh = new THREE.InstancedMesh(this.geometry, material, this.count)

    const matrix = new THREE.Matrix4()
    for (let i = 0; i < this.count; i++) {
      this.mesh.setMatrixAt(i, matrix)
      if (i < this.colors.length) {
        this.mesh.setColorAt(i, this.colors[i])
      } else {
        this.mesh.setColorAt(i, new THREE.Color('red'))
      }
    }
    this.mesh.frustumCulled = false

    return this.mesh
  }

  markNeedsUpdate = () => {
    if (this.mesh) {
      Object.values(this.mesh.geometry.attributes).forEach((attribute) => {
        attribute.needsUpdate = true
      })
    }

    if (this.geometry) {
      this.geometry.instanceCount = this.count
    }
  }
}

export default Particles

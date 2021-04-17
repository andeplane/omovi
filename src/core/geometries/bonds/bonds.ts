import * as THREE from 'three'
import fragmentShader from './shaders/fragment'
import vertexShader from './shaders/vertex'
import createMaterial from 'core/materials'

class Bonds {
  positions1: Float32Array
  positions2: Float32Array
  indices: Float32Array
  radii: Float32Array
  colors: THREE.Color[]
  count: number
  capacity: number
  mesh?: THREE.InstancedMesh

  constructor(capacity: number) {
    this.positions1 = new Float32Array(3 * capacity)
    this.positions2 = new Float32Array(3 * capacity)
    this.indices = new Float32Array(capacity)
    this.radii = new Float32Array(capacity)
    this.colors = []
    this.count = 0
    this.capacity = capacity
    this.mesh = undefined
  }

  add(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    radius: number,
    r: number = 255.0,
    g: number = 255.0,
    b: number = 255.0
  ) {
    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full")
      return
    }

    const index = this.count

    this.positions1[3 * index + 0] = x1
    this.positions1[3 * index + 1] = y1
    this.positions1[3 * index + 2] = z1
    this.positions2[3 * index + 0] = x2
    this.positions2[3 * index + 1] = y2
    this.positions2[3 * index + 2] = z2

    this.colors.push(new THREE.Color(r / 255, g / 255, b / 255))

    this.radii[index] = radius * 0.25
    this.indices[index] = index

    this.count += 1
  }

  getRadius = (index: number) => {
    return this.radii[index]
  }

  getPosition1 = (index: number) => {
    return new THREE.Vector3(
      this.positions1[3 * index + 0],
      this.positions1[3 * index + 1],
      this.positions1[3 * index + 2]
    )
  }

  getGeometry = () => {
    const positions = []
    positions.push(-1, 1, -1)
    positions.push(-1, -1, -1)
    positions.push(1, 1, -1)
    positions.push(1, -1, -1)
    positions.push(1, 1, 1)
    positions.push(1, -1, 1)

    const positionBufferAttribute = new THREE.BufferAttribute(
      new Float32Array(positions),
      3
    )
    const indexBufferAttribute = new THREE.BufferAttribute(
      new Uint16Array([1, 2, 0, 1, 3, 2, 3, 4, 2, 3, 5, 4]),
      1
    )

    const geometry = new THREE.InstancedBufferGeometry()

    geometry.instanceCount = this.count
    geometry.setIndex(indexBufferAttribute)
    geometry.setAttribute('position', positionBufferAttribute)
    geometry.setAttribute('normal', positionBufferAttribute)

    geometry.setAttribute(
      'position1',
      new THREE.InstancedBufferAttribute(this.positions1, 3, false, 1)
    )

    geometry.setAttribute(
      'position2',
      new THREE.InstancedBufferAttribute(this.positions2, 3, false, 1)
    )

    geometry.setAttribute(
      'bondRadius',
      new THREE.InstancedBufferAttribute(this.radii, 1, false, 1)
    )

    return geometry
  }

  getMesh = () => {
    if (this.mesh != null) {
      return this.mesh
    }

    if (this.count === 0) {
      return null
    }

    const geometry = this.getGeometry()
    const material = createMaterial('bonds', vertexShader, fragmentShader)
    this.mesh = new THREE.InstancedMesh(geometry, material, this.count)

    const matrix = new THREE.Matrix4()
    for (let i = 0; i < this.count; i++) {
      this.mesh.setMatrixAt(i, matrix)
      this.mesh.setColorAt(i, this.colors[i])
    }
    this.mesh.frustumCulled = false

    return this.mesh
  }
}

export default Bonds

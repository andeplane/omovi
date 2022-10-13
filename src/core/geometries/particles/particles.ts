import * as THREE from 'three'
import fragmentShader from './shaders/fragment'
import vertexShader from './shaders/vertex'
import createMaterial from 'core/materials'
//@ts-ignore
import uuid from 'uuid';

class Particles {
  id: string
  types: string[]
  positions: Float32Array
  indices: Float32Array
  radii: Float32Array
  colors: THREE.Color[]
  count: number
  capacity: number
  geometry?: THREE.InstancedBufferGeometry
  baseGeometry?: THREE.PlaneBufferGeometry
  mesh?: THREE.Mesh

  constructor(capacity: number) {
    this.id = uuid()
    this.types = []
    this.positions = new Float32Array(3 * capacity)
    this.indices = new Float32Array(capacity)
    this.radii = new Float32Array(capacity)
    this.colors = []
    this.count = 0
    this.capacity = capacity
    this.geometry = undefined
  }

  add({
    x,
    y,
    z,
    id,
    radius,
    type = 'H'
  }: {
    x: number
    y: number
    z: number
    id: number
    radius: number
    type: string
  }) {
    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full")
      return
    }

    const index = this.count

    this.positions[3 * index + 0] = x
    this.positions[3 * index + 1] = y
    this.positions[3 * index + 2] = z
    this.radii[index] = radius / 3 // van der Waals to ball-and-stick rendering. Each particle has half the space.
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
    if (this.geometry) {
      return this.geometry
    }

    this.baseGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
    this.geometry = new THREE.InstancedBufferGeometry()

    this.geometry.instanceCount = this.count
    this.geometry.setIndex(this.baseGeometry.getIndex())
    this.geometry.setAttribute('position', this.baseGeometry.getAttribute('position'))
    this.geometry.setAttribute('normal', this.baseGeometry.getAttribute('normal'))
    this.geometry.setAttribute(
      'particlePosition',
      new THREE.InstancedBufferAttribute(this.positions, 3, false, 1)
    )
    this.geometry.setAttribute(
      'particleRadius',
      new THREE.InstancedBufferAttribute(this.radii, 1, false, 1)
    )
    this.geometry.setAttribute(
      'particleIndex',
      new THREE.InstancedBufferAttribute(this.indices, 1, false, 1)
    )

    return this.geometry
  }

  markNeedsUpdate = () => {
    if (this.geometry) {
      Object.values(this.geometry.attributes).forEach((attribute) => {
        attribute.needsUpdate = true
      })
    }
  }

  dispose = () => {
    this.baseGeometry?.dispose()
    this.geometry?.dispose()
    this.positions = new Float32Array(0)
    this.indices = new Float32Array(0)
    this.radii = new Float32Array(0)
  }
}

export default Particles

import * as THREE from 'three'
import fragmentShader from './shaders/fragment'
import vertexShader from './shaders/vertex'
import createMaterial from 'core/materials'
import { v4 as uuidv4 } from 'uuid'

class Particles {
  id: string
  types: Float32Array
  positions: Float32Array
  indices: Float32Array
  colors: THREE.Color[]
  count: number
  capacity: number
  geometry?: THREE.InstancedBufferGeometry
  baseGeometry?: THREE.PlaneGeometry
  mesh?: THREE.InstancedMesh

  constructor(capacity: number) {
    this.id = uuidv4()
    this.types = new Float32Array(capacity)
    this.positions = new Float32Array(3 * capacity)
    this.indices = new Float32Array(capacity)
    this.colors = []
    this.count = 0
    this.capacity = capacity
    this.geometry = undefined
  }

  add(x: number, y: number, z: number, id: number, type: number) {
    if (this.count === this.capacity) {
      console.log("Warning, can't add particle because arrays are full")
      return
    }

    const index = this.count

    this.positions[3 * index + 0] = x
    this.positions[3 * index + 1] = y
    this.positions[3 * index + 2] = z
    this.indices[index] = id
    this.types[index] = type

    this.count += 1
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

    this.baseGeometry = new THREE.PlaneGeometry(1, 1, 1, 1)
    this.geometry = new THREE.InstancedBufferGeometry()

    this.geometry.setIndex(this.baseGeometry.getIndex())
    this.geometry.setAttribute(
      'position',
      this.baseGeometry.getAttribute('position')
    )
    this.geometry.setAttribute(
      'normal',
      this.baseGeometry.getAttribute('normal')
    )
    const positionAttribute = new THREE.InstancedBufferAttribute(
      this.positions,
      3,
      false,
      1
    )
    positionAttribute.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setAttribute('particlePosition', positionAttribute)

    const particleIndexAttribute = new THREE.InstancedBufferAttribute(
      this.indices,
      1,
      false,
      1
    )
    particleIndexAttribute.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setAttribute('particleIndex', particleIndexAttribute)

    return this.geometry
  }

  markNeedsUpdate = () => {
    if (this.geometry) {
      Object.values(this.geometry.attributes).forEach((attribute) => {
        attribute.needsUpdate = true
      })
    }
    if (this.mesh) {
      this.mesh.count = this.count
    }
  }

  dispose = () => {
    this.baseGeometry?.dispose()
    this.geometry?.dispose()
    this.positions = new Float32Array(0)
    this.indices = new Float32Array(0)
    this.types = new Float32Array(0)
  }
}

export default Particles

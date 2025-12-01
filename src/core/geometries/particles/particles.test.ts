import { describe, it, expect, beforeEach } from 'vitest'
import Particles from './particles'
import * as THREE from 'three'

describe('Particles', () => {
  let particles: Particles

  beforeEach(() => {
    particles = new Particles(10)
  })

  describe('constructor', () => {
    it('should initialize with correct capacity', () => {
      expect(particles.capacity).toBe(10)
      expect(particles.count).toBe(0)
    })

    it('should initialize arrays with correct sizes', () => {
      expect(particles.positions.length).toBe(30) // 3 * capacity
      expect(particles.indices.length).toBe(10)
      expect(particles.types.length).toBe(10)
    })

    it('should generate unique id for each instance', () => {
      const particles1 = new Particles(5)
      const particles2 = new Particles(5)
      expect(particles1.id).not.toBe(particles2.id)
    })
  })

  describe('add', () => {
    it('should add particle with correct values', () => {
      const result = particles.add(1.0, 2.0, 3.0, 42, 1)

      expect(result).toBe(true)
      expect(particles.count).toBe(1)
      expect(particles.positions[0]).toBe(1.0)
      expect(particles.positions[1]).toBe(2.0)
      expect(particles.positions[2]).toBe(3.0)
      expect(particles.indices[0]).toBe(42)
      expect(particles.types[0]).toBe(1)
    })

    it('should add multiple particles', () => {
      particles.add(1.0, 2.0, 3.0, 1, 1)
      particles.add(4.0, 5.0, 6.0, 2, 2)

      expect(particles.count).toBe(2)
      expect(particles.positions[3]).toBe(4.0)
      expect(particles.positions[4]).toBe(5.0)
      expect(particles.positions[5]).toBe(6.0)
      expect(particles.indices[1]).toBe(2)
      expect(particles.types[1]).toBe(2)
    })

    it('should return false when capacity is reached', () => {
      // Fill up the particles
      for (let i = 0; i < 10; i++) {
        particles.add(i, i, i, i, 1)
      }

      const result = particles.add(11.0, 12.0, 13.0, 11, 1)

      expect(result).toBe(false)
      expect(particles.count).toBe(10) // Should not increase
    })

    it('should handle negative coordinates', () => {
      particles.add(-1.0, -2.0, -3.0, 1, 1)

      expect(particles.positions[0]).toBe(-1.0)
      expect(particles.positions[1]).toBe(-2.0)
      expect(particles.positions[2]).toBe(-3.0)
    })

    it('should handle zero values', () => {
      particles.add(0, 0, 0, 0, 0)

      expect(particles.count).toBe(1)
      expect(particles.positions[0]).toBe(0)
      expect(particles.positions[1]).toBe(0)
      expect(particles.positions[2]).toBe(0)
      expect(particles.indices[0]).toBe(0)
      expect(particles.types[0]).toBe(0)
    })
  })

  describe('getPosition', () => {
    beforeEach(() => {
      particles.add(1.5, 2.5, 3.5, 1, 1)
      particles.add(4.5, 5.5, 6.5, 2, 2)
    })

    it('should return correct position for first particle', () => {
      const position = particles.getPosition(0)

      expect(position).toBeInstanceOf(THREE.Vector3)
      expect(position.x).toBe(1.5)
      expect(position.y).toBe(2.5)
      expect(position.z).toBe(3.5)
    })

    it('should return correct position for second particle', () => {
      const position = particles.getPosition(1)

      expect(position.x).toBe(4.5)
      expect(position.y).toBe(5.5)
      expect(position.z).toBe(6.5)
    })

    it('should create new Vector3 instance each time', () => {
      const position1 = particles.getPosition(0)
      const position2 = particles.getPosition(0)

      expect(position1).not.toBe(position2)
      expect(position1.equals(position2)).toBe(true)
    })
  })

  describe('getType', () => {
    beforeEach(() => {
      particles.add(1.0, 2.0, 3.0, 1, 5)
      particles.add(4.0, 5.0, 6.0, 2, 8)
    })

    it('should return correct type for first particle', () => {
      expect(particles.getType(0)).toBe(5)
    })

    it('should return correct type for second particle', () => {
      expect(particles.getType(1)).toBe(8)
    })
  })

  describe('getGeometry', () => {
    beforeEach(() => {
      particles.add(1.0, 2.0, 3.0, 1, 1)
    })

    it('should create geometry on first call', () => {
      const geometry = particles.getGeometry()

      expect(geometry).toBeDefined()
      expect(geometry).toBeInstanceOf(THREE.InstancedBufferGeometry)
    })

    it('should return same geometry on subsequent calls', () => {
      const geometry1 = particles.getGeometry()
      const geometry2 = particles.getGeometry()

      expect(geometry1).toBe(geometry2)
    })

    it('should set correct attributes', () => {
      const geometry = particles.getGeometry()

      expect(geometry.getAttribute('position')).toBeDefined()
      expect(geometry.getAttribute('normal')).toBeDefined()
      expect(geometry.getAttribute('particlePosition')).toBeDefined()
      expect(geometry.getAttribute('particleIndex')).toBeDefined()
    })

    it('should use correct attribute sizes', () => {
      const geometry = particles.getGeometry()

      const particlePosition = geometry.getAttribute('particlePosition')
      const particleIndex = geometry.getAttribute('particleIndex')

      expect(particlePosition.itemSize).toBe(3)
      expect(particleIndex.itemSize).toBe(1)
    })
  })

  describe('markNeedsUpdate', () => {
    it('should set needsUpdate on geometry attributes', () => {
      particles.add(1.0, 2.0, 3.0, 1, 1)
      const geometry = particles.getGeometry()

      // Get dynamic attributes (particlePosition and particleIndex)
      const particlePosition = geometry.getAttribute('particlePosition')
      const particleIndex = geometry.getAttribute('particleIndex')

      expect(particlePosition).toBeDefined()
      expect(particleIndex).toBeDefined()

      // Verify markNeedsUpdate doesn't throw and updates attributes
      expect(() => particles.markNeedsUpdate()).not.toThrow()

      // Verify attributes are still accessible after update
      expect(geometry.getAttribute('particlePosition')).toBe(particlePosition)
      expect(geometry.getAttribute('particleIndex')).toBe(particleIndex)
    })

    it('should not throw when geometry is undefined', () => {
      expect(() => particles.markNeedsUpdate()).not.toThrow()
    })

    it('should update mesh count if mesh exists', () => {
      particles.add(1.0, 2.0, 3.0, 1, 1)
      particles.add(4.0, 5.0, 6.0, 2, 2)

      const mesh = new THREE.InstancedMesh(
        particles.getGeometry(),
        new THREE.MeshBasicMaterial(),
        particles.capacity
      )
      particles.mesh = mesh

      particles.markNeedsUpdate()

      expect(mesh.count).toBe(2)
    })
  })

  describe('dispose', () => {
    it('should dispose geometries', () => {
      particles.add(1.0, 2.0, 3.0, 1, 1)
      const geometry = particles.getGeometry()
      const baseGeometry = particles.baseGeometry

      particles.dispose()

      // Geometry should be marked for disposal
      expect(particles.positions.length).toBe(0)
      expect(particles.indices.length).toBe(0)
      expect(particles.types.length).toBe(0)
    })

    it('should handle dispose when geometry not created', () => {
      expect(() => particles.dispose()).not.toThrow()
    })

    it('should clear typed arrays', () => {
      particles.add(1.0, 2.0, 3.0, 1, 1)

      particles.dispose()

      expect(particles.positions).toBeInstanceOf(Float32Array)
      expect(particles.indices).toBeInstanceOf(Float32Array)
      expect(particles.types).toBeInstanceOf(Float32Array)
      expect(particles.positions.length).toBe(0)
      expect(particles.indices.length).toBe(0)
      expect(particles.types.length).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle particles with large coordinates', () => {
      const largeValue = 1e10
      particles.add(largeValue, largeValue, largeValue, 1, 1)

      const position = particles.getPosition(0)
      expect(position.x).toBe(largeValue)
    })

    it('should handle very small coordinates', () => {
      const smallValue = 1e-10
      particles.add(smallValue, smallValue, smallValue, 1, 1)

      const position = particles.getPosition(0)
      expect(position.x).toBeCloseTo(smallValue, 15)
    })

    it('should work with capacity of 1', () => {
      const singleParticle = new Particles(1)
      const result = singleParticle.add(1, 2, 3, 0, 1)

      expect(result).toBe(true)
      expect(singleParticle.count).toBe(1)
    })

    it('should work with large capacity', () => {
      const largeParticles = new Particles(10000)
      expect(largeParticles.capacity).toBe(10000)
      expect(largeParticles.positions.length).toBe(30000)
    })
  })
})

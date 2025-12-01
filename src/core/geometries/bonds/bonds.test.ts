import { describe, it, expect, beforeEach } from 'vitest'
import Bonds from './bonds'
import * as THREE from 'three'

describe('Bonds', () => {
  let bonds: Bonds

  beforeEach(() => {
    bonds = new Bonds(10)
  })

  describe('constructor', () => {
    it('should initialize with correct capacity', () => {
      expect(bonds.capacity).toBe(10)
      expect(bonds.count).toBe(0)
    })

    it('should initialize arrays with correct sizes', () => {
      expect(bonds.positions1.length).toBe(30) // 3 * capacity
      expect(bonds.positions2.length).toBe(30) // 3 * capacity
      expect(bonds.indices.length).toBe(10)
      expect(bonds.radii.length).toBe(10)
    })

    it('should generate unique id for each instance', () => {
      const bonds1 = new Bonds(5)
      const bonds2 = new Bonds(5)
      expect(bonds1.id).not.toBe(bonds2.id)
    })
  })

  describe('add', () => {
    it('should add bond with correct values', () => {
      const result = bonds.add(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 0.5)

      expect(result).toBe(true)
      expect(bonds.count).toBe(1)
      expect(bonds.positions1[0]).toBe(1.0)
      expect(bonds.positions1[1]).toBe(2.0)
      expect(bonds.positions1[2]).toBe(3.0)
      expect(bonds.positions2[0]).toBe(4.0)
      expect(bonds.positions2[1]).toBe(5.0)
      expect(bonds.positions2[2]).toBe(6.0)
      expect(bonds.indices[0]).toBe(0)
    })

    it('should scale radius by 0.25', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 1.0)

      expect(bonds.radii[0]).toBe(0.25) // 1.0 * 0.25
    })

    it('should add multiple bonds', () => {
      bonds.add(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 0.5)
      bonds.add(7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 0.8)

      expect(bonds.count).toBe(2)
      expect(bonds.positions1[3]).toBe(7.0)
      expect(bonds.positions1[4]).toBe(8.0)
      expect(bonds.positions1[5]).toBe(9.0)
      expect(bonds.positions2[3]).toBe(10.0)
      expect(bonds.radii[1]).toBe(0.2) // 0.8 * 0.25
    })

    it('should return false when capacity is reached', () => {
      // Fill up the bonds
      for (let i = 0; i < 10; i++) {
        bonds.add(i, i, i, i + 1, i + 1, i + 1, 0.5)
      }

      const result = bonds.add(11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 0.5)

      expect(result).toBe(false)
      expect(bonds.count).toBe(10) // Should not increase
    })

    it('should increment indices sequentially', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 0.5)
      bonds.add(1, 1, 1, 2, 2, 2, 0.5)
      bonds.add(2, 2, 2, 3, 3, 3, 0.5)

      expect(bonds.indices[0]).toBe(0)
      expect(bonds.indices[1]).toBe(1)
      expect(bonds.indices[2]).toBe(2)
    })

    it('should handle negative coordinates', () => {
      bonds.add(-1.0, -2.0, -3.0, -4.0, -5.0, -6.0, 0.5)

      expect(bonds.positions1[0]).toBe(-1.0)
      expect(bonds.positions2[0]).toBe(-4.0)
    })

    it('should handle zero radius', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 0)

      expect(bonds.radii[0]).toBe(0)
    })
  })

  describe('getRadius', () => {
    beforeEach(() => {
      bonds.add(0, 0, 0, 1, 1, 1, 1.0)
      bonds.add(1, 1, 1, 2, 2, 2, 2.0)
    })

    it('should return correct scaled radius for first bond', () => {
      expect(bonds.getRadius(0)).toBe(0.25) // 1.0 * 0.25
    })

    it('should return correct scaled radius for second bond', () => {
      expect(bonds.getRadius(1)).toBe(0.5) // 2.0 * 0.25
    })
  })

  describe('getPosition1', () => {
    beforeEach(() => {
      bonds.add(1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 0.5)
      bonds.add(7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 0.5)
    })

    it('should return correct position1 for first bond', () => {
      const position = bonds.getPosition1(0)

      expect(position).toBeInstanceOf(THREE.Vector3)
      expect(position.x).toBe(1.5)
      expect(position.y).toBe(2.5)
      expect(position.z).toBe(3.5)
    })

    it('should return correct position1 for second bond', () => {
      const position = bonds.getPosition1(1)

      expect(position.x).toBe(7.5)
      expect(position.y).toBe(8.5)
      expect(position.z).toBe(9.5)
    })

    it('should create new Vector3 instance each time', () => {
      const position1 = bonds.getPosition1(0)
      const position2 = bonds.getPosition1(0)

      expect(position1).not.toBe(position2)
      expect(position1.equals(position2)).toBe(true)
    })
  })

  describe('getGeometry', () => {
    beforeEach(() => {
      bonds.add(0, 0, 0, 1, 1, 1, 0.5)
    })

    it('should create geometry on first call', () => {
      const geometry = bonds.getGeometry()

      expect(geometry).toBeDefined()
      expect(geometry).toBeInstanceOf(THREE.InstancedBufferGeometry)
    })

    it('should return same geometry on subsequent calls', () => {
      const geometry1 = bonds.getGeometry()
      const geometry2 = bonds.getGeometry()

      expect(geometry1).toBe(geometry2)
    })

    it('should set correct attributes', () => {
      const geometry = bonds.getGeometry()

      expect(geometry.getAttribute('position')).toBeDefined()
      expect(geometry.getAttribute('normal')).toBeDefined()
      expect(geometry.getAttribute('position1')).toBeDefined()
      expect(geometry.getAttribute('position2')).toBeDefined()
      expect(geometry.getAttribute('bondRadius')).toBeDefined()
    })

    it('should use correct attribute sizes', () => {
      const geometry = bonds.getGeometry()

      const position1 = geometry.getAttribute('position1')
      const position2 = geometry.getAttribute('position2')
      const bondRadius = geometry.getAttribute('bondRadius')

      expect(position1.itemSize).toBe(3)
      expect(position2.itemSize).toBe(3)
      expect(bondRadius.itemSize).toBe(1)
    })

    it('should set instanceCount to match count', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 0.5)
      bonds.add(1, 1, 1, 2, 2, 2, 0.5)

      const geometry = bonds.getGeometry()

      expect(geometry.instanceCount).toBe(2)
    })

    it('should have correct index buffer', () => {
      const geometry = bonds.getGeometry()
      const index = geometry.getIndex()

      expect(index).toBeDefined()
      expect(index?.count).toBe(12) // 4 triangles * 3 vertices
    })
  })

  describe('markNeedsUpdate', () => {
    it('should set needsUpdate on geometry attributes', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 0.5)
      const geometry = bonds.getGeometry()

      // Reset needsUpdate flags
      Object.values(geometry.attributes).forEach((attr) => {
        attr.needsUpdate = false
      })

      bonds.markNeedsUpdate()

      Object.values(geometry.attributes).forEach((attr) => {
        expect(attr.needsUpdate).toBe(true)
      })
    })

    it('should not throw when geometry is undefined', () => {
      expect(() => bonds.markNeedsUpdate()).not.toThrow()
    })

    it('should update mesh count if mesh exists', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 0.5)
      bonds.add(1, 1, 1, 2, 2, 2, 0.5)

      const mesh = new THREE.InstancedMesh(
        bonds.getGeometry(),
        new THREE.MeshBasicMaterial(),
        bonds.capacity
      )
      bonds.mesh = mesh

      bonds.markNeedsUpdate()

      expect(mesh.count).toBe(2)
    })
  })

  describe('dispose', () => {
    it('should dispose geometry', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 0.5)
      bonds.getGeometry()

      bonds.dispose()

      expect(bonds.positions1.length).toBe(0)
      expect(bonds.positions2.length).toBe(0)
      expect(bonds.indices.length).toBe(0)
      expect(bonds.radii.length).toBe(0)
    })

    it('should handle dispose when geometry not created', () => {
      expect(() => bonds.dispose()).not.toThrow()
    })

    it('should clear typed arrays', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 0.5)

      bonds.dispose()

      expect(bonds.positions1).toBeInstanceOf(Float32Array)
      expect(bonds.positions2).toBeInstanceOf(Float32Array)
      expect(bonds.indices).toBeInstanceOf(Float32Array)
      expect(bonds.radii).toBeInstanceOf(Float32Array)
      expect(bonds.positions1.length).toBe(0)
      expect(bonds.positions2.length).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle bonds with large coordinates', () => {
      const largeValue = 1e10
      bonds.add(largeValue, largeValue, largeValue, largeValue + 1, largeValue + 1, largeValue + 1, 1.0)

      const position = bonds.getPosition1(0)
      expect(position.x).toBe(largeValue)
    })

    it('should handle very small coordinates', () => {
      const smallValue = 1e-10
      bonds.add(smallValue, smallValue, smallValue, smallValue * 2, smallValue * 2, smallValue * 2, 0.5)

      const position = bonds.getPosition1(0)
      expect(position.x).toBeCloseTo(smallValue, 15)
    })

    it('should work with capacity of 1', () => {
      const singleBond = new Bonds(1)
      const result = singleBond.add(0, 0, 0, 1, 1, 1, 0.5)

      expect(result).toBe(true)
      expect(singleBond.count).toBe(1)
    })

    it('should work with large capacity', () => {
      const largeBonds = new Bonds(10000)
      expect(largeBonds.capacity).toBe(10000)
      expect(largeBonds.positions1.length).toBe(30000)
    })

    it('should handle very small radius', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 1e-10)

      expect(bonds.getRadius(0)).toBeCloseTo(2.5e-11, 20)
    })

    it('should handle very large radius', () => {
      bonds.add(0, 0, 0, 1, 1, 1, 1000)

      expect(bonds.getRadius(0)).toBe(250)
    })
  })
})


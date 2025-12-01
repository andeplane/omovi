import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import SimulationCell from './simulationcell'

describe('SimulationCell', () => {
  describe('constructor', () => {
    it('should create a cell with given vectors and origin', () => {
      // Arrange
      const vector1 = new THREE.Vector3(10, 0, 0)
      const vector2 = new THREE.Vector3(0, 10, 0)
      const vector3 = new THREE.Vector3(0, 0, 10)
      const origin = new THREE.Vector3(0, 0, 0)

      // Act
      const cell = new SimulationCell(vector1, vector2, vector3, origin)

      // Assert
      expect(cell.vector1).toBe(vector1)
      expect(cell.vector2).toBe(vector2)
      expect(cell.vector3).toBe(vector3)
      expect(cell.origin).toBe(origin)
    })
  })

  describe('getCenter', () => {
    it('should calculate center for cubic cell at origin', () => {
      // Arrange
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 0, 0)
      )

      // Act
      const center = cell.getCenter()

      // Assert
      expect(center.x).toBeCloseTo(5, 5)
      expect(center.y).toBeCloseTo(5, 5)
      expect(center.z).toBeCloseTo(5, 5)
    })

    it('should calculate center for cell with non-zero origin', () => {
      // Arrange
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(5, 5, 5)
      )

      // Act
      const center = cell.getCenter()

      // Assert
      expect(center.x).toBeCloseTo(10, 5)
      expect(center.y).toBeCloseTo(10, 5)
      expect(center.z).toBeCloseTo(10, 5)
    })

    it('should calculate center for non-cubic cell', () => {
      // Arrange
      const cell = new SimulationCell(
        new THREE.Vector3(20, 0, 0),
        new THREE.Vector3(0, 30, 0),
        new THREE.Vector3(0, 0, 40),
        new THREE.Vector3(0, 0, 0)
      )

      // Act
      const center = cell.getCenter()

      // Assert
      expect(center.x).toBeCloseTo(10, 5)
      expect(center.y).toBeCloseTo(15, 5)
      expect(center.z).toBeCloseTo(20, 5)
    })

    it('should calculate center for triclinic cell', () => {
      // Arrange - triclinic cell with non-orthogonal vectors
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(2, 10, 0), // xy tilt
        new THREE.Vector3(1, 1, 10), // xz and yz tilt
        new THREE.Vector3(0, 0, 0)
      )

      // Act
      const center = cell.getCenter()

      // Assert
      expect(center.x).toBeCloseTo(6.5, 5) // (10 + 2 + 1) / 2
      expect(center.y).toBeCloseTo(5.5, 5) // (0 + 10 + 1) / 2
      expect(center.z).toBeCloseTo(5, 5) // (0 + 0 + 10) / 2
    })

    it('should not modify original vectors', () => {
      // Arrange
      const vector1 = new THREE.Vector3(10, 0, 0)
      const vector2 = new THREE.Vector3(0, 10, 0)
      const vector3 = new THREE.Vector3(0, 0, 10)
      const origin = new THREE.Vector3(0, 0, 0)
      const cell = new SimulationCell(vector1, vector2, vector3, origin)

      // Act
      cell.getCenter()

      // Assert - vectors should remain unchanged
      expect(vector1).toEqual(new THREE.Vector3(10, 0, 0))
      expect(vector2).toEqual(new THREE.Vector3(0, 10, 0))
      expect(vector3).toEqual(new THREE.Vector3(0, 0, 10))
      expect(origin).toEqual(new THREE.Vector3(0, 0, 0))
    })
  })

  describe('getOrigin', () => {
    it('should return clone of origin', () => {
      // Arrange
      const origin = new THREE.Vector3(5, 10, 15)
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        origin
      )

      // Act
      const returnedOrigin = cell.getOrigin()

      // Assert
      expect(returnedOrigin).toEqual(origin)
      expect(returnedOrigin).not.toBe(origin) // Should be a clone
    })

    it('should not allow modification of original origin through returned clone', () => {
      // Arrange
      const origin = new THREE.Vector3(5, 10, 15)
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        origin
      )

      // Act
      const returnedOrigin = cell.getOrigin()
      returnedOrigin.x = 999

      // Assert
      expect(cell.origin.x).toBe(5) // Original should be unchanged
    })
  })

  describe('getBoundingBox', () => {
    it('should calculate bounding box for cubic cell at origin', () => {
      // Arrange
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 0, 0)
      )

      // Act
      const box = cell.getBoundingBox()

      // Assert
      expect(box.min.x).toBeCloseTo(0, 5)
      expect(box.min.y).toBeCloseTo(0, 5)
      expect(box.min.z).toBeCloseTo(0, 5)
      expect(box.max.x).toBeCloseTo(10, 5)
      expect(box.max.y).toBeCloseTo(10, 5)
      expect(box.max.z).toBeCloseTo(10, 5)
    })

    it('should calculate bounding box for cell with non-zero origin', () => {
      // Arrange
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(5, 5, 5)
      )

      // Act
      const box = cell.getBoundingBox()

      // Assert
      expect(box.min.x).toBeCloseTo(5, 5)
      expect(box.min.y).toBeCloseTo(5, 5)
      expect(box.min.z).toBeCloseTo(5, 5)
      expect(box.max.x).toBeCloseTo(15, 5)
      expect(box.max.y).toBeCloseTo(15, 5)
      expect(box.max.z).toBeCloseTo(15, 5)
    })

    it('should calculate bounding box for triclinic cell', () => {
      // Arrange - triclinic cell expands in multiple directions
      const cell = new SimulationCell(
        new THREE.Vector3(10, 2, 1),
        new THREE.Vector3(0, 10, 2),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 0, 0)
      )

      // Act
      const box = cell.getBoundingBox()

      // Assert - box contains 4 points: origin, origin+v1, origin+v2, origin+v3
      // Points are: (0,0,0), (10,2,1), (0,10,2), (0,0,10)
      expect(box.min.x).toBeCloseTo(0, 5)
      expect(box.min.y).toBeCloseTo(0, 5)
      expect(box.min.z).toBeCloseTo(0, 5)
      expect(box.max.x).toBeCloseTo(10, 5)
      expect(box.max.y).toBeCloseTo(10, 5)
      expect(box.max.z).toBeCloseTo(10, 5)
    })

    it('should include origin point in bounding box', () => {
      // Arrange
      const origin = new THREE.Vector3(-5, -10, -15)
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        origin
      )

      // Act
      const box = cell.getBoundingBox()

      // Assert
      expect(box.containsPoint(origin)).toBe(true)
    })

    it('should include all corner points', () => {
      // Arrange
      const origin = new THREE.Vector3(0, 0, 0)
      const vector1 = new THREE.Vector3(10, 0, 0)
      const vector2 = new THREE.Vector3(0, 10, 0)
      const vector3 = new THREE.Vector3(0, 0, 10)
      const cell = new SimulationCell(vector1, vector2, vector3, origin)

      // Act
      const box = cell.getBoundingBox()

      // Assert - check all 4 expanded points
      expect(box.containsPoint(origin)).toBe(true)
      expect(box.containsPoint(origin.clone().add(vector1))).toBe(true)
      expect(box.containsPoint(origin.clone().add(vector2))).toBe(true)
      expect(box.containsPoint(origin.clone().add(vector3))).toBe(true)
    })
  })
})

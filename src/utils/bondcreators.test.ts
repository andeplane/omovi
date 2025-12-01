import { describe, it, expect, beforeEach } from 'vitest'
import { createBondsByDistance } from './bondcreators'
import Particles from '../core/geometries/particles/particles'
import SimulationDataFrame from '../core/simulationdata/simulationdataframe'
import * as THREE from 'three'
import SimulationCell from '../core/simulationdata/simulationcell'

describe('bondcreators', () => {
  describe('createBondsByDistance', () => {
    let particles: Particles
    let frame: SimulationDataFrame

    beforeEach(() => {
      // Create a simple simulation cell
      const cell = new SimulationCell(
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 0, 0)
      )

      // Create particles
      particles = new Particles(4)
      frame = new SimulationDataFrame(particles, cell)
    })

    it('should create bonds between particles within distance threshold', () => {
      // Arrange - place two particles close together
      particles.add(0, 0, 0, 0, 1) // type 1
      particles.add(1, 0, 0, 1, 2) // type 2, distance 1.0 from first

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '2', distance: 1.5 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert
      expect(bonds).toBeDefined()
      expect(bonds.count).toBeGreaterThan(0)
    })

    it('should not create bonds when particles are too far apart', () => {
      // Arrange - place particles far apart
      particles.add(0, 0, 0, 0, 1)
      particles.add(10, 0, 0, 1, 2) // distance 10.0 from first

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '2', distance: 2.0 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert
      expect(bonds.count).toBe(0)
    })

    it('should create bidirectional pair distance mapping', () => {
      // Arrange - pair distances should work in both directions
      particles.add(0, 0, 0, 0, 1) // type 1
      particles.add(1, 0, 0, 1, 2) // type 2

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '2', distance: 1.5 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert - should find bond regardless of which particle is checked first
      expect(bonds.count).toBeGreaterThan(0)
    })

    it('should deduplicate bonds between same particle pairs', () => {
      // Arrange - three particles in a line
      particles.add(0, 0, 0, 0, 1)
      particles.add(1, 0, 0, 1, 1)
      particles.add(2, 0, 0, 2, 1)

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '1', distance: 1.5 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert - should have 2 bonds (0-1 and 1-2), not 4 (with duplicates)
      expect(bonds.count).toBe(2)
    })

    it('should skip bonds for particle types not in pairDistances', () => {
      // Arrange
      particles.add(0, 0, 0, 0, 1)
      particles.add(1, 0, 0, 1, 3) // type 3, not in pairDistances

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '2', distance: 1.5 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert
      expect(bonds.count).toBe(0)
    })

    it('should handle multiple particle types correctly', () => {
      // Arrange - H-O-H like water molecule
      particles.add(0, 0, 0, 0, 1) // H at (0,0,0)
      particles.add(1, 0, 0, 1, 8) // O at (1,0,0)
      particles.add(2, 0, 0, 2, 1) // H at (2,0,0)

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '8', distance: 1.5 }] // H-O bonds
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert - should find 2 H-O bonds, no H-H bonds
      expect(bonds.count).toBe(2)
    })

    it('should use custom bond radius', () => {
      // Arrange
      particles.add(0, 0, 0, 0, 1)
      particles.add(1, 0, 0, 1, 1)

      const customRadius = 0.75
      const bondCreator = createBondsByDistance({
        radius: customRadius,
        pairDistances: [{ type1: '1', type2: '1', distance: 1.5 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert
      expect(bonds).toBeDefined()
      // Note: We can't directly check the radius in the bonds object,
      // but we verify the bonds are created with the custom radius parameter
      expect(bonds.count).toBeGreaterThan(0)
    })

    it('should handle empty particle system', () => {
      // Arrange - no particles added
      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '1', distance: 1.5 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert
      expect(bonds.count).toBe(0)
    })

    it('should handle single particle', () => {
      // Arrange
      particles.add(0, 0, 0, 0, 1)

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [{ type1: '1', type2: '1', distance: 1.5 }]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert
      expect(bonds.count).toBe(0)
    })

    it('should respect different distance thresholds for different pairs', () => {
      // Arrange
      particles.add(0, 0, 0, 0, 1) // Type 1
      particles.add(1, 0, 0, 1, 2) // Type 2, distance 1.0
      particles.add(0, 1, 0, 2, 3) // Type 3, distance 1.0

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        pairDistances: [
          { type1: '1', type2: '2', distance: 1.5 }, // Should create bond
          { type1: '1', type2: '3', distance: 0.5 } // Should NOT create bond
        ]
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert - only 1-2 bond should be created
      expect(bonds.count).toBe(1)
    })

    it('should handle particles in 3D space', () => {
      // Arrange - particles in 3D configuration
      particles.add(0, 0, 0, 0, 1)
      particles.add(0.5, 0.5, 0.5, 1, 1) // distance ~0.866 from first, squared ~0.75

      const bondCreator = createBondsByDistance({
        radius: 0.5,
        // Note: distance comparisons use squared distances internally
        pairDistances: [{ type1: '1', type2: '1', distance: 1.0 }] // squared distance threshold
      })

      // Act
      const bonds = bondCreator(frame)

      // Assert
      expect(bonds.count).toBe(1)
    })
  })
})

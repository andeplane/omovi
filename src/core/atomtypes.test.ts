import { describe, it, expect } from 'vitest'
import { getColor } from './atomtypes'

describe('atomtypes', () => {
  describe('getColor', () => {
    it('should return first color for particle type 0', () => {
      // Arrange & Act
      const color = getColor(0)

      // Assert
      expect(color).toEqual({ r: 255, g: 102, b: 102 })
    })

    it('should return second color for particle type 1', () => {
      // Arrange & Act
      const color = getColor(1)

      // Assert
      expect(color).toEqual({ r: 102, g: 102, b: 255 })
    })

    it('should cycle colors when particle type exceeds color array length', () => {
      // Arrange - there are 9 colors in the array
      const particleType = 9 // Should wrap to index 0

      // Act
      const color = getColor(particleType)

      // Assert
      expect(color).toEqual({ r: 255, g: 102, b: 102 }) // Same as type 0
    })

    it.each([
      { type: 0, expected: { r: 255, g: 102, b: 102 } },
      { type: 1, expected: { r: 102, g: 102, b: 255 } },
      { type: 2, expected: { r: 255, g: 255, b: 0 } },
      { type: 3, expected: { r: 255, g: 102, b: 255 } },
      { type: 4, expected: { r: 102, g: 255, b: 51 } },
      { type: 5, expected: { r: 204, g: 255, b: 179 } },
      { type: 6, expected: { r: 179, g: 0, b: 255 } },
      { type: 7, expected: { r: 51, g: 255, b: 255 } },
      { type: 8, expected: { r: 247, g: 247, b: 247 } }
    ])(
      'should return correct color for particle type $type',
      ({ type, expected }) => {
        // Act
        const color = getColor(type)

        // Assert
        expect(color).toEqual(expected)
      }
    )

    it.each([
      { type: 9, expectedIndex: 0 }, // 9 % 9 = 0
      { type: 18, expectedIndex: 0 }, // 18 % 9 = 0
      { type: 10, expectedIndex: 1 }, // 10 % 9 = 1
      { type: 27, expectedIndex: 0 }, // 27 % 9 = 0
      { type: 100, expectedIndex: 1 } // 100 % 9 = 1
    ])(
      'should cycle correctly for large particle type $type',
      ({ type, expectedIndex }) => {
        // Arrange
        const expectedColors = [
          { r: 255, g: 102, b: 102 },
          { r: 102, g: 102, b: 255 },
          { r: 255, g: 255, b: 0 },
          { r: 255, g: 102, b: 255 },
          { r: 102, g: 255, b: 51 },
          { r: 204, g: 255, b: 179 },
          { r: 179, g: 0, b: 255 },
          { r: 51, g: 255, b: 255 },
          { r: 247, g: 247, b: 247 }
        ]

        // Act
        const color = getColor(type)

        // Assert
        expect(color).toEqual(expectedColors[expectedIndex])
      }
    )

    it('should return consistent colors for same particle type', () => {
      // Arrange
      const particleType = 5

      // Act
      const color1 = getColor(particleType)
      const color2 = getColor(particleType)

      // Assert
      expect(color1).toEqual(color2)
    })
  })
})

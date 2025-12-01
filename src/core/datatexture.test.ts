import { describe, it, expect } from 'vitest'
import DataTexture from './datatexture'

describe('DataTexture', () => {
  describe('rgbaFromValue and valueFromRgba', () => {
    describe('integer roundtrip', () => {
      it.each([
        { value: 0 },
        { value: 1 },
        { value: 255 },
        { value: 256 },
        { value: 65535 },
        { value: 1000000 },
        { value: 16777215 } // 255 * 255 * 255 (max 24-bit value)
      ])('should roundtrip positive integer $value', ({ value }) => {
        // Arrange & Act
        const rgba = DataTexture.rgbaFromValue(value, true)
        const result = DataTexture.valueFromRgba(
          rgba.r,
          rgba.g,
          rgba.b,
          rgba.a,
          true
        )

        // Assert
        expect(result).toBe(value)
      })

      it.each([
        { value: -1 },
        { value: -255 },
        { value: -1000 },
        { value: -16777215 }
      ])('should roundtrip negative integer $value', ({ value }) => {
        // Arrange & Act
        const rgba = DataTexture.rgbaFromValue(value, true)
        const result = DataTexture.valueFromRgba(
          rgba.r,
          rgba.g,
          rgba.b,
          rgba.a,
          true
        )

        // Assert
        expect(result).toBe(value)
      })

      it('should use alpha to store sign for positive values', () => {
        // Arrange
        const positiveValue = 100

        // Act
        const rgba = DataTexture.rgbaFromValue(positiveValue, true)

        // Assert
        expect(rgba.a).toBe(255) // Positive sign
      })

      it('should use alpha to store sign for negative values', () => {
        // Arrange
        const negativeValue = -100

        // Act
        const rgba = DataTexture.rgbaFromValue(negativeValue, true)

        // Assert
        expect(rgba.a).toBe(127) // Negative sign
      })
    })

    describe('float roundtrip', () => {
      it.each([
        { value: 0.0 },
        { value: 1.0 },
        { value: 0.5 },
        { value: 0.33 },
        { value: 100.5 },
        { value: 255.0 }
      ])(
        'should roundtrip positive float $value with reasonable precision',
        ({ value }) => {
          // Arrange & Act
          const rgba = DataTexture.rgbaFromValue(value, false)
          const result = DataTexture.valueFromRgba(
            rgba.r,
            rgba.g,
            rgba.b,
            rgba.a,
            false
          )

          // Assert - allow small precision loss due to 1/255 resolution
          expect(result).toBeCloseTo(value, 1)
        }
      )

      it.each([{ value: -0.5 }, { value: -1.0 }, { value: -100.5 }])(
        'should roundtrip negative float $value with reasonable precision',
        ({ value }) => {
          // Arrange & Act
          const rgba = DataTexture.rgbaFromValue(value, false)
          const result = DataTexture.valueFromRgba(
            rgba.r,
            rgba.g,
            rgba.b,
            rgba.a,
            false
          )

          // Assert
          expect(result).toBeCloseTo(value, 1)
        }
      )

      it('should scale float by 255 before encoding', () => {
        // Arrange
        const floatValue = 1.0

        // Act
        const rgba = DataTexture.rgbaFromValue(floatValue, false)

        // Assert - 1.0 * 255 = 255 total value
        const totalValue = rgba.r * 255 * 255 + rgba.g * 255 + rgba.b
        expect(totalValue).toBe(255)
      })
    })

    describe('zero value handling', () => {
      it('should handle zero as integer', () => {
        // Arrange & Act
        const rgba = DataTexture.rgbaFromValue(0, true)
        const result = DataTexture.valueFromRgba(
          rgba.r,
          rgba.g,
          rgba.b,
          rgba.a,
          true
        )

        // Assert
        expect(result).toBe(0)
        expect(rgba).toEqual({ r: 0, g: 0, b: 0, a: 255 }) // Positive sign for zero
      })

      it('should handle zero as float', () => {
        // Arrange & Act
        const rgba = DataTexture.rgbaFromValue(0, false)
        const result = DataTexture.valueFromRgba(
          rgba.r,
          rgba.g,
          rgba.b,
          rgba.a,
          false
        )

        // Assert
        expect(result).toBe(0)
      })
    })
  })

  describe('rgbaFromDistanceFloat and distanceFloatFromRgba', () => {
    it.each([
      { value: 0.0 },
      { value: 0.5 },
      { value: 1.0 },
      { value: 0.25 },
      { value: 0.75 },
      { value: 0.1 },
      { value: 0.9 }
    ])('should roundtrip distance float $value', ({ value }) => {
      // Arrange & Act
      const rgba = DataTexture.rgbaFromDistanceFloat(value)
      const result = DataTexture.distanceFloatFromRgba(
        rgba.r,
        rgba.g,
        rgba.b,
        rgba.a
      )

      // Assert - should be very close due to high precision (3 channels)
      expect(result).toBeCloseTo(value, 5)
    })

    it('should always set alpha to 255 for distance floats', () => {
      // Arrange
      const testValues = [0.0, 0.5, 1.0]

      // Act & Assert
      testValues.forEach((value) => {
        const rgba = DataTexture.rgbaFromDistanceFloat(value)
        expect(rgba.a).toBe(255)
      })
    })

    it('should handle boundary values 0 and 1', () => {
      // Arrange & Act
      const rgba0 = DataTexture.rgbaFromDistanceFloat(0)
      const rgba1 = DataTexture.rgbaFromDistanceFloat(1)

      const result0 = DataTexture.distanceFloatFromRgba(
        rgba0.r,
        rgba0.g,
        rgba0.b,
        rgba0.a
      )
      const result1 = DataTexture.distanceFloatFromRgba(
        rgba1.r,
        rgba1.g,
        rgba1.b,
        rgba1.a
      )

      // Assert
      expect(result0).toBeCloseTo(0, 5)
      expect(result1).toBeCloseTo(1, 3) // Slightly less precision at boundary
    })

    it('should use 3 channels for increased precision', () => {
      // Arrange - test that we get different encodings for close values
      const value1 = 0.5
      const value2 = 0.50001

      // Act
      const rgba1 = DataTexture.rgbaFromDistanceFloat(value1)
      const rgba2 = DataTexture.rgbaFromDistanceFloat(value2)

      // Assert - at least one channel should differ
      const channelsDiffer =
        rgba1.r !== rgba2.r || rgba1.g !== rgba2.g || rgba1.b !== rgba2.b
      expect(channelsDiffer).toBe(true)
    })

    it('should provide better precision than single channel encoding', () => {
      // Arrange
      const testValue = 0.123456

      // Act
      const rgba = DataTexture.rgbaFromDistanceFloat(testValue)
      const result = DataTexture.distanceFloatFromRgba(
        rgba.r,
        rgba.g,
        rgba.b,
        rgba.a
      )

      // Assert - precision should be better than 1/255 (single channel)
      const error = Math.abs(result - testValue)
      expect(error).toBeLessThan(0.004) // Much better than 1/255 ≈ 0.0039
    })
  })

  describe('encoding consistency', () => {
    it('should produce same RGBA for same input value', () => {
      // Arrange
      const value = 12345

      // Act
      const rgba1 = DataTexture.rgbaFromValue(value, true)
      const rgba2 = DataTexture.rgbaFromValue(value, true)

      // Assert
      expect(rgba1).toEqual(rgba2)
    })

    it('should produce different RGBA for different sign', () => {
      // Arrange
      const value = 100

      // Act
      const rgbaPositive = DataTexture.rgbaFromValue(value, true)
      const rgbaNegative = DataTexture.rgbaFromValue(-value, true)

      // Assert
      expect(rgbaPositive.r).toBe(rgbaNegative.r)
      expect(rgbaPositive.g).toBe(rgbaNegative.g)
      expect(rgbaPositive.b).toBe(rgbaNegative.b)
      expect(rgbaPositive.a).not.toBe(rgbaNegative.a) // Sign differs
    })
  })
})

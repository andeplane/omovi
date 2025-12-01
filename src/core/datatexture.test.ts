import { describe, it, expect, vi, beforeEach } from 'vitest'
import DataTexture from './datatexture'
import * as THREE from 'three'

// Mock Three.js DataTexture
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three')

  class MockDataTexture {
    image: { data: Uint8Array; width: number; height: number }
    needsUpdate: boolean
    dispose: ReturnType<typeof vi.fn>

    constructor(
      data: Uint8Array,
      width: number,
      height: number,
      format: unknown
    ) {
      this.image = { data, width, height }
      this.needsUpdate = false
      this.dispose = vi.fn()
    }
  }

  return {
    ...actual,
    DataTexture: MockDataTexture,
    RGBAFormat: 1023 // Mock constant
  }
})

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

  describe('DataTexture class instance methods', () => {
    let onChangeMock: () => void

    beforeEach(() => {
      onChangeMock = vi.fn()
      vi.clearAllMocks()
    })

    describe('constructor', () => {
      it('should initialize rgba type texture with all 255 values', () => {
        // Arrange & Act
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Assert
        expect(texture.name).toBe('testTexture')
        expect(texture.maxParticleIndex).toBe(10)
        expect(texture.width).toBeGreaterThan(0)
        expect(texture.height).toBeGreaterThan(0)

        // Check that rgba values are initialized to 255
        const data = texture.getData()
        expect(data[0]).toBe(255)
        expect(data[1]).toBe(255)
        expect(data[2]).toBe(255)
        expect(data[3]).toBe(255)
      })

      it('should initialize float type texture with 0.33 default values', () => {
        // Arrange & Act
        const texture = new DataTexture('testTexture', 5, 'float', onChangeMock)

        // Assert - verify first pixel has the default 0.33 value
        const floatValue = texture.getFloat(0)
        expect(floatValue).toBeCloseTo(0.33, 1)
      })

      it('should calculate appropriate texture dimensions', () => {
        // Arrange & Act
        const texture = new DataTexture(
          'testTexture',
          100,
          'rgba',
          onChangeMock
        )

        // Assert - dimensions should be powers of 2 and accommodate all particles
        const totalPixels = texture.width * texture.height
        expect(totalPixels).toBeGreaterThanOrEqual(110) // 100 + 10 buffer
        expect(Math.log2(texture.width) % 1).toBe(0) // Power of 2
        expect(Math.log2(texture.height) % 1).toBe(0) // Power of 2
      })
    })

    describe('getData', () => {
      it('should return the internal Uint8Array data', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Act
        const data = texture.getData()

        // Assert
        expect(data).toBeInstanceOf(Uint8Array)
        expect(data.length).toBe(4 * texture.width * texture.height)
      })

      it('should return same reference when called multiple times', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Act
        const data1 = texture.getData()
        const data2 = texture.getData()

        // Assert
        expect(data1).toBe(data2) // Same reference
      })

      it('should allow direct data manipulation', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)
        const data = texture.getData()

        // Act
        data[0] = 100
        data[1] = 150
        data[2] = 200
        data[3] = 250

        // Assert
        const rgba = texture.getRGBA(0)
        expect(rgba.r).toBe(100)
        expect(rgba.g).toBe(150)
        expect(rgba.b).toBe(200)
        expect(rgba.a).toBe(250)
      })
    })

    describe('getTexture', () => {
      it('should return Three.js DataTexture instance', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Act
        const threeTexture = texture.getTexture()

        // Assert
        expect(threeTexture).toBeDefined()
        expect(threeTexture).toHaveProperty('needsUpdate')
      })
    })

    describe('getRGBA and setRGBA', () => {
      it('should set and get RGBA values for a particle', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Act
        texture.setRGBA(0, 100, 150, 200, 250)
        const rgba = texture.getRGBA(0)

        // Assert
        expect(rgba.r).toBe(100)
        expect(rgba.g).toBe(150)
        expect(rgba.b).toBe(200)
        expect(rgba.a).toBe(250)
      })

      it('should default alpha to 255 when not provided', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Act
        texture.setRGBA(0, 100, 150, 200)
        const rgba = texture.getRGBA(0)

        // Assert
        expect(rgba.a).toBe(255)
      })

      it('should trigger onChange callback when setting RGBA', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Act
        texture.setRGBA(0, 100, 150, 200, 250)

        // Assert
        expect(onChangeMock).toHaveBeenCalledTimes(1)
      })

      it('should handle multiple particles independently', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)

        // Act
        texture.setRGBA(0, 10, 20, 30, 40)
        texture.setRGBA(1, 50, 60, 70, 80)
        texture.setRGBA(5, 90, 100, 110, 120)

        // Assert
        expect(texture.getRGBA(0)).toEqual({ r: 10, g: 20, b: 30, a: 40 })
        expect(texture.getRGBA(1)).toEqual({ r: 50, g: 60, b: 70, a: 80 })
        expect(texture.getRGBA(5)).toEqual({ r: 90, g: 100, b: 110, a: 120 })
      })
    })

    describe('getFloat and setFloat', () => {
      it.each([
        { value: 0.0 },
        { value: 1.0 },
        { value: 0.5 },
        { value: 100.5 },
        { value: -50.25 }
      ])('should roundtrip float value $value', ({ value }) => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )

        // Act
        texture.setFloat(0, value)
        const result = texture.getFloat(0)

        // Assert
        expect(result).toBeCloseTo(value, 1)
      })

      it('should trigger onChange callback when setting float', () => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )

        // Act
        texture.setFloat(0, 42.5)

        // Assert
        expect(onChangeMock).toHaveBeenCalled()
      })

      it('should handle multiple particle indices', () => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )

        // Act
        texture.setFloat(0, 1.5)
        texture.setFloat(1, 2.5)
        texture.setFloat(5, 10.5)

        // Assert
        expect(texture.getFloat(0)).toBeCloseTo(1.5, 1)
        expect(texture.getFloat(1)).toBeCloseTo(2.5, 1)
        expect(texture.getFloat(5)).toBeCloseTo(10.5, 1)
      })
    })

    describe('getInteger and setInteger', () => {
      it.each([
        { value: 0 },
        { value: 1 },
        { value: 255 },
        { value: 1000 },
        { value: 16581375 }, // Max 24-bit value (255 * 255 * 255)
        { value: -100 },
        { value: -16581375 }
      ])('should roundtrip integer value $value', ({ value }) => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )

        // Act
        texture.setInteger(0, value)
        const result = texture.getInteger(0)

        // Assert
        expect(result).toBe(value)
      })

      it('should trigger onChange callback when setting integer', () => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )

        // Act
        texture.setInteger(0, 42)

        // Assert
        expect(onChangeMock).toHaveBeenCalled()
      })

      it('should handle multiple particle indices', () => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )

        // Act
        texture.setInteger(0, 100)
        texture.setInteger(1, 200)
        texture.setInteger(5, -300)

        // Assert
        expect(texture.getInteger(0)).toBe(100)
        expect(texture.getInteger(1)).toBe(200)
        expect(texture.getInteger(5)).toBe(-300)
      })
    })

    describe('dispose', () => {
      it('should call dispose on Three.js texture', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)
        const threeTexture = texture.getTexture()
        const disposeSpy = vi.spyOn(threeTexture, 'dispose')

        // Act
        texture.dispose()

        // Assert
        expect(disposeSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('texture update flag', () => {
      it('should set needsUpdate flag when setting RGBA', () => {
        // Arrange
        const texture = new DataTexture('testTexture', 10, 'rgba', onChangeMock)
        const threeTexture = texture.getTexture()
        threeTexture.needsUpdate = false

        // Act
        texture.setRGBA(0, 100, 150, 200, 250)

        // Assert
        expect(threeTexture.needsUpdate).toBe(true)
      })

      it('should set needsUpdate flag when setting float', () => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )
        const threeTexture = texture.getTexture()
        threeTexture.needsUpdate = false

        // Act
        texture.setFloat(0, 42.5)

        // Assert
        expect(threeTexture.needsUpdate).toBe(true)
      })

      it('should set needsUpdate flag when setting integer', () => {
        // Arrange
        const texture = new DataTexture(
          'testTexture',
          10,
          'float',
          onChangeMock
        )
        const threeTexture = texture.getTexture()
        threeTexture.needsUpdate = false

        // Act
        texture.setInteger(0, 42)

        // Assert
        expect(threeTexture.needsUpdate).toBe(true)
      })
    })
  })
})

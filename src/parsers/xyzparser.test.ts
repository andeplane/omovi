import { describe, it, expect } from 'vitest'
import parseXyz from './xyzparser'
import SimulationData from '../core/simulationdata/simulationdata'

describe('XYZ Parser', () => {
  describe('parseXyz', () => {
    it('should parse single frame with one atom', () => {
      const data = `1
Comment line
H 0.0 0.0 0.0
`
      const result = parseXyz(data)

      expect(result).toBeInstanceOf(SimulationData)
      expect(result.frames.length).toBe(1)
      expect(result.frames[0].particles.count).toBe(1)
    })

    it('should parse single frame with multiple atoms', () => {
      const data = `3
Water molecule
O 0.0 0.0 0.0
H 0.757 0.586 0.0
H -0.757 0.586 0.0
`
      const result = parseXyz(data)

      expect(result.frames.length).toBe(1)
      expect(result.frames[0].particles.count).toBe(3)
    })

    it('should parse multiple frames', () => {
      const data = `2
Frame 1
H 0.0 0.0 0.0
H 1.0 0.0 0.0
2
Frame 2
H 0.1 0.1 0.1
H 1.1 0.1 0.1
`
      const result = parseXyz(data)

      expect(result.frames.length).toBe(2)
      expect(result.frames[0].particles.count).toBe(2)
      expect(result.frames[1].particles.count).toBe(2)
    })

    it('should parse atomic coordinates correctly', () => {
      const data = `1
Test atom
C 1.5 2.5 3.5
`
      const result = parseXyz(data)
      const position = result.frames[0].particles.getPosition(0)

      expect(position.x).toBe(1.5)
      expect(position.y).toBe(2.5)
      expect(position.z).toBe(3.5)
    })

    it('should handle negative coordinates', () => {
      const data = `1
Negative coords
O -1.0 -2.0 -3.0
`
      const result = parseXyz(data)
      const position = result.frames[0].particles.getPosition(0)

      expect(position.x).toBe(-1.0)
      expect(position.y).toBe(-2.0)
      expect(position.z).toBe(-3.0)
    })

    it('should handle empty lines', () => {
      const data = `2

Frame with empty lines
H 0.0 0.0 0.0

H 1.0 0.0 0.0
`
      const result = parseXyz(data)

      expect(result.frames.length).toBe(1)
      expect(result.frames[0].particles.count).toBe(2)
    })

    it('should handle various element symbols', () => {
      const data = `5
Different elements
H 0.0 0.0 0.0
C 1.0 0.0 0.0
N 2.0 0.0 0.0
O 3.0 0.0 0.0
S 4.0 0.0 0.0
`
      const result = parseXyz(data)

      expect(result.frames[0].particles.count).toBe(5)
    })

    it('should handle whitespace in coordinates', () => {
      const data = `1
Whitespace test
H    1.0    2.0    3.0
`
      const result = parseXyz(data)
      const position = result.frames[0].particles.getPosition(0)

      expect(position.x).toBe(1.0)
      expect(position.y).toBe(2.0)
      expect(position.z).toBe(3.0)
    })

    it('should stop parsing on invalid numParticles (NaN)', () => {
      const data = `2
First frame
H 0.0 0.0 0.0
H 1.0 0.0 0.0
invalid
Second frame (should not be parsed)
O 0.0 0.0 0.0
`
      const result = parseXyz(data)

      expect(result.frames.length).toBe(1)
    })

    it('should handle scientific notation in coordinates', () => {
      const data = `1
Scientific notation
H 1.5e-10 2.3e5 -4.2e-3
`
      const result = parseXyz(data)
      const position = result.frames[0].particles.getPosition(0)

      expect(position.x).toBeCloseTo(1.5e-10)
      expect(position.y).toBeCloseTo(2.3e5)
      expect(position.z).toBeCloseTo(-4.2e-3)
    })

    it('should return empty simulation data for empty string', () => {
      const result = parseXyz('')

      expect(result).toBeInstanceOf(SimulationData)
      expect(result.frames.length).toBe(0)
    })

    it('should handle trailing newlines', () => {
      const data = `1
Test
H 0.0 0.0 0.0


`
      const result = parseXyz(data)

      expect(result.frames.length).toBe(1)
    })
  })
})


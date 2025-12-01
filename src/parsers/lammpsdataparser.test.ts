import { describe, it, expect } from 'vitest'
import parseLAMMPSData from './lammpsdataparser'
import SimulationData from '../core/simulationdata/simulationdata'

describe('LAMMPS Data Parser', () => {
  describe('parseLAMMPSData', () => {
    it('should parse atomic style data file', () => {
      const data = `LAMMPS data file

3 atoms
2 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi

Atoms # atomic

1 1 0.0 0.0 0.0
2 1 1.0 1.0 1.0
3 2 2.0 2.0 2.0
`
      const result = parseLAMMPSData(data)

      expect(result).toBeInstanceOf(SimulationData)
      expect(result.frames.length).toBe(1)
      expect(result.frames[0].particles.count).toBe(3)
    })

    it('should parse molecular style data file', () => {
      const data = `LAMMPS data file

2 atoms
1 atom types

0.0 5.0 xlo xhi
0.0 5.0 ylo yhi
0.0 5.0 zlo zhi

Atoms # molecular

1 1 1 0.0 0.0 0.0
2 1 1 1.0 0.0 0.0
`
      const result = parseLAMMPSData(data)

      expect(result.frames.length).toBe(1)
      expect(result.frames[0].particles.count).toBe(2)
    })

    it('should parse simulation cell correctly', () => {
      const data = `Test

1 atoms
1 atom types

1.0 3.0 xlo xhi
2.0 4.0 ylo yhi
5.0 10.0 zlo zhi

Atoms # atomic

1 1 0.0 0.0 0.0
`
      const result = parseLAMMPSData(data)
      const cell = result.frames[0].simulationCell

      expect(cell.a.x).toBe(2.0) // xhi - xlo
      expect(cell.b.y).toBe(2.0) // yhi - ylo
      expect(cell.c.z).toBe(5.0) // zhi - zlo
      expect(cell.origin.x).toBe(1.0)
      expect(cell.origin.y).toBe(2.0)
      expect(cell.origin.z).toBe(5.0)
    })

    it('should handle triclinic simulation cells', () => {
      const data = `Triclinic test

1 atoms
1 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi
1.0 2.0 3.0 xy xz yz

Atoms # atomic

1 1 0.0 0.0 0.0
`
      const result = parseLAMMPSData(data)
      const cell = result.frames[0].simulationCell

      expect(cell.b.x).toBe(1.0) // xy
      expect(cell.c.x).toBe(2.0) // xz
      expect(cell.c.y).toBe(3.0) // yz
    })

    it('should parse particle coordinates correctly', () => {
      const data = `Test

1 atoms
1 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi

Atoms # atomic

1 1 1.5 2.5 3.5
`
      const result = parseLAMMPSData(data)
      const position = result.frames[0].particles.getPosition(0)

      expect(position.x).toBe(1.5)
      expect(position.y).toBe(2.5)
      expect(position.z).toBe(3.5)
    })

    it('should handle comment lines', () => {
      const data = `Test
# This is a comment
2 atoms
# Another comment
1 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi

Atoms # atomic

1 1 0.0 0.0 0.0
2 1 1.0 1.0 1.0
`
      const result = parseLAMMPSData(data)

      expect(result.frames[0].particles.count).toBe(2)
    })

    it('should handle empty lines', () => {
      const data = `Test

2 atoms

1 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi

Atoms # atomic

1 1 0.0 0.0 0.0

2 1 1.0 1.0 1.0
`
      const result = parseLAMMPSData(data)

      expect(result.frames[0].particles.count).toBe(2)
    })

    it('should parse particle types correctly (0-indexed)', () => {
      const data = `Test

2 atoms
2 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi

Atoms # atomic

1 1 0.0 0.0 0.0
2 2 1.0 1.0 1.0
`
      const result = parseLAMMPSData(data)

      // Atomic style: type is used directly
      expect(result.frames[0].particles.getType(0)).toBe(1)
      expect(result.frames[0].particles.getType(1)).toBe(2)
    })

    it('should parse molecular style with molecule IDs', () => {
      const data = `Test

3 atoms
2 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi

Atoms # molecular

1 1 1 0.0 0.0 0.0
2 1 1 1.0 0.0 0.0
3 2 2 2.0 0.0 0.0
`
      const result = parseLAMMPSData(data)

      expect(result.frames[0].particles.count).toBe(3)
      // Molecular style: type - 1 is stored
      expect(result.frames[0].particles.getType(0)).toBe(0) // type 1 becomes 0
      expect(result.frames[0].particles.getType(2)).toBe(1) // type 2 becomes 1
    })

    it('should handle negative coordinates', () => {
      const data = `Test

1 atoms
1 atom types

-10.0 10.0 xlo xhi
-10.0 10.0 ylo yhi
-10.0 10.0 zlo zhi

Atoms # atomic

1 1 -5.0 -3.0 -1.0
`
      const result = parseLAMMPSData(data)
      const position = result.frames[0].particles.getPosition(0)

      expect(position.x).toBe(-5.0)
      expect(position.y).toBe(-3.0)
      expect(position.z).toBe(-1.0)
    })

    it('should throw ParseError for missing atoms section', () => {
      const data = `Test

2 atoms
1 atom types

0.0 10.0 xlo xhi
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi
`
      expect(() => parseLAMMPSData(data)).toThrow()
    })

    it('should throw ParseError for invalid format', () => {
      const data = `Test

2 atoms
1 atom types

invalid bounds line
0.0 10.0 ylo yhi
0.0 10.0 zlo zhi

Atoms # atomic

1 1 0.0 0.0 0.0
2 1 1.0 1.0 1.0
`
      expect(() => parseLAMMPSData(data)).toThrow()
    })
  })
})


import Particles from 'core/geometries/particles/particles'
import AtomTypes from 'core/atomtypes'
import SimulationData from 'core/simulationdata/simulationdata'
import SimulationDataFrame from 'core/simulationdata/simulationdataframe'

class ParseError extends Error { }


const ensureLineContains = (lineNumber: number, line: string, needle: string) {
  if (!line.includes(needle)) {
    throw new ParseError(`Error parsing LAMMPS Data File. Expected ${needle} on line ${lineNumber}.`)
  }
}

const ensureNotNull = (lineNumber: number, values: { [key: string]: string }) {
  for (let key in values) {
    if (values[key] == null) {
      throw new ParseError(`Error parsing LAMMPS Data File. Expected non-null value for ${key} on line ${lineNumber}.`)
    }
  }
}

const parseMolecular = (lines: string[], lineNumber: number, particles: Particles) {
  for (let j = 0; j < particles.count; j++) {
    const [id_str, molId_str, type, x_str, y_str, z_str] = lines[lineNumber + j].split(' ')
    ensureNotNull(lineNumber, { x: x_str, y: y_str, z: z_str, id: id_str, molId: molId_str, type })

    const x = parseFloat(x_str)
    const y = parseFloat(y_str)
    const z = parseFloat(z_str)
    const id = parseInt(id_str)
    const molId = parseInt(molId_str)
    const radius = 1.0
    const r = 255
    const g = 0
    const b = 0
    particles.add({ x, y, z, radius, type, r, g, b })
  }
}

const parseAtomic = (lines: string[], lineNumber: number, particles: Particles) {
  for (let j = 0; j < particles.count; j++) {
    const [id_str, type, x_str, y_str, z_str] = lines[lineNumber + j].split(' ')
    ensureNotNull(lineNumber, { x: x_str, y: y_str, z: z_str, id: id_str, type })

    const x = parseFloat(x_str)
    const y = parseFloat(y_str)
    const z = parseFloat(z_str)
    const id = parseInt(id_str)
    const radius = 1.0
    const r = 255
    const g = 0
    const b = 0
    particles.add({ x, y, z, radius, type, r, g, b })
  }
}

const parseLAMMPSData = (data: string) => {
  const lines = data.split('\n')
  let lineNumber = 1
  const numAtoms = parseInt(lines[lineNumber++].split(' ')[0])
  const numAtomTypes = parseInt(lines[lineNumber++].split(' ')[0])
  const [xlo, xhi] = lines[lineNumber++].split(' ').map(parseFloat)
  const [ylo, yhi] = lines[lineNumber++].split(' ').map(parseFloat)
  const [zlo, zhi] = lines[lineNumber++].split(' ').map(parseFloat)
  const [xy, xz, yz] = lines[lineNumber++].split(' ').map(parseFloat)
  lineNumber++
  ensureLineContains(lineNumber, lines[lineNumber], "Atoms")
  let isMolecular = lines[lineNumber].includes("molecular")
  lineNumber++
  lineNumber++
  const particles = new Particles(numAtoms)
  if (isMolecular) {
    parseMolecular(lines, lineNumber, particles)
  } else {
    parseAtomic(lines, lineNumber, particles)
  }

  return particles
}

export default parseLAMMPSData

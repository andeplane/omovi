import Particles from 'core/geometries/particles/particles'
import { getColor } from 'core/atomtypes'
import SimulationData from 'core/simulationdata/simulationdata'
import SimulationCell from 'core/simulationdata/simulationcell'
import SimulationDataFrame from 'core/simulationdata/simulationdataframe'

import * as THREE from 'three'

class ParseError extends Error { }

const ensureLineContains = (
  lineNumber: number,
  line: string,
  needle: string
) => {
  if (!line.includes(needle)) {
    throw new ParseError(
      `Error parsing LAMMPS Data File. Expected ${needle} on line ${lineNumber}. Line: ${line}`
    )
  }
}

const ensureNotNull = (
  lines: string[],
  lineNumber: number,
  values: { [key: string]: string }
) => {
  for (const key in values) {
    if (values[key] == null) {
      console.log('Found null value on line ', lines[lineNumber])
      throw new ParseError(
        `Error parsing LAMMPS Data File. Expected non-null value for ${key} on line ${lineNumber}. Line: ${lines[lineNumber]}`
      )
    }
  }
}

const parseMolecular = (
  lines: string[],
  lineNumber: number,
  particles: Particles
) => {
  for (let j = 0; j < particles.capacity; j++) {
    const [idStr, molIdStr, typeStr, xStr, yStr, zStr] = lines[
      lineNumber + j
    ].split(' ')
    ensureNotNull(lines, lineNumber, {
      x: xStr,
      y: yStr,
      z: zStr,
      id: idStr,
      molId: molIdStr,
      type: typeStr
    })

    const x = parseFloat(xStr)
    const y = parseFloat(yStr)
    const z = parseFloat(zStr)
    const id = parseInt(idStr)
    const molId = parseInt(molIdStr)
    const type = parseInt(typeStr)
    const radius = 1.0
    const color = getColor(type)
    particles.add({
      x,
      y,
      z,
      id,
      radius,
      type: typeStr,
      r: color.r,
      g: color.g,
      b: color.b
    })
  }
}

const parseAtomic = (
  lines: string[],
  lineNumber: number,
  particles: Particles
) => {
  for (let j = 0; j < particles.capacity; j++) {
    const [idStr, typeStr, xStr, yStr, zStr] = lines[lineNumber + j].split(' ')
    ensureNotNull(lines, lineNumber, {
      x: xStr,
      y: yStr,
      z: zStr,
      id: idStr,
      type: typeStr
    })

    const x = parseFloat(xStr)
    const y = parseFloat(yStr)
    const z = parseFloat(zStr)
    const id = parseInt(idStr)
    const type = parseInt(typeStr)
    const radius = 1.0
    const color = getColor(type)
    particles.add({
      x,
      y,
      z,
      id,
      radius,
      type: typeStr,
      r: color.r,
      g: color.g,
      b: color.b
    })
  }
}

const findNext = (
  lines: string[],
  lineNumber: number,
  needle?: string,
  callback?: (line: string) => void
) => {
  while (lineNumber < lines.length) {
    const line = lines[lineNumber].trim()
    if (line.startsWith('#')) {
      lineNumber++
      continue
    }
    if (line === '') {
      lineNumber++
      continue
    }
    if (needle) {
      if (line.includes(needle)) {
        if (callback) {
          callback(line)
        }
        return lineNumber + 1
      }
      throw new ParseError(
        `Error parsing LAMMPS Data File. Expected ${needle} on line ${lineNumber}. Line: ${lines[lineNumber]}`
      )
    }
    if (callback) {
      callback(line)
    }
    return lineNumber + 1
  }
  return lines.length
}

const getNextLineNumber = (
  lines: string[],
  lineNumber: number,
  needle?: string
) => {
  while (lineNumber < lines.length) {
    const line = lines[lineNumber].trim()
    if (line.startsWith('#')) {
      lineNumber++
      continue
    }
    if (line === '') {
      lineNumber++
      continue
    }
    if (needle) {
      if (line.includes(needle)) {
        return lineNumber
      }
    } else {
      return lineNumber
    }
    lineNumber++
  }
  return lineNumber
}

const parseLAMMPSData = (data: string) => {
  const lines = data.split('\n')
  let lineNumber = 0
  let numAtoms = 0
  let xlo = 0
  let xhi = 0
  let ylo = 0
  let yhi = 0
  let zlo = 0
  let zhi = 0

  lineNumber = findNext(lines, lineNumber + 1, ' atoms', (line: string) => {
    numAtoms = parseInt(line.split(' ')[0])
  })

  lineNumber = findNext(lines, lineNumber, ' atom types')

  lineNumber = findNext(lines, lineNumber, ' xlo xhi', (line: string) => {
    ;[xlo, xhi] = line.split(' ').map(parseFloat)
  })

  lineNumber = findNext(lines, lineNumber, ' ylo yhi', (line: string) => {
    ;[ylo, yhi] = line.split(' ').map(parseFloat)
  })

  lineNumber = findNext(lines, lineNumber, ' zlo zhi', (line: string) => {
    ;[zlo, zhi] = line.split(' ').map(parseFloat)
  })

  let xy = 0
  let xz = 0
  let yz = 0
  if (lines[lineNumber + 1].includes('xy xz yz')) {
    lineNumber = findNext(
      lines,
      lineNumber + 1,
      ' xy xz yz',
      (line: string) => {
        ;[xy, xz, yz] = line.split(' ').map(parseFloat)
      }
    )
  }

  // Ignore other fields as Masses and Pair Coeffs etc
  lineNumber = getNextLineNumber(lines, lineNumber, 'Atoms')
  console.log(
    `Found Atoms on line ${lineNumber - 1} which is line ${
    lines[lineNumber - 1]
    }`
  )

  let isMolecular = false
  lineNumber = findNext(lines, lineNumber, 'Atoms', (line) => {
    isMolecular = line.includes('molecular')
  })
  lineNumber++

  const particles = new Particles(numAtoms)

  while (lines[lineNumber].trim() === '') {
    lineNumber++
  }

  if (isMolecular) {
    parseMolecular(lines, lineNumber, particles)
  } else {
    parseAtomic(lines, lineNumber, particles)
  }
  const simulationCell = new SimulationCell(
    new THREE.Vector3(xhi - xlo, 0, 0),
    new THREE.Vector3(xy, yhi - ylo, 0),
    new THREE.Vector3(xz, yz, zhi - zlo),
    new THREE.Vector3(xlo, ylo, zlo)
  )
  const simulationDataFrame = new SimulationDataFrame(particles, simulationCell)
  const simulationData = new SimulationData()
  simulationData.frames.push(simulationDataFrame)
  return simulationData
}

export default parseLAMMPSData

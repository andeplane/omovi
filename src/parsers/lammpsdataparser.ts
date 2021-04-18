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
      `Error parsing LAMMPS Data File. Expected ${needle} on line ${lineNumber}.`
    )
  }
}

const ensureNotNull = (
  lineNumber: number,
  values: { [key: string]: string }
) => {
  for (const key in values) {
    if (values[key] == null) {
      throw new ParseError(
        `Error parsing LAMMPS Data File. Expected non-null value for ${key} on line ${lineNumber}.`
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
    ensureNotNull(lineNumber, {
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
  for (let j = 0; j < particles.count; j++) {
    const [idStr, type, xStr, yStr, zStr] = lines[lineNumber + j].split(' ')
    ensureNotNull(lineNumber, {
      x: xStr,
      y: yStr,
      z: zStr,
      id: idStr,
      type
    })

    const x = parseFloat(xStr)
    const y = parseFloat(yStr)
    const z = parseFloat(zStr)
    const id = parseInt(idStr)
    const radius = 1.0
    const r = 255
    const g = 0
    const b = 0
    particles.add({ x, y, z, id, radius, type, r, g, b })
  }
}

const parseLAMMPSData = (data: string) => {
  const lines = data.split('\n')
  let lineNumber = 1
  ensureLineContains(lineNumber, lines[lineNumber], ' atoms')
  const numAtoms = parseInt(lines[lineNumber++].split(' ')[0])
  ensureLineContains(lineNumber, lines[lineNumber], ' atom types')
  const numAtomTypes = parseInt(lines[lineNumber++].split(' ')[0])
  ensureLineContains(lineNumber, lines[lineNumber], ' xlo xhi')
  const [xlo, xhi] = lines[lineNumber++].split(' ').map(parseFloat)
  ensureLineContains(lineNumber, lines[lineNumber], ' ylo yhi')
  const [ylo, yhi] = lines[lineNumber++].split(' ').map(parseFloat)
  ensureLineContains(lineNumber, lines[lineNumber], ' zlo zhi')
  const [zlo, zhi] = lines[lineNumber++].split(' ').map(parseFloat)
  let xy = 0
  let xz = 0
  let yz = 0
  if (lines[lineNumber].includes('xy xz yz')) {
    ;[xy, xz, yz] = lines[lineNumber++].split(' ').map(parseFloat)
  }
  lineNumber++
  ensureLineContains(lineNumber, lines[lineNumber], 'Atoms')
  const isMolecular = lines[lineNumber].includes('molecular')
  lineNumber++
  lineNumber++
  const particles = new Particles(numAtoms)

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
  console.log(`Found ${particles.count} particles in file`)
  return simulationData
}

export default parseLAMMPSData

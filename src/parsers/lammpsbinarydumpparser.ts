import Particles from '../core/geometries/particles/particles'
import SimulationData from '../core/simulationdata/simulationdata'
import SimulationDataFrame from '../core/simulationdata/simulationdataframe'
import SimulationCell from '../core/simulationdata/simulationcell'
import * as THREE from 'three'
import { getColor } from '../core/atomtypes'
import { Parser } from 'binary-parser'

interface TriclinicData {
  xy: number
  xz: number
  yz: number
}

interface HeaderData {
  numTimesteps: bigint
  numAtoms: bigint
  isTriclinic: number
  boundary0: number
  boundary1: number
  boundary2: number
  boundary3: number
  boundary4: number
  boundary5: number
  xlo: number
  xhi: number
  ylo: number
  yhi: number
  zlo: number
  zhi: number
  triclinic?: TriclinicData
  sizeOne: number
  numChunks: number
  headerOffset: number
}

interface ChunkData {
  bufferSize: number
  buffer: number[]
  chunkOffset: number
}

const parseHeader = (buffer: Buffer, offset: number = 0): HeaderData => {
  const triclinicParser = new Parser()
    .endianess('little')
    .doublele('xy')
    .doublele('xz')
    .doublele('yz')

  const noParser = new Parser()

  // const ipHeader = getHeader()
  const ipHeader = new Parser()
    .endianess('little')
    .seek(offset)
    .int64('numTimesteps')
    .int64('numAtoms')
    .int32('isTriclinic')
    .int32('boundary0')
    .int32('boundary1')
    .int32('boundary2')
    .int32('boundary3')
    .int32('boundary4')
    .int32('boundary5')
    .doublele('xlo')
    .doublele('xhi')
    .doublele('ylo')
    .doublele('yhi')
    .doublele('zlo')
    .doublele('zhi')
    .choice('triclinic', {
      tag: 'isTriclinic',
      choices: {
        1: triclinicParser,
        0: noParser
      }
    })
    .int32('sizeOne')
    .int32('numChunks')
    .saveOffset('headerOffset')

  return ipHeader.parse(buffer)
}

const parseFrame = (buffer: Buffer, offset: number = 0) => {
  const header = parseHeader(buffer, offset)

  offset = header.headerOffset // This new offset includes the header
  const particles = new Particles(Number(header.numAtoms))

  for (let chunkIndex = 0; chunkIndex < header.numChunks; chunkIndex++) {
    const chunkParser = new Parser()
      .endianess('little')
      .seek(offset)
      .int32le('bufferSize')
      .array('buffer', { type: 'doublele', length: 'bufferSize' })
      .saveOffset('chunkOffset')
    const chunk = chunkParser.parse(buffer) as ChunkData
    offset = chunk.chunkOffset // New offset including the chunk
    // Add particles from chunk
    for (
      let particleIndex = 0;
      particleIndex < header.numAtoms;
      particleIndex++
    ) {
      const id = chunk.buffer[0 + particleIndex * header.sizeOne]
      const type = chunk.buffer[1 + particleIndex * header.sizeOne]
      const x = chunk.buffer[2 + particleIndex * header.sizeOne]
      const y = chunk.buffer[3 + particleIndex * header.sizeOne]
      const z = chunk.buffer[4 + particleIndex * header.sizeOne]
      const typeStr = type.toString()
      particles.add(x, y, z, id, type)
    }
  }

  let xy = 0
  let xz = 0
  let yz = 0
  if (header.isTriclinic && header.triclinic) {
    xy = header.triclinic.xy
    xz = header.triclinic.xz
    yz = header.triclinic.yz
  }
  // Create frame from all particles and update simulation cell
  const simulationDataFrame = new SimulationDataFrame(particles)
  simulationDataFrame.simulationCell = new SimulationCell(
    new THREE.Vector3(header.xhi - header.xlo, 0, 0),
    new THREE.Vector3(xy, header.yhi - header.ylo, 0),
    new THREE.Vector3(xz, yz, header.zhi - header.zlo),
    new THREE.Vector3(header.xlo, header.ylo, header.zlo)
  )
  return {
    simulationDataFrame: new SimulationDataFrame(particles),
    offset
  }
}

const parse = (arrayBuffer: ArrayBuffer) => {
  const mainBuffer = Buffer.from(arrayBuffer)

  const simulationData = new SimulationData()
  let offset = 0
  while (offset < mainBuffer.length) {
    const response = parseFrame(mainBuffer, offset)
    offset = response.offset
    simulationData.frames.push(response.simulationDataFrame)
  }
  return simulationData
}

export default parse

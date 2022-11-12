import Particles from 'core/geometries/particles/particles'
import SimulationData from 'core/simulationdata/simulationdata'
import SimulationDataFrame from 'core/simulationdata/simulationdataframe'
import * as THREE from 'three'
import { getColor } from 'core/atomtypes'
// @ts-ignore
import { Parser } from 'binary-parser'
import SimulationCell from 'core/simulationdata/simulationcell'

const parseHeader = (buffer: Buffer, offset: number = 0) => {
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
    // @ts-ignore
    .saveOffset('headerOffset')

  return ipHeader.parse(buffer)
}

const parseFrame = (buffer: Buffer, offset: number = 0) => {
  const header = parseHeader(buffer, offset)

  // @ts-ignore
  offset = header.headerOffset // This new offset includes the header
  const particles = new Particles(Number(header.numAtoms))

  // @ts-ignore
  for (let chunkIndex = 0; chunkIndex < header.numChunks; chunkIndex++) {
    const chunkParser = new Parser()
      .endianess('little')
      // @ts-ignore
      .seek(offset)
      .int32le('bufferSize')
      .array('buffer', { type: 'doublele', length: 'bufferSize' })
      // @ts-ignore
      .saveOffset('chunkOffset')
    const chunk = chunkParser.parse(buffer)
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
      particles.add({
        x,
        y,
        z,
        id,
        type,
      })
    }
  }

  let xy, xz, yz
  if (header.isTriclinic) {
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

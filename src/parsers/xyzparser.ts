import Particles from 'core/geometries/particles/particles'
import AtomTypes from 'core/atomtypes'
import SimulationData from 'core/simulationdata/simulationdata'
import SimulationDataFrame from 'core/simulationdata/simulationdataframe'

function addParticlesToFrame(lines: string[], i: number, particles: Particles) {
  for (let j = 0; j < particles.capacity; j++) {
    const lineData = lines[i + j].split(/\s+/).filter(Boolean)
    const element = lineData[0]

    const atomType = AtomTypes[element]
    let color = { r: 255, g: 102, b: 102 }
    let radius = 1.0
    if (atomType) {
      radius = atomType.radius
    }
    const x = parseFloat(lineData[1])
    const y = parseFloat(lineData[2])
    const z = parseFloat(lineData[3])
    const id = j

    particles.add({
      x,
      y,
      z,
      id,
      type: 1
    })
  }
}

const parseXyz = (data: string): SimulationData => {
  let particles: Particles | undefined
  const frames: SimulationDataFrame[] = []

  const lines = data.split('\n')
  const numLines = lines.length
  let i = 0
  let skipNextLine = false
  let readNumParticles = true

  while (i < numLines) {
    if (lines[i] === '') {
      i++
      continue
    }

    if (skipNextLine) {
      skipNextLine = false
    } else if (readNumParticles) {
      const numParticles = parseInt(lines[i], 10)

      if (isNaN(numParticles)) {
        console.log('Warning, got NaN as numParticles')
        break
      }

      particles = new Particles(numParticles)
      readNumParticles = false
      skipNextLine = true
    } else {
      if (particles) {
        addParticlesToFrame(lines, i, particles)
        const frame = new SimulationDataFrame(particles)
        frames.push(frame)
        i += particles.count - 1
        readNumParticles = true
      }
    }

    i++
  }

  const simulationData = new SimulationData()
  simulationData.frames = frames

  return simulationData
}

export default parseXyz

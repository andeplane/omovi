import Particles from 'core/geometries/particles/particles'
import AtomTypes from 'core/atomtypes'

function addParticlesToFrame(lines: string[], i: number, frame: Particles) {
  for (let j = 0; j < frame.capacity; j++) {
    const lineData = lines[i + j].split(/\s+/).filter(Boolean)
    const element = lineData[0]

    const atomType = AtomTypes[element]
    let color = { r: 255, g: 102, b: 102 }
    let radius = 1.0
    if (atomType) {
      radius = atomType.radius
      color = atomType.color
    }
    const x = parseFloat(lineData[1])
    const y = parseFloat(lineData[2])
    const z = parseFloat(lineData[3])

    frame.add(x, y, z, radius, color.r, color.g, color.b)
  }
}

const parseXyz = (data: string): Particles[] => {
  let currentFrame: Particles | undefined
  const frames: Particles[] = []

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
        return frames
      }

      currentFrame = new Particles(numParticles)
      readNumParticles = false
      skipNextLine = true
    } else {
      if (currentFrame) {
        addParticlesToFrame(lines, i, currentFrame)
        frames.push(currentFrame)
        i += currentFrame.count - 1
        readNumParticles = true
      }
    }

    i++
  }
  return frames
}

export default parseXyz

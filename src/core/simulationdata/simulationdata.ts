import SimulationDataFrame from './simulationdataframe'
import Bonds from 'core/geometries/bonds/bonds'

export default class SimulationData {
  frames: SimulationDataFrame[]
  generateBondsFunction?: (frame: SimulationDataFrame) => Bonds
  constructor() {
    this.frames = []
  }

  getFrame = (index: number) => {
    const frame = this.frames[index]
    if (this.generateBondsFunction && frame.bonds == null) {
      const bonds = this.generateBondsFunction(frame)
      if (bonds.count > 0) {
        frame.bonds = bonds
      }
    }

    return frame
  }

  getNumFrames = () => {
    return this.frames.length
  }

  getUniqueParticleTypes = () => {
    const particleTypes: number[] = []

    this.frames.forEach((frame) => {
      particleTypes.push(...frame.particleTypes)
    })
    return [...new Set(particleTypes)].sort()
  }
}

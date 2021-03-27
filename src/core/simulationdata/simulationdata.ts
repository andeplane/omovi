import SimulationDataFrame from './simulationdataframe'

export default class SimulationData {
  frames: SimulationDataFrame[]
  currentFrame: number
  constructor() {
    this.frames = []
    this.currentFrame = 0
  }

  getNumFrames = () => {
    return this.frames.length
  }
}

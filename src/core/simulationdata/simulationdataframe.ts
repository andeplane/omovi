import Particles from 'core/geometries/particles/particles'
import Bonds from 'core/geometries/bonds/bonds'

export default class SimulationDataFrame {
  particles: Particles
  bonds?: Bonds
  constructor(particles: Particles) {
    this.particles = particles
  }
}

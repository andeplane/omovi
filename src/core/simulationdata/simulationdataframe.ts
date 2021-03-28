import Particles from 'core/geometries/particles/particles'
import Bonds from 'core/geometries/bonds/bonds'

export default class SimulationDataFrame {
  particleTypes: string[]
  particles: Particles
  bonds?: Bonds

  constructor(particles: Particles) {
    this.particles = particles

    const particleTypeMap: { [key: string]: boolean } = {}
    particles.types.forEach((particleType: string) => {
      particleTypeMap[particleType] = true
    })

    // @ts-ignore
    this.particleTypes = Object.keys(particleTypeMap)
  }
}

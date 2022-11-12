import * as THREE from 'three'
import Particles from 'core/geometries/particles/particles'
import Bonds from 'core/geometries/bonds/bonds'
import SimulationCell from './simulationcell'

export default class SimulationDataFrame {
  simulationCell: SimulationCell
  particleTypes: number[]
  particles: Particles
  bonds?: Bonds

  constructor(particles: Particles, simulationCell?: SimulationCell) {
    this.particles = particles

    const particleTypeMap: boolean[] = []
    particles.types.forEach((particleType: number) => {
      particleTypeMap[particleType] = true
    })

    // @ts-ignore
    this.particleTypes = Object.keys(particleTypeMap)

    if (simulationCell) {
      this.simulationCell = simulationCell
    } else {
      this.simulationCell = this.generateSimulationCell()
    }
  }

  generateSimulationCell = () => {
    let box = new THREE.Box3()
    for (let i = 0; i < this.particles.count; i++) {
      box = box.expandByPoint(this.particles.getPosition(i))
    }

    const size = box.getSize(new THREE.Vector3())
    const origin = box
      .getCenter(new THREE.Vector3())
      .sub(size.clone().multiplyScalar(0.5))
    const simulationCell = new SimulationCell(
      new THREE.Vector3(size.x, 0, 0),
      new THREE.Vector3(0, size.y, 0),
      new THREE.Vector3(0, 0, size.x),
      origin
    )
    return simulationCell
  }
}

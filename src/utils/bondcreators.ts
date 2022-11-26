import SimulationDataFrame from '../core/simulationdata/simulationdataframe'
import Bonds from '../core/geometries/bonds/bonds'
import Kdtree from './kdtree/kdtree'

type CreateBondsByDistanceOptions = {
  radius: number
  pairDistances: { type1: string; type2: string; distance: number }[]
}

const createBondsByDistance = ({
  radius = 0.5,
  pairDistances = []
}: CreateBondsByDistanceOptions) => {
  return (frame: SimulationDataFrame) => {
    const particles = frame.particles
    const distance = (a: Float32Array, b: Float32Array) => {
      return (
        Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2) +
        Math.pow(a[2] - b[2], 2)
      )
    }

    // Create map so we can do lookups like pairDistancesMap["H"]["O"] to find 1.4
    const pairDistancesMap: { [key: string]: { [key: string]: number } } = {}
    pairDistances.forEach((pairDistance) => {
      if (pairDistancesMap[pairDistance.type1] == null) {
        pairDistancesMap[pairDistance.type1] = {}
      }
      if (pairDistancesMap[pairDistance.type2] == null) {
        pairDistancesMap[pairDistance.type2] = {}
      }

      pairDistancesMap[pairDistance.type1][pairDistance.type2] =
        pairDistance.distance
      pairDistancesMap[pairDistance.type2][pairDistance.type1] =
        pairDistance.distance
    })
    const pairs: { [key: string]: boolean } = {}

    var tree = new Kdtree(
      particles.positions.subarray(0, 3 * particles.count),
      distance
    )

    const position1: THREE.Vector3[] = []
    const position2: THREE.Vector3[] = []

    for (let i = 0; i < particles.count; i++) {
      const particle1Type = particles.getType(i)
      if (pairDistancesMap[particle1Type] == null) {
        // We have no bonds for this particle type
        continue
      }
      const nearest = tree.nearest(
        particles.positions.subarray(3 * i, 3 * (i + 1)),
        4,
        1.4
      )
      for (let j = 0; j < nearest.length; j++) {
        const nodeIndex = nearest[j][0]
        const index = tree.indices[tree.nodes[nodeIndex]]
        if (index === i) {
          // Skip ourselves, as we always will find that with distance zero
          continue
        }

        const particle2Type = particles.getType(index)

        if (pairDistancesMap[particle1Type][particle2Type] == null) {
          // We have no bonds for this pair of particle types
          continue
        }

        const distanceThreshold = pairDistancesMap[particle1Type][particle2Type]
        const distance = nearest[j][1]
        if (distance > distanceThreshold) {
          // Particle pair is too far away
          continue
        }
        const pairKey = index < i ? `${index}-${i}` : `${i}-${index}`

        if (pairs[pairKey] == null) {
          position1.push(particles.getPosition(i))
          position2.push(particles.getPosition(index))
          pairs[pairKey] = true
        }
      }
    }

    const bonds = new Bonds(position1.length)
    for (let i = 0; i < position1.length; i++) {
      bonds.add(
        position1[i].x,
        position1[i].y,
        position1[i].z,
        position2[i].x,
        position2[i].y,
        position2[i].z,
        radius
      )
    }

    return bonds
  }
}

export { createBondsByDistance }

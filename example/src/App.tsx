import React, {useEffect, useState} from 'react'
import * as THREE from 'three'

import { OMOVIVisualizer, Particles, Bonds, Kdtree, SimulationData, SimulationDataFrame, parseXyz } from 'omovi'
//@ts-ignore
// import {kdTree} from 'kd-tree-javascript'
import 'omovi/dist/index.css'

// const particles = new Particles(2)
// particles.add(-1, 0, 0, 0.5);
// particles.add(1, 0, 0, 0.5);

// const bonds = new Bonds(1)
// bonds.add(-1, 0, 0, 1, 0, 0, 0.1)

const positions: THREE.Vector3[] = []
const positionsArray: Float32Array = new Float32Array(30000)
for (let i = 0; i < 10000; i++) {
  const x = Math.random() * 100
  const y = Math.random() * 100
  const z = Math.random() * 100
  positions.push(new THREE.Vector3(x,y,z))
  positionsArray[3 * i + 0] = x
  positionsArray[3 * i + 1] = y
  positionsArray[3 * i + 2] = z
}

const generateBonds = (frame: SimulationDataFrame) => {
  const radius = 0.5
  const particles = frame.particles
  const distance = (a: Float32Array, b: Float32Array) => {
    return Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2) + Math.pow(a[2]-b[2], 2);
  }
  
  const pairs: {[key: string]: boolean} = {}

  var tree = new Kdtree(particles.positions.subarray(0, 3 * particles.count), distance);

  const position1: THREE.Vector3[] = []
  const position2: THREE.Vector3[] = []

  let maxDistance = 0
  for (let i = 0; i < particles.count; i++) {
    const nearest = tree.nearest(particles.positions.subarray(3 * i, 3 * (i+1)), 4, 1.4);
    for (let j = 0; j < nearest.length; j++) {
      const nodeIndex = nearest[j][0]
      const index = tree.indices[ tree.nodes[ nodeIndex ] ]
      const distance = nearest[j][1]
      if (index === i) {
        // Skip ourselves, as we always will find that with distance zero
        continue
      }
      const pairKey = index < i ? `${index}-${i}` : `${i}-${index}`
      maxDistance = Math.max(maxDistance, distance);
      
      if (pairs[pairKey] == null) {
        position1.push(particles.getPosition(i))
        position2.push(particles.getPosition(index))
        pairs[pairKey] = true
      }
    }
  }

  const bonds = new Bonds(position1.length)
  for (let i = 0; i < position1.length; i++) {
    bonds.add(position1[i].x, position1[i].y, position1[i].z, position2[i].x, position2[i].y, position2[i].z, radius)
  }

  return bonds
}

const App = () => {
  const [data, setData] = useState<SimulationData>()
  const [frame, setFrame] = useState<number>(0)
  
  useEffect(() => {
    const downloadData = async () => {
      const xyzFile = await fetch("https://raw.githubusercontent.com/andeplane/simulations/main/water.xyz")
      const simulationData = parseXyz(await xyzFile.text())
      simulationData.generateBondsFunction = generateBonds
      setData(simulationData)
    }
    downloadData()

  }, [])

  setTimeout(() => {
    if (data == null) {
      return
    }

    let nextFrame = frame + 1
    if (nextFrame >= data.getNumFrames()) {
      nextFrame = 0
    }
    setFrame(nextFrame)
  }, 50)
  
  if (data == null) {
    return <>Downloading simulation data ...</>
  }
  const currentFrame = data.getFrame(frame)
  // test()
  return <OMOVIVisualizer particles={currentFrame.particles} bonds={currentFrame.bonds} />
}

export default App

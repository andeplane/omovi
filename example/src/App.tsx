import React, {useEffect, useState} from 'react'
import * as THREE from 'three'

import { OMOVIVisualizer, Particles, Bonds, createBondsByDistance, SimulationData, SimulationDataFrame, parseXyz } from 'omovi'
import 'omovi/dist/index.css'

const App = () => {
  const [data, setData] = useState<SimulationData>()
  const [frame, setFrame] = useState<number>(0)
  
  useEffect(() => {
    const downloadData = async () => {
      const xyzFile = await fetch("https://raw.githubusercontent.com/andeplane/simulations/main/water.xyz")
      const simulationData = parseXyz(await xyzFile.text())
      simulationData.generateBondsFunction = createBondsByDistance({radius: 0.5, pairDistances: [{type1: 'H', type2: 'O', distance: 1.4}]})
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

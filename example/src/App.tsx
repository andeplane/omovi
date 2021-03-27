import React, {useEffect, useState} from 'react'

import { OMOVIVisualizer, Particles, Bonds, SimulationData, parseXyz } from 'omovi'

import 'omovi/dist/index.css'

// const particles = new Particles(2)
// particles.add(-1, 0, 0, 0.5);
// particles.add(1, 0, 0, 0.5);

// const bonds = new Bonds(1)
// bonds.add(-1, 0, 0, 1, 0, 0, 0.1)


const App = () => {
  const [data, setData] = useState<SimulationData>()
  const [frame, setFrame] = useState<number>(0)
  
  useEffect(() => {
    const downloadData = async () => {
      const xyzFile = await fetch("https://raw.githubusercontent.com/andeplane/simulations/main/lj.xiz")
      const simulationData = parseXyz(await xyzFile.text())
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
  const currentFrame = data.frames[frame]
  
  return <OMOVIVisualizer particles={currentFrame.particles} bonds={currentFrame.bonds} />
}

export default App

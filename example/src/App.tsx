import React, {useEffect, useState} from 'react'

import { OMOVIVisualizer, Particles, parseXyz } from 'omovi'

import 'omovi/dist/index.css'

const App = () => {
  const [data, setData] = useState<Particles[]>([])
  const [frame, setFrame] = useState<number>(0)
  
  useEffect(() => {
    const downloadData = async () => {
      const xyzFile = await fetch("https://raw.githubusercontent.com/andeplane/simulations/main/lj.xiz")
      const particles = parseXyz(await xyzFile.text())
      setData(particles)
    }
    downloadData()

  }, [])

  setTimeout(() => {
    if (data.length === 0) {
      return
    }

    let nextFrame = frame + 1
    if (nextFrame >= data.length) {
      nextFrame = 0
    }
    setFrame(nextFrame)
  }, 50)
  
  if (data.length === 0) {
    return <>Downloading simulation data ...</>
  }
  const particles = data[frame]
  
  return <OMOVIVisualizer particles={particles} />
}

export default App

import React, {useEffect, useState} from 'react'

import { OMOVIVisualizer, Particles, parseXyz } from 'omovi'

import 'omovi/dist/index.css'
const N = 100000;
const particles1 = new Particles(N);
particles1.addParticle(-0.5, 0, 0, 0.5)
particles1.addParticle(0.5, 0, 0, 0.5)

const particles2 = new Particles(N);
particles2.addParticle(-0.5, 0.5, 0, 0.5)
particles2.addParticle(0.5, -0.5, 0, 0.5)

for (let i = 0; i < N; i++) {
  let x = 500 * (Math.random() - 0.5);
  let y = 500 * (Math.random() - 0.5);
  let z = 500 * (Math.random() - 0.5);
  let r = 0.5 + Math.random();
  particles1.addParticle(x,y,z,r)

  x = 500 * (Math.random() - 0.5);
  y = 500 * (Math.random() - 0.5);
  z = 500 * (Math.random() - 0.5);
  r = 0.5 + Math.random();
  particles2.addParticle(x,y,z,r)
}

const App = () => {
  const [data, setData] = useState<Particles[]>([])
  const [frame, setFrame] = useState<number>(0)
  
  useEffect(() => {
    const downloadData = async () => {
      console.log("Will download data")
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

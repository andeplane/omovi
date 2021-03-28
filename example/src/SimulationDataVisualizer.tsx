import React, {useEffect, useState} from 'react'
import * as THREE from 'three'

import { OMOVIVisualizer, Particles, Bonds, createBondsByDistance, SimulationData, SimulationDataFrame, parseXyz } from 'omovi'
import 'omovi/dist/index.css'
import PlayControls from './PlayControls'

const createBondsFunction = createBondsByDistance({radius: 0.5, pairDistances: [{type1: 'H', type2: 'O', distance: 1.4}]})

const SimulationDataVisualizer = ({url, simulationData}: {url?: string, simulationData?: string}) => {
  const [data, setData] = useState<SimulationData>()
  const [frame, setFrame] = useState<number>(0)
  
  useEffect(() => {
    if (url != null) {
      const downloadData = async () => {
        const xyzFile = await fetch(url)
        const simulationData = parseXyz(await xyzFile.text())
        simulationData.generateBondsFunction = createBondsFunction
        setData(simulationData)
        setFrame(0)
      }
      downloadData()
    }

  }, [url])

  useEffect(() => {
    if (simulationData != null) {
      const simData = parseXyz(simulationData)
      simData.generateBondsFunction = createBondsFunction
      setData(simData)
      setFrame(0)
    }

  }, [simulationData])

  if (data == null) {
    return <>Downloading simulation data ...</>
  }
  const currentFrame = data.getFrame(frame)
  if (currentFrame == null) {
    return <>No simulation data ...</>
  }

  const onFrameChanged = (newFrame: number) => {
    setFrame(newFrame)
  }
  
  return  (
    <>
      <OMOVIVisualizer particles={currentFrame.particles} bonds={currentFrame.bonds} />
      <PlayControls numFrames={data.getNumFrames()} onFrameChanged={onFrameChanged} playing={true} />
    </>
  )
}

export default SimulationDataVisualizer

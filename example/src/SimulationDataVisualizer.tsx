import React, { useEffect, useState } from 'react'
import * as THREE from 'three'

import { OMOVIVisualizer, Particles, Bonds, createBondsByDistance, SimulationData, SimulationDataFrame, parseXyz } from 'omovi'
import PlayControls from './PlayControls'

// const createBondsFunction = createBondsByDistance({radius: 0.5, pairDistances: [{type1: 'H', type2: 'O', distance: 1.4}]})
interface SimulationDataVisualizerProps {
  simulationData?: SimulationData
}
const SimulationDataVisualizer = ({ simulationData }: SimulationDataVisualizerProps) => {
  const [frame, setFrame] = useState<number>(0)
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3>()
  const [cameraPosition, setCameraPosition] = useState<THREE.Vector3>()

  // useEffect(() => {
  //   if (url != null) {
  //     const downloadData = async () => {
  //       const xyzFile = await fetch(url)
  //       const simulationData = parseXyz(await xyzFile.text())
  //       simulationData.generateBondsFunction = createBondsFunction
  //       setData(simulationData)
  //       setFrame(0)
  //       const simulationCell = simulationData.frames[0].simulationCell
  //       const boundingBox = simulationCell.getBoundingBox()
  //       const center = simulationCell.getCenter()

  //       setCameraTarget(center)

  //       const position = center.clone().add(boundingBox.max.clone().sub(center).multiplyScalar(2.5))
  //       setCameraPosition(position)
  //     }
  //     downloadData()
  //   }

  // }, [url])

  useEffect(() => {
    if (simulationData != null) {
      // simData.generateBondsFunction = createBondsFunction
      setFrame(0)
      const simulationCell = simulationData.frames[0].simulationCell
      const center = simulationCell.getCenter()
      const boundingBox = simulationCell.getBoundingBox()

      setCameraTarget(center)

      const position = center.clone().add(boundingBox.max.clone().sub(center).multiplyScalar(3.5))
      setCameraPosition(position)
      setCameraTarget(simulationData.frames[0].simulationCell.getCenter())
    }
    console.log("Changed sim data.")

  }, [simulationData])

  if (simulationData == null) {
    return <>Downloading simulation data ...</>
  }

  const currentFrame = simulationData.getFrame(frame)
  if (currentFrame == null) {
    return <>No simulation data ...</>
  }

  const onFrameChanged = (newFrame: number) => {
    setFrame(newFrame)
  }

  return (
    <>
      <OMOVIVisualizer particles={currentFrame.particles} bonds={currentFrame.bonds} cameraTarget={cameraTarget} cameraPosition={cameraPosition} />
      <PlayControls numFrames={simulationData.getNumFrames()} onFrameChanged={onFrameChanged} playing={true} />
    </>
  )
}

export default SimulationDataVisualizer

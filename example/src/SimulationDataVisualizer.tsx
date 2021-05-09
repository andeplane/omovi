import React, { useEffect, useState } from 'react'
import * as THREE from 'three'
import {useStoreState, useStoreActions} from 'hooks'
import { OMOVIVisualizer, SimulationData, AtomTypes, getColor } from 'omovi'
import PlayControls from './PlayControls'

// const createBondsFunction = createBondsByDistance({radius: 0.5, pairDistances: [{type1: 'H', type2: 'O', distance: 1.4}]})
interface SimulationDataVisualizerProps {
  simulationData?: SimulationData
}
const SimulationDataVisualizer = ({ simulationData }: SimulationDataVisualizerProps) => {
  const [frame, setFrame] = useState<number>(0)
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3>()
  const [cameraPosition, setCameraPosition] = useState<THREE.Vector3>()
  
  const colorMap = useStoreState(state => state.colors.colorMap)
  const setColorMap = useStoreActions(actions => actions.colors.setColorMap)

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

      const particleTypes = simulationData.getUniqueParticleTypes()
      particleTypes.forEach( (particleType: string, index: number) => {
        if (colorMap[particleType] == null) {
          if (AtomTypes[particleType] != null) {
            const color = AtomTypes[particleType].color
            colorMap[particleType] = color
            return
          } 

          if (!isNaN(parseInt(particleType))) {
            const type = parseInt(particleType)
            colorMap[particleType] = getColor(type)
            return
          }

          colorMap[particleType] = getColor(index)
        }
      })
      setColorMap(colorMap)

    }
  }, [colorMap, setColorMap, simulationData])

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

  const colors = [
    {r: 255, g: 0, b: 0},
    {r: 255, g: 255, b: 255},
    {r: 255, g: 255, b: 255},
  ]

  return (
    <>
      <OMOVIVisualizer colors={colors} particles={currentFrame.particles} bonds={currentFrame.bonds} cameraTarget={cameraTarget} cameraPosition={cameraPosition} />
      <PlayControls numFrames={simulationData.getNumFrames()} onFrameChanged={onFrameChanged} playing={true} />
    </>
  )
}

export default SimulationDataVisualizer

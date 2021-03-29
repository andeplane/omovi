import 'antd/dist/antd.css'
import React, {useEffect, useState} from 'react'
import * as THREE from 'three'

import FileUpload from './FileUpload'

import { OMOVIVisualizer, Particles, Bonds, createBondsByDistance, SimulationData, SimulationDataFrame, parseXyz } from 'omovi'
import SimulationDataVisualizer from './SimulationDataVisualizer'

const App = () => {
  const [simulationData, setSimulationData] = useState<string>()
  const onFileUploaded = (filename: string, contents: string) => {
    setSimulationData(contents)
  }

  let url:string|undefined = undefined
  if (simulationData == null) {
    url = "https://raw.githubusercontent.com/andeplane/simulations/main/water.xyz"
  }
  
  return  (
  <>
    <SimulationDataVisualizer simulationData={simulationData} url={url} />
    <FileUpload onFileUploaded={onFileUploaded} />
  </>
  )
}

export default App

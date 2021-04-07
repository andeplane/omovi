import React, { useEffect, useCallback, useState } from 'react'
import hello from './wasm/hello'
import parser from './wasm/parser'
import * as THREE from 'three'
import 'antd/dist/antd.css'

//@ts-ignore
import encode from 'strict-uri-encode'
import { Layout, Menu, message } from 'antd';
import {
  DotChartOutlined,
  CopyOutlined
} from '@ant-design/icons';

import FileUpload from './FileUpload'
import parseData from 'dataparser'
import { createBondsByDistance, Particles, SimulationData, parseXyz, SimulationDataFrame } from 'omovi'
import SimulationDataVisualizer from './SimulationDataVisualizer'
import { useLoadSimulation } from 'hooks/simulation'

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

const waterUrl = "https://raw.githubusercontent.com/andeplane/simulations/main/water.xyz"
const ljUrl = "https://raw.githubusercontent.com/andeplane/simulations/main/lj.xyz"

const App = () => {
  const [simulationData, setSimulationData] = useState<SimulationData>()
  const [fileName, setFileName] = useState<string>()
  const [url, setUrl] = useState<string>()
  const { loading, loadSimulation } = useLoadSimulation()

  const onFileUploaded = useCallback((fileName: string, contents: string) => {
    setFileName(fileName)
    const simulationData = parseXyz(contents)
    setSimulationData(simulationData)
  }, [])

  const loadWater = useCallback(() => {
    const onWaterUploaded = async (fileName: string, contents: string) => {
      const createBondsFunction = createBondsByDistance({ radius: 0.5, pairDistances: [{ type1: 'H', type2: 'O', distance: 1.4 }] })
      const simulationData = parseXyz(contents)
      simulationData.generateBondsFunction = createBondsFunction
      setFileName(fileName)
      setSimulationData(simulationData)
    }
    setUrl(waterUrl)
    loadSimulation(waterUrl, onWaterUploaded)
  }, [loadSimulation])

  const loadLJ = useCallback(() => {
    setUrl(ljUrl)
    loadSimulation(ljUrl, onFileUploaded)
  }, [loadSimulation, onFileUploaded])

  const urlParams = new URLSearchParams(window.location.search)
  const simulationUrl = urlParams.get('url')

  useEffect(() => {
    if (simulationUrl != null && simulationUrl !== url) {
      setUrl(simulationUrl)
      loadSimulation(simulationUrl, onFileUploaded)
    }
  }, [loadSimulation, onFileUploaded, simulationUrl, url])

  useEffect(() => {
    if (simulationData == null && simulationUrl == null) {
      loadWater()
    }
  }, [simulationData, onFileUploaded, loadSimulation, loadWater, simulationUrl])

  useEffect(() => {
    const wasm = parser({
      onRuntimeInitialized: async () => {
        wasm.then(async (obj: any) => {
          // @ts-ignore
          window.wasm = obj;
          return;
          // const response = await fetch(process.env.PUBLIC_URL + '/example.data');
          // let response = await fetch("https://zenodo.org/record/4644374/files/polycrystalline_shear_snapshots_polycrystal_L400.0_continuation_step_1000000_T_263.15_continuation_stress_calculation_max_with_deform_temp_restart_step_1620000.data?download=0");
          // const projectId = 4644374;
          // let response = await fetch(`https://zenodo.org/api/records/${projectId}`);
          // const files = (await response.json())['files']
          // const file = files[10];
          // console.log("Downloading file of size ", file.size)
          // response = await fetch(file.links.self);
          const response = await fetch(process.env.PUBLIC_URL + '/poly.data');
          const data = await response.text();
          console.log("Done, parsing ...");
          let t0 = new Date()
          // const box = new obj.SimulationBox(data)
          let t1 = new Date()
          //@ts-ignore
          let diff = (t1 - t0) / 1000
          console.log("Done in cpp using ", diff);
          t0 = new Date()
          const {
            numAtoms, positions, ids, types
          } = parseData(data);
          t1 = new Date()
          //@ts-ignore
          diff = (t1 - t0) / 1000
          console.log("Done in js using ", diff);

          const particles = new Particles(1);
          // const positionsPtr = box.getPositionsPointer() / 4;
          // particles.positions = obj.HEAPF32.subarray(positionsPtr, positionsPtr + 3 * box.numAtoms);
          particles.positions = positions;

          // const idPtr = box.getIdsPointer() / 4;
          // particles.indices = obj.HEAP32.subarray(idPtr, idPtr + box.numAtoms);
          particles.indices = ids

          // const typesPtr = box.getTypesPointer() / 4;
          particles.radii = new Float32Array(numAtoms);
          for (let i = 0; i < numAtoms; i++) {
            // const type = obj.HEAP32[typesPtr + i]
            const type = types[i]
            if (type === 1) {
              particles.radii[i] = 0.3;
              particles.colors.push(new THREE.Color("crimson"));
            } else {
              particles.radii[i] = 0.5;
              particles.colors.push(new THREE.Color("lightslategray"));
            }
          }
          particles.count = numAtoms
          particles.capacity = numAtoms

          const simulationDataFrame = new SimulationDataFrame(particles)
          const simulationData = new SimulationData()
          simulationData.frames.push(simulationDataFrame)
          setSimulationData(simulationData)
        })
      },
      // This overrides the default path used by the wasm/hello.js wrapper
      locateFile: () => require("./wasm/parser.wasm"),
    });
    (async () => {
      const data = await fetch(process.env.PUBLIC_URL + '/example.data');
      // @ts-ignore
      window.datafile = await data.text();
    })();
  }, [])

  const renderHeader = () => {
    const copyUrl = () => {
      const currentUrlWithoutQueryParams = window.location.toString().replace(window.location.search, "")
      const fullUrl = currentUrlWithoutQueryParams + '?url=' + encode(url)
      navigator.clipboard.writeText(fullUrl)
      message.info("Copied simulation link to clipboard")
    }
    if (loading) {
      return <h2>Downloading simulation ...</h2>
    }

    if (url) {
      return (<h2>{fileName} &nbsp; <CopyOutlined title="Copy link to this simulation" onClick={() => copyUrl()} /></h2>)
    } else {
      return (<h2>{fileName}</h2>)
    }
  }

  const defaultSelectedKeys = simulationUrl === undefined ? ['example1'] : undefined

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div className="logo" />
        <Menu theme="dark" defaultOpenKeys={["examples"]} defaultSelectedKeys={defaultSelectedKeys} mode="inline">
          <SubMenu key="examples" icon={<DotChartOutlined />} title="Examples">
            <Menu.Item key="example1" onClick={() => loadWater()} icon={<DotChartOutlined />}>
              Water molecule
            </Menu.Item>
            <Menu.Item key="example2" onClick={() => loadLJ()} icon={<DotChartOutlined />}>
              LJ liquid
          </Menu.Item>
          </SubMenu>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0, position: 'absolute', left: 200, width: '100%' }}>
          {renderHeader()}
        </Header>
        <Content>
          <SimulationDataVisualizer simulationData={simulationData} />
          <FileUpload onFileUploaded={onFileUploaded} />
        </Content>
      </Layout>
    </Layout>
  )
}

export default App

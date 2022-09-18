import React, { useEffect, useCallback, useState } from 'react'

import 'antd/dist/antd.css'
//@ts-ignore
import encode from 'strict-uri-encode'
import { Layout, List, Menu, message } from 'antd';
import {
  DotChartOutlined,
  CopyOutlined
} from '@ant-design/icons';

import FileUpload from './FileUpload'

import { createBondsByDistance, SimulationData, parseXyz, parseLAMMPSData, parseLAMMPSBinaryDump } from 'omovi'
import SimulationDataVisualizer from './SimulationDataVisualizer'
import { useLoadSimulation } from 'hooks/simulation'
import ParticleTypes from 'components/ParticleTypes'

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

const waterUrl = "https://raw.githubusercontent.com/andeplane/simulations/main/water.xyz"
const ljUrl = "https://raw.githubusercontent.com/andeplane/simulations/main/lj.xyz"

const App = () => {
  const [simulationData, setSimulationData] = useState<SimulationData>()
  const [fileName, setFileName] = useState<string>()
  const [url, setUrl] = useState<string>()
  const { loading, loadSimulation } = useLoadSimulation()

  const onFileUploaded = useCallback((fileName: string, contents?: string, buffer?: ArrayBuffer) => {
    setFileName(fileName)
    let simulationData;
    if (fileName.endsWith('xyz')) {
      simulationData = parseXyz(contents)
    } else if (fileName.endsWith('data')) {
      simulationData = parseLAMMPSData(contents)
    } else if (fileName.endsWith('bin')) {
      simulationData = parseLAMMPSBinaryDump(buffer)
    }

    setSimulationData(simulationData)
  }, [])

  const loadWater = useCallback(() => {
    const onWaterUploaded = async (fileName: string, contents?: string, buffer?: ArrayBuffer) => {
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div className="logo" />
        <Menu theme="dark" defaultOpenKeys={["examples", "particletypes"]} mode="inline">
          <SubMenu key="examples" icon={<DotChartOutlined />} title="Examples">
            <Menu.Item key="example1" onClick={() => loadWater()} icon={<DotChartOutlined />}>
              Water molecule
            </Menu.Item>
            <Menu.Item key="example2" onClick={() => loadLJ()} icon={<DotChartOutlined />}>
              LJ liquid
          </Menu.Item>
          </SubMenu>
          <SubMenu key="particletypes" title="Particle types">
            <ParticleTypes />
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

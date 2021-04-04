import React, { useEffect, useCallback, useState } from 'react'

import 'antd/dist/antd.css'
import { Layout, Menu } from 'antd';
import {
  DotChartOutlined
} from '@ant-design/icons';

import FileUpload from './FileUpload'

import { createBondsByDistance, SimulationData, parseXyz } from 'omovi'
import SimulationDataVisualizer from './SimulationDataVisualizer'

import { useLoadSimulation } from 'hooks/simulation'
const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

const waterUrl = "https://raw.githubusercontent.com/andeplane/simulations/main/water.xyz"
const ljUrl = "https://raw.githubusercontent.com/andeplane/simulations/main/lj.xyz"

const App = () => {
  const [simulationData, setSimulationData] = useState<SimulationData>()
  const [fileName, setFileName] = useState<string>()
  const loadSimulation = useLoadSimulation()

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
    loadSimulation(waterUrl, onWaterUploaded)
  }, [loadSimulation])

  useEffect(() => {
    if (simulationData == null) {
      loadWater()
    }
  }, [simulationData, onFileUploaded, loadSimulation, loadWater])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div className="logo" />
        <Menu theme="dark" defaultOpenKeys={["examples"]} defaultSelectedKeys={['example1']} mode="inline">
          <SubMenu key="examples" icon={<DotChartOutlined />} title="Examples">
            <Menu.Item key="example1" onClick={() => loadWater()} icon={<DotChartOutlined />}>
              Water molecule
            </Menu.Item>
            <Menu.Item key="example2" onClick={() => loadSimulation(ljUrl, onFileUploaded)} icon={<DotChartOutlined />}>
              LJ liquid
          </Menu.Item>
          </SubMenu>
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0, position: 'absolute', left: 200, width: '100%' }}>
          <h2>{fileName}</h2>
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

import React from 'react'
import {List} from 'antd'
import {useStoreState} from 'hooks'
import styled from 'styled-components'
import ParticleColorSelector from 'components/ParticleColorSelector'

const ParticleTypeContainer = styled.div`
  color: white;
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 0px;
`;

interface ParticleTypesProps {
  subMenuKey?: string
}
const ParticleTypes = ({subMenuKey}: ParticleTypesProps) => {
  const colorMap = useStoreState(state => state.colors.colorMap)
  const particleTypes = Object.keys(colorMap).map( (particleType) => ({
    particleType,
    color: colorMap[particleType]
  }))

  return (
    <>
  <List
    itemLayout="horizontal"
    dataSource={particleTypes}
    renderItem={(particleType, index) => {
      let color = `rgba(${particleType.color.r}, ${particleType.color.g}, ${particleType.color.b}, 1.0)`;
      const onParticleTypeClicked = () => {
        console.log("Clicked on ", particleType.particleType)
      }
      return (
        <List.Item onClick={onParticleTypeClicked} style={{borderBottomWidth: 0}}>
          <ParticleTypeContainer>
            <div style={{ marginLeft: '1em', width: '2em', height: '2em', borderRadius: '50%', backgroundColor: color }} />
            <div style={{marginTop: '0.3em', marginLeft: '1em'}}>
              {particleType.particleType}
            </div>
          </ParticleTypeContainer>
        </List.Item>
      )
    }} />
    {/* <ParticleColorSelector particleType={"H"} color={{r: 255, g: 255, b: 255}} /> */}
    </>
  )
}

  export default ParticleTypes
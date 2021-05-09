import React from 'react'
import { List, Row, Col } from 'antd'
import {useStoreState} from 'hooks'
import styled from 'styled-components'

const Container = styled.div`
  .particle {
    border-radius: 50%;
    width: 3em;
    height: 3em;
  }
  
  .ant-list-item {
    color: #ffffff
  }

  margin: 1em;
`

const ParticleColorSelector = () => {
  const colorMap = useStoreState(state => state.colors.colorMap)
  const particleTypes = Object.keys(colorMap).map( (particleType) => ({
    particleType,
    color: colorMap[particleType]
  }))
  
  return (
    <Container>
    <List
      itemLayout="horizontal"
      dataSource={particleTypes}
      renderItem={particleType => (
        <List.Item>
            <div style={{backgroundColor: `rgba(${particleType.color.r}, ${particleType.color.g}, ${particleType.color.b}, 1.0)`}} className="particle" />
              <div style={{fontSize: '2em'}}>
            {particleType.particleType}
            </div>
        </List.Item>
      )}
    />
  </Container>)
}

export default ParticleColorSelector
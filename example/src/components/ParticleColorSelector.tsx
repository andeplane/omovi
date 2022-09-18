import React, {useCallback, useEffect} from 'react'
import { Modal } from 'antd'
import {useStoreActions} from 'hooks'
import {Color} from 'types'
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/lib/css/styles.css";

interface ParticleColorSelectorProps {
  particleType: string
  color: Color
}
const ParticleColorSelector = ({particleType, color}: ParticleColorSelectorProps) => {
  const setColor = useStoreActions(actions => actions.colors.setColor)
  const [currentColor, setCurrentColor] = useColor("rgb", color);

  useEffect(() => {
    console.log("Setting color because it changed ", currentColor.rgb)
    setColor({particleType, color: currentColor.rgb})
  }, [currentColor, particleType, setColor])

  return (
    <Modal title={`Select color for particle type ${particleType}`} closable={false} visible={true}>
      <ColorPicker width={456} height={228} color={currentColor} onChange={setCurrentColor} dark />
    </Modal>
  )
}

export default ParticleColorSelector
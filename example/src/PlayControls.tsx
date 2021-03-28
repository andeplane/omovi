import React, {useState, useCallback, useEffect} from 'react'
import {Drawer, Slider, Row, Col} from 'antd'
import {CaretRightOutlined, PauseOutlined} from '@ant-design/icons'

const PlayControls = ({numFrames, onFrameChanged, playing}: {numFrames: number, playing: boolean, onFrameChanged: (frame: number)=> void}) => {
  const [isPlaying, setIsPlaying] = useState(playing)
  const [frame, setFrame] = useState(0)
  const [mouseDown, setMouseDown] = useState(false)

  const onFrameChangedCB = useCallback((frame: number) => {
    setFrame(frame)
    onFrameChanged(frame)
  }, [onFrameChanged])

  const toggleIsPlaying = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 32) {
        // Handle space
        setIsPlaying(!isPlaying)
      }
      
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {window.removeEventListener('keydown', handleKeyDown)}
  }, [isPlaying])

  useEffect(() => {
    if (!mouseDown && isPlaying) {
      const interval = setInterval(() => {
        let nextFrame = frame + 1
        if (nextFrame >= numFrames) {
          nextFrame = 0
        }
        setFrame(nextFrame)
        onFrameChanged(nextFrame)
      }, 50);

      return () => clearInterval(interval);
    }
    return () => {}
  }, [frame, isPlaying, numFrames, onFrameChanged, mouseDown]);
    
    return (
        <Drawer
          height={"6em"}
          placement={"bottom"}
          closable={false}
          visible={true}
          mask={false}
        >
          <Row>
            <Col flex="10em">
              {frame} / {numFrames}
            </Col>
            <Col flex="auto">
              <div onMouseDown={(e) => setMouseDown(true)} onMouseUp={(e)=> setMouseDown(false)} onClick={(e) => {console.log("Clicked")}}>
                <Slider defaultValue={frame} max={numFrames-1} value={frame} onChange={onFrameChangedCB} />
              </div>
            </Col>
            <Col flex="2em">
              {isPlaying ? <PauseOutlined onClick={toggleIsPlaying} style={{fontSize: '2em'}} /> : <CaretRightOutlined onClick={toggleIsPlaying} style={{fontSize: '2em'}} />}
              </Col>
          </Row>
        </Drawer>
    )
}

export default PlayControls
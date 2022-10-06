import React, { useEffect, useState, useRef } from 'react'
import Visualizer from './core/visualizer'
import Particles from './core/geometries/particles/particles'
import Bonds from './core/geometries/bonds/bonds'
import {Color} from 'core/types'

interface OMOVIVisualizerProps {
  particles?: Particles
  bonds?: Bonds
  cameraTarget?: THREE.Vector3
  cameraPosition?: THREE.Vector3
  colors?: Color[]
  onCameraChanged?: (position: THREE.Vector3, target: THREE.Vector3) => void
}

const OMOVIVisualizer = ({
  particles,
  bonds,
  cameraTarget,
  cameraPosition,
  colors,
  onCameraChanged
}: OMOVIVisualizerProps) => {
  const [loading, setLoading] = useState(false)
  const domElement = useRef<HTMLDivElement | null>(null)
  const [visualizer, setVisualizer] = useState<Visualizer | undefined>(
    undefined
  )

  useEffect(() => {
    if (domElement.current && !loading && !visualizer) {
      setLoading(true)
      const newVisualizer = new Visualizer({
        domElement: domElement.current,
        initialColors: colors,
        onCameraChanged
      })
      setVisualizer(newVisualizer)
      setLoading(false)
    }
  }, [domElement, visualizer])

  const prevParticlesRef = useRef<Particles>()
  useEffect(() => {
    prevParticlesRef.current = particles
  })
  const prevParticles = prevParticlesRef.current

  const prevColorsRef = useRef<Color[]>()
  useEffect(() => {
    prevColorsRef.current = colors
  })
  const prevColors = prevColorsRef.current

  const prevBondsRef = useRef<Bonds>()
  useEffect(() => {
    prevBondsRef.current = bonds
  })
  const prevBonds = prevBondsRef.current

  useEffect(() => {
    if (!visualizer) {
      return
    }

    if (prevParticles && prevParticles !== particles) {
      visualizer.remove(prevParticles)
    }

    if (prevColors && prevColors !== colors) {
      colors?.forEach((color, index) => {
        visualizer.setColor(index, color)
      })
    }

    if (particles) {
      visualizer.add(particles)
    }

    if (prevBonds && prevBonds !== bonds) {
      visualizer.remove(prevBonds!)
    }
    if (bonds) {
      visualizer.add(bonds!)
    }
  }, [particles, bonds, visualizer])

  useEffect(() => {
    if (visualizer) {
      if (cameraTarget) {
        visualizer.setCameraTarget(cameraTarget)
      }
    }
  }, [cameraTarget, visualizer])

  useEffect(() => {
    if (visualizer) {
      if (cameraPosition) {
        visualizer.setCameraPosition(cameraPosition)
      }
    }
  }, [cameraPosition, visualizer])

  useEffect(() => {
    // console.log('Will create visualizer')
    return () => {
      if (visualizer) {
        visualizer.dispose()
      }
    }
  }, [])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }} ref={domElement} />
    </div>
  )
}
export default OMOVIVisualizer

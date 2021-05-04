import React, { useEffect, useState, useRef } from 'react'
import Visualizer from './core/visualizer'
import Particles from './core/geometries/particles/particles'
import Bonds from './core/geometries/bonds/bonds'

interface OMOVIVisualizerProps {
  particles?: Particles
  bonds?: Bonds
  cameraTarget?: THREE.Vector3
  cameraPosition?: THREE.Vector3
  onCameraChanged?: (position: THREE.Vector3, target: THREE.Vector3) => void
}

const OMOVIVisualizer = ({
  particles,
  bonds,
  cameraTarget,
  cameraPosition,
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

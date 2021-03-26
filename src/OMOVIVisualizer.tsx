import React, { useEffect, useState, useRef } from 'react'
import Visualizer from './core/visualizer'
import Particles from './core/geometries/particles/particles'

let newVisualizer: Visualizer | undefined

const OMOVIVisualizer = ({ particles }: { particles: Particles }) => {
  const domElement = useRef<HTMLDivElement | null>(null)
  const [visualizer, setVisualizer] = useState<Visualizer | undefined>(
    undefined
  )

  useEffect(() => {
    if (domElement.current && !newVisualizer) {
      newVisualizer = new Visualizer(domElement.current)
      setVisualizer(newVisualizer)
    }
  }, [domElement, visualizer])

  const prevParticlesRef = useRef<Particles>()
  useEffect(() => {
    prevParticlesRef.current = particles
  })
  const prevParticles = prevParticlesRef.current

  useEffect(() => {
    if (!visualizer) {
      return
    }

    if (prevParticles) {
      visualizer.remove(prevParticles.getMesh())
    }
    visualizer.add(particles.getMesh())
  }, [particles, visualizer])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }} ref={domElement} />
    </div>
  )
}
export default OMOVIVisualizer

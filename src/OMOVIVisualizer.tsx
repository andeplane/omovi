import React, { useEffect, useState, useRef } from 'react'
import Visualizer from './core/visualizer'
import Particles from './core/geometries/particles/particles'
import Bonds from './core/geometries/bonds/bonds'

let newVisualizer: Visualizer | undefined

const OMOVIVisualizer = ({
  particles,
  bonds
}: {
  particles?: Particles
  bonds?: Bonds
}) => {
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

  const prevBondsRef = useRef<Bonds>()
  useEffect(() => {
    prevBondsRef.current = bonds
  })
  const prevBonds = prevBondsRef.current

  useEffect(() => {
    if (!visualizer) {
      return
    }

    if (prevParticles) {
      visualizer.remove(prevParticles.getMesh())
    }
    if (particles) {
      visualizer.add(particles.getMesh())
    }

    if (prevBonds) {
      visualizer.remove(prevBonds.getMesh())
    }
    if (bonds) {
      visualizer.add(bonds.getMesh())
    }
  }, [particles, bonds, visualizer])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }} ref={domElement} />
    </div>
  )
}
export default OMOVIVisualizer

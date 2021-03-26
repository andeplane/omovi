// import * as THREE from 'three'
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

      //   for (let i = 0; i < particles.numParticles; i++) {
      //     const geometry = new THREE.SphereGeometry(
      //       particles.getRadius(i),
      //       32,
      //       32
      //     )
      //     const material = new THREE.MeshPhongMaterial({ color: 0xff0000 })
      //     const sphere = new THREE.Mesh(geometry, material)
      //     const position = particles.getPosition(i)
      //     sphere.position.set(position.x, position.y, position.z)
      //     newVisualizer.scene.add(sphere)
      //   }

      newVisualizer.scene.add(particles.getMesh())
    }
  }, [domElement, visualizer])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }} ref={domElement} />
    </div>
  )
}
export default OMOVIVisualizer

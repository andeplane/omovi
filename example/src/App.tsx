import React from 'react'

import { OMOVIVisualizer, Particles } from 'omovi'
import 'omovi/dist/index.css'

const App = () => {
  const particles = new Particles(2);
  particles.addParticle(-3.0, 0, 0, 1.0)
  particles.addParticle(1.5, 0, 0, 1.0)

  return <OMOVIVisualizer particles={particles} />
}

export default App

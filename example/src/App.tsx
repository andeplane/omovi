import React from 'react'

import { OMOVIVisualizer, Particles } from 'omovi'
import 'omovi/dist/index.css'

const App = () => {
  const N = 200000;
  const particles = new Particles(N);

  for (let i = 0; i < N; i++) {
    const x = 500 * (Math.random() - 0.5);
    const y = 500 * (Math.random() - 0.5);
    const z = 500 * (Math.random() - 0.5);
    const r = 0.5 + Math.random();
    particles.addParticle(x,y,z,r)
  }

  return <OMOVIVisualizer particles={particles} />
}

export default App

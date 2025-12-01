# OMOVI (Online Molecular Visualizer)

[![NPM](https://img.shields.io/npm/v/omovi.svg)](https://www.npmjs.com/package/omovi) [![Deploy to GitHub pages](https://github.com/andeplane/omovi/actions/workflows/deploy.yaml/badge.svg)](https://github.com/andeplane/omovi/actions/workflows/deploy.yaml)

OMOVI is a high-performance library for 3D visualization of molecular dynamics simulations in the browser using WebGL via Three.js. It is designed for simplicity, efficiency, and ease of integration into web applications.

See a live demo [here](https://andeplane.github.io/omovi) where you can visualize simulation files by dragging and dropping them into the browser.

## Features

- **Multiple File Formats**: XYZ, LAMMPS data files, LAMMPS binary dump files
- **High Performance**: GPU-accelerated rendering using instanced geometry
- **Interactive Controls**: Camera controls, particle selection, and picking
- **Visual Effects**: SSAO (ambient occlusion), particle outlines, customizable colors
- **Flexible API**: Easy integration into React or vanilla JavaScript applications
- **Bond Visualization**: Automatic or custom bond creation between atoms

## Installation

```bash
npm install omovi
```

## Quick Start

### Basic Usage

```typescript
import { Visualizer, Particles } from 'omovi'

// Create a visualizer attached to a DOM element
const container = document.getElementById('visualization')
const visualizer = new Visualizer({ domElement: container })

// Create particles
const particles = new Particles(3)
particles.add(0.0, 0.0, 0.0, 0, 1) // x, y, z, id, type
particles.add(1.0, 0.0, 0.0, 1, 1)
particles.add(0.0, 1.0, 0.0, 2, 2)

// Add to visualizer
visualizer.add(particles)

// Set colors by particle type
visualizer.setColor(1, { r: 255, g: 0, b: 0 })   // Red
visualizer.setColor(2, { r: 0, g: 0, b: 255 })   // Blue

// Set particle radii
visualizer.setRadius(1, 0.5)
visualizer.setRadius(2, 0.3)
```

### Loading from Files

```typescript
import { parseXyz, parseLAMMPSData, Visualizer } from 'omovi'

// Parse XYZ file
const xyzData = await fetch('molecules.xyz').then(r => r.text())
const simulationData = parseXyz(xyzData)

// Create visualizer
const visualizer = new Visualizer({ domElement: container })

// Add first frame
const frame = simulationData.getFrame(0)
visualizer.add(frame.particles)
if (frame.bonds) {
  visualizer.add(frame.bonds)
}
```

### Creating Bonds

```typescript
import { createBondsByDistance, Visualizer } from 'omovi'

// Define which particle types should form bonds and at what distance
const bondCreator = createBondsByDistance({
  radius: 0.1,
  pairDistances: [
    { type1: '1', type2: '8', distance: 1.5 },  // H-O bonds
    { type1: '6', type2: '6', distance: 1.8 },  // C-C bonds
  ]
})

// Apply to simulation data
simulationData.generateBondsFunction = bondCreator

// Bonds will be created automatically when getting frames
const frame = simulationData.getFrame(0)
visualizer.add(frame.particles)
if (frame.bonds) {
  visualizer.add(frame.bonds)
}
```

### Particle Selection

```typescript
import { Visualizer } from 'omovi'

const visualizer = new Visualizer({
  domElement: container,
  onParticleClick: (event) => {
    console.log('Clicked particle:', event.particleIndex)
    console.log('Position:', event.position)
    console.log('Shift key pressed:', event.shiftKey)
    
    // Toggle selection
    visualizer.setSelected(event.particleIndex, true)
  }
})

// Clear all selections
visualizer.clearSelection()

// Change selection color
import * as THREE from 'three'
visualizer.setSelectionColor(new THREE.Color(1.0, 0.5, 0.0)) // Orange
```

### Camera Controls

```typescript
import * as THREE from 'three'

// Get current camera state
const position = visualizer.getCameraPosition()
const target = visualizer.getCameraTarget()

// Set camera position
visualizer.setCameraPosition(new THREE.Vector3(10, 10, 10))
visualizer.setCameraTarget(new THREE.Vector3(0, 0, 0))

// Listen to camera changes
const visualizer = new Visualizer({
  onCameraChanged: (position, target) => {
    console.log('Camera moved to:', position)
    console.log('Looking at:', target)
  }
})
```

## API Overview

### Core Classes

#### `Visualizer`
Main visualization class that manages the 3D scene, camera, and rendering.

```typescript
new Visualizer({
  domElement?: HTMLElement,
  onCameraChanged?: (position, target) => void,
  onParticleClick?: (event) => void,
  initialColors?: Color[]
})
```

#### `Particles`
Represents a collection of particles (atoms).

```typescript
const particles = new Particles(capacity: number)
particles.add(x, y, z, id, type): boolean
particles.getPosition(index: number): THREE.Vector3
particles.getType(index: number): number
```

#### `Bonds`
Represents bonds between particles.

```typescript
const bonds = new Bonds(capacity: number)
bonds.add(x1, y1, z1, x2, y2, z2, radius): boolean
bonds.getPosition1(index: number): THREE.Vector3
bonds.getRadius(index: number): number
```

### Parsers

- `parseXyz(data: string): SimulationData` - Parse XYZ format files
- `parseLAMMPSData(data: string): SimulationData` - Parse LAMMPS data files
- `parseLAMMPSBinaryDump(buffer: ArrayBuffer): SimulationData` - Parse LAMMPS binary dump files

### Utilities

- `createBondsByDistance(options): BondCreator` - Create bonds based on distance criteria
- `getColor(particleType: number): Color` - Get default color for particle type

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Run tests
npm test

# Watch mode for tests
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

GPLv3 © [andeplane](https://github.com/andeplane)

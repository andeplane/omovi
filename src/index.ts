/**
 * OMOVI - Online Molecular Visualizer
 * 
 * A high-performance library for 3D visualization of molecular dynamics simulations
 * in the browser using WebGL via Three.js.
 * 
 * @packageDocumentation
 */

import Particles from './core/geometries/particles/particles'
import Bonds from './core/geometries/bonds/bonds'
import Visualizer, { ParticleClickEvent } from './core/visualizer'
import parseXyz from './parsers/xyzparser'
import parseLAMMPSBinaryDump from './parsers/lammpsbinarydumpparser'
import parseLAMMPSData from './parsers/lammpsdataparser'
import SimulationData from './core/simulationdata/simulationdata'
import SimulationDataFrame from './core/simulationdata/simulationdataframe'
import { createBondsByDistance } from './utils/bondcreators'
import AtomTypes, { getColor } from './core/atomtypes'

/**
 * Main visualization class that manages the 3D scene, camera, and rendering.
 * 
 * @example
 * ```typescript
 * const visualizer = new Visualizer({ domElement: container })
 * visualizer.add(particles)
 * ```
 */
export { Visualizer }

/**
 * Represents bonds between particles.
 * 
 * @example
 * ```typescript
 * const bonds = new Bonds(100)
 * bonds.add(0, 0, 0, 1, 0, 0, 0.1)
 * ```
 */
export { Bonds }

/**
 * Represents a collection of particles (atoms).
 * 
 * @example
 * ```typescript
 * const particles = new Particles(1000)
 * particles.add(0, 0, 0, 0, 1)
 * ```
 */
export { Particles }

/**
 * Parse XYZ format molecular data files.
 * 
 * @param data - String content of XYZ file
 * @returns SimulationData containing parsed frames
 * 
 * @example
 * ```typescript
 * const data = await fetch('molecule.xyz').then(r => r.text())
 * const simulation = parseXyz(data)
 * ```
 */
export { parseXyz }

/**
 * Parse LAMMPS data files (atomic or molecular style).
 * 
 * @param data - String content of LAMMPS data file
 * @returns SimulationData containing parsed frame
 * 
 * @example
 * ```typescript
 * const data = await fetch('system.data').then(r => r.text())
 * const simulation = parseLAMMPSData(data)
 * ```
 */
export { parseLAMMPSData }

/**
 * Parse LAMMPS binary dump files.
 * 
 * @param buffer - ArrayBuffer containing binary dump data
 * @returns SimulationData containing parsed frames
 * 
 * @example
 * ```typescript
 * const buffer = await fetch('dump.bin').then(r => r.arrayBuffer())
 * const simulation = parseLAMMPSBinaryDump(buffer)
 * ```
 */
export { parseLAMMPSBinaryDump }

/**
 * Container for simulation frames and metadata.
 */
export { SimulationData }

/**
 * Represents a single frame of a molecular dynamics simulation.
 */
export { SimulationDataFrame }

/**
 * Mapping of element symbols to atomic properties (radius, color).
 */
export { AtomTypes }

/**
 * Get default color for a particle type.
 * 
 * @param particleType - Integer particle type index
 * @returns RGB color values (0-255)
 * 
 * @example
 * ```typescript
 * const color = getColor(1)
 * visualizer.setColor(1, color)
 * ```
 */
export { getColor }

/**
 * Create a bond creator function based on distance criteria.
 * 
 * @example
 * ```typescript
 * const bondCreator = createBondsByDistance({
 *   radius: 0.1,
 *   pairDistances: [
 *     { type1: '1', type2: '8', distance: 1.5 }
 *   ]
 * })
 * simulationData.generateBondsFunction = bondCreator
 * ```
 */
export { createBondsByDistance }

/**
 * Event data passed when a particle is clicked.
 */
export type { ParticleClickEvent }

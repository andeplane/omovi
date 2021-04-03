import Particles from 'core/geometries/particles/particles';
import Bonds from 'core/geometries/bonds/bonds';
import SimulationCell from './simulationcell';
export default class SimulationDataFrame {
    simulationCell: SimulationCell;
    particleTypes: string[];
    particles: Particles;
    bonds?: Bonds;
    constructor(particles: Particles, simulationCell?: SimulationCell);
    generateSimulationCell: () => SimulationCell;
}

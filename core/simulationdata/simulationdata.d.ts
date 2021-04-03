import SimulationDataFrame from './simulationdataframe';
import Bonds from 'core/geometries/bonds/bonds';
export default class SimulationData {
    frames: SimulationDataFrame[];
    generateBondsFunction?: (frame: SimulationDataFrame) => Bonds;
    constructor();
    getFrame: (index: number) => SimulationDataFrame;
    getNumFrames: () => number;
}

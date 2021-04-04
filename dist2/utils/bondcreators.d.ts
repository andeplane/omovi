import SimulationDataFrame from 'core/simulationdata/simulationdataframe';
import Bonds from 'core/geometries/bonds/bonds';
declare type CreateBondsByDistanceOptions = {
    radius: number;
    pairDistances: {
        type1: string;
        type2: string;
        distance: number;
    }[];
};
declare const createBondsByDistance: ({ radius, pairDistances }: CreateBondsByDistanceOptions) => (frame: SimulationDataFrame) => Bonds;
export { createBondsByDistance };

/// <reference types="react" />
import Particles from './core/geometries/particles/particles';
import Bonds from './core/geometries/bonds/bonds';
declare const OMOVIVisualizer: ({ particles, bonds, cameraTarget, cameraPosition }: {
    particles?: Particles | undefined;
    bonds?: Bonds | undefined;
    cameraTarget?: import("three").Vector3 | undefined;
    cameraPosition?: import("three").Vector3 | undefined;
}) => JSX.Element;
export default OMOVIVisualizer;

import * as THREE from 'three';
export interface Uniforms {
    [name: string]: THREE.IUniform;
}
export interface Extensions {
    fragDepth?: boolean;
}
declare class Material extends THREE.MeshPhongMaterial {
    materialType: string;
    uniforms: Uniforms;
    extensions: Extensions;
    constructor(materialType: string, parameters?: THREE.MeshPhongMaterialParameters);
    copy(source: THREE.Material): this;
    clone(): this;
}
declare const createMaterial: (type: string, vertexShader: string, fragmentShader: string) => Material;
export default createMaterial;
export { Material };

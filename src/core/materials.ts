import * as THREE from 'three'

const materialMap: {[key: string]: THREE.MeshPhongMaterial} = {}

const createMaterial =(type: string, vertexShader: string, fragmentShader: string) => {
    if (materialMap[type] != null) {
        return materialMap[type]
    }

    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 })
        
    material.onBeforeCompile = (shader: THREE.Shader) => {
        shader['vertexShader'] = vertexShader;
        shader['fragmentShader'] = fragmentShader;
    };
    
    materialMap[type] = material
    return material
}

export default createMaterial
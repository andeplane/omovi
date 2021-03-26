import * as THREE from 'three'

export interface Uniforms {
  [name: string]: THREE.IUniform
}

export interface Extensions {
  fragDepth?: boolean
}

class Material extends THREE.MeshPhongMaterial {
  materialType: string
  uniforms: Uniforms
  extensions: Extensions

  constructor(
    materialType: string,
    parameters?: THREE.MeshPhongMaterialParameters
  ) {
    super(parameters)
    // @ts-ignore
    this.materialType = materialType
    this.uniforms = {}
    this.extensions = {}
  }

  copy(source: THREE.Material): this {
    THREE.MeshPhongMaterial.prototype.copy.call(this, source)
    const castedSource = source as Material
    this.type = castedSource.type
    this.defines = { ...castedSource.defines }
    this.uniforms = castedSource.uniforms
    this.onBeforeCompile = castedSource.onBeforeCompile
    return this
  }

  clone(): this {
    // three.js uses "this" for no good reason, and we need to match that
    const material = new THREE.MeshPhongMaterial()
    Material.prototype.copy.call(material, this)
    return material as this
  }
}

const materialMap: { [key: string]: Material } = {}

const createMaterial = (
  type: string,
  vertexShader: string,
  fragmentShader: string
) => {
  if (materialMap[type] != null) {
    return materialMap[type]
  }

  const material = new Material(type, { color: 0xff0000 })

  material.onBeforeCompile = (shader: THREE.Shader) => {
    shader.vertexShader = vertexShader
    shader.fragmentShader = fragmentShader
  }

  materialMap[type] = material
  return material
}

export default createMaterial
export { Material }

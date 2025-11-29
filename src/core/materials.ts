import * as THREE from 'three'
import DataTexture from 'core/datatexture'

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
    this.defines = {}
  }

  copy(source: THREE.Material): this {
    THREE.MeshPhongMaterial.prototype.copy.call(this, source)
    const castedSource = source as Material
    this.type = castedSource.type
    this.defines = { ...castedSource.defines }
    this.extensions = castedSource.extensions
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
let _fragDepthSupported: boolean | undefined

function fragDepthSupported() {
  if (_fragDepthSupported !== undefined) {
    return _fragDepthSupported
  }

  const renderer = new THREE.WebGLRenderer()
  const gl = renderer.domElement.getContext('webgl2')

  if (
    renderer.capabilities.isWebGL2 ||
    (gl != null && gl.getExtension('EXT_frag_depth') != null)
  ) {
    _fragDepthSupported = true
  } else {
    _fragDepthSupported = false
  }

  renderer.dispose()

  return _fragDepthSupported
}

const createMaterial = (
  type: string,
  vertexShader: string,
  fragmentShader: string,
  colorTexture: DataTexture,
  radiusTexture: DataTexture,
  selectionTexture?: DataTexture,
  selectionColor?: THREE.Color
) => {
  if (materialMap[type] != null) {
    return materialMap[type]
  }

  const material = new Material(type, { color: 0xffffff })
  material.uniforms.inverseModelMatrix = { value: new THREE.Matrix4() }
  material.uniforms.inverseNormalMatrix = { value: new THREE.Matrix3() }

  if (fragDepthSupported()) {
    material.extensions.fragDepth = true
    material.defines!.FRAG_DEPTH = 1
  }

  material.onBeforeCompile = (
    parameters: THREE.WebGLProgramParametersWithUniforms,
    renderer: THREE.WebGLRenderer
  ) => {
    Object.assign(parameters.uniforms, material.uniforms)
    const rawColorTexture = colorTexture.getTexture()
    const rawRadiusTexture = radiusTexture.getTexture()
    parameters.uniforms.dataTextureWidth = { value: colorTexture.width }
    parameters.uniforms.dataTextureHeight = { value: colorTexture.height }
    parameters.uniforms[colorTexture.name] = { value: rawColorTexture }
    parameters.uniforms[radiusTexture.name] = { value: rawRadiusTexture }
    
    // Add selection texture and color if provided
    if (selectionTexture) {
      parameters.uniforms.selectionTexture = { value: selectionTexture.getTexture() }
      // Default to Reveal's light blue: RGB(0.392, 0.392, 1.0)
      parameters.uniforms.selectionColor = { value: selectionColor || new THREE.Color(0.392, 0.392, 1.0) }
    }

    material.uniforms = parameters.uniforms

    parameters.vertexShader = vertexShader
    parameters.fragmentShader = fragmentShader
  }

  // Necessary because of a bug in THREE.JS
  // https://github.com/mrdoob/three.js/issues/15948
  material.onBeforeCompile.toString = () => type

  materialMap[type] = material
  return material
}

export default createMaterial
export { Material }

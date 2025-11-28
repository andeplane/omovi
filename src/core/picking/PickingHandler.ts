import * as THREE from 'three'
import { pickingVertexShader, pickingFragmentShader } from './shaders'
import DataTexture from '../datatexture'

export interface PickResult {
  particleIndex: number
  position: THREE.Vector3
}

export class PickingHandler {
  private renderer: THREE.WebGLRenderer
  private pickingTarget: THREE.WebGLRenderTarget
  private pixelBuffer: Uint8Array
  private pickingMaterial: THREE.ShaderMaterial
  private radiusTexture: DataTexture

  constructor(renderer: THREE.WebGLRenderer, radiusTexture: DataTexture) {
    this.renderer = renderer
    this.radiusTexture = radiusTexture

    // Create 1x1 render target for picking
    this.pickingTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    })

    this.pixelBuffer = new Uint8Array(4)

    // Create picking material
    this.pickingMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dataTextureWidth: { value: radiusTexture.width },
        dataTextureHeight: { value: radiusTexture.height },
        radiusTexture: { value: radiusTexture.getTexture() },
        inverseModelMatrix: { value: new THREE.Matrix4() }
      },
      vertexShader: pickingVertexShader,
      fragmentShader: pickingFragmentShader,
      side: THREE.DoubleSide
    })
  }

  dispose(): void {
    this.pickingTarget.dispose()
    this.pickingMaterial.dispose()
  }

  /**
   * Pick a particle at the given screen coordinates
   * @param x Screen x coordinate (0 to width)
   * @param y Screen y coordinate (0 to height)
   * @param camera The camera to use for picking
   * @param scene The scene to pick from
   * @param particleMeshes Array of instanced meshes containing particles
   * @returns PickResult if a particle was hit, undefined otherwise
   */
  pick(
    x: number,
    y: number,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    scene: THREE.Scene,
    particleMeshes: THREE.InstancedMesh[]
  ): PickResult | undefined {
    if (particleMeshes.length === 0) {
      return undefined
    }

    const { width, height } = this.renderer.getSize(new THREE.Vector2())

    // Create pick camera with view offset to render just the clicked pixel
    const pickCamera = camera.clone() as THREE.PerspectiveCamera
    pickCamera.setViewOffset(width, height, x, height - y - 1, 1, 1)

    // Store original materials
    const originalMaterials = new Map<THREE.InstancedMesh, THREE.Material | THREE.Material[]>()

    // Swap to picking material
    for (const mesh of particleMeshes) {
      originalMaterials.set(mesh, mesh.material)
      
      // Update picking material uniforms from the original material
      const originalMaterial = mesh.material as THREE.ShaderMaterial
      if (originalMaterial.uniforms) {
        this.pickingMaterial.uniforms.inverseModelMatrix.value.copy(
          originalMaterial.uniforms.inverseModelMatrix?.value || new THREE.Matrix4()
        )
      }
      
      mesh.material = this.pickingMaterial
    }

    // Render to picking target
    const originalRenderTarget = this.renderer.getRenderTarget()
    const originalClearColor = this.renderer.getClearColor(new THREE.Color())
    const originalClearAlpha = this.renderer.getClearAlpha()

    this.renderer.setRenderTarget(this.pickingTarget)
    this.renderer.setClearColor(0x000000, 0) // Clear with transparent black
    this.renderer.clear()
    this.renderer.render(scene, pickCamera)

    // Read the pixel
    this.renderer.readRenderTargetPixels(
      this.pickingTarget,
      0,
      0,
      1,
      1,
      this.pixelBuffer
    )

    // Restore original state
    this.renderer.setRenderTarget(originalRenderTarget)
    this.renderer.setClearColor(originalClearColor, originalClearAlpha)

    // Restore original materials
    for (const [mesh, material] of originalMaterials) {
      mesh.material = material
    }

    // Decode the particle index from RGB
    // Check if we hit anything (alpha > 0 means we hit a particle)
    if (this.pixelBuffer[3] === 0) {
      return undefined
    }

    const r = this.pixelBuffer[0]
    const g = this.pixelBuffer[1]
    const b = this.pixelBuffer[2]

    const particleIndex = r * 65536 + g * 256 + b

    // Get position from particles (we need to find which mesh contains this particle)
    // For now, return a zero position - the caller can look up the actual position
    // from the particle data using the index
    const position = new THREE.Vector3()

    return {
      particleIndex,
      position
    }
  }
}


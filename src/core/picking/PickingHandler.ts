import * as THREE from 'three'
import { pickingVertexShader, pickingFragmentShader } from './shaders'
import {
  bondPickingVertexShader,
  bondPickingFragmentShader
} from './shaders/bondPickingShaders'
import DataTexture from '../datatexture'

export interface PickResult {
  particleIndex: number
  position: THREE.Vector3
}

export class PickingHandler {
  private static readonly BACKGROUND_ID = 0xffffff // RGB(255, 255, 255) - white background
  private static readonly BOND_ID = 0xfffffe // RGB(255, 255, 254) - non-clickable bonds

  private renderer: THREE.WebGLRenderer
  private pickingTarget: THREE.WebGLRenderTarget
  private pixelBuffer: Uint8Array
  private pickingMaterial: THREE.ShaderMaterial
  private bondPickingMaterial: THREE.ShaderMaterial
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

    // Create bond picking material
    this.bondPickingMaterial = new THREE.ShaderMaterial({
      uniforms: {
        inverseModelMatrix: { value: new THREE.Matrix4() }
      },
      vertexShader: bondPickingVertexShader,
      fragmentShader: bondPickingFragmentShader,
      side: THREE.DoubleSide
    })
  }

  dispose(): void {
    this.pickingTarget.dispose()
    this.pickingMaterial.dispose()
    this.bondPickingMaterial.dispose()
  }

  /**
   * Pick a particle at the given screen coordinates
   * @param x Screen x coordinate (0 to width)
   * @param y Screen y coordinate (0 to height)
   * @param camera The camera to use for picking
   * @param scene The scene to pick from
   * @param particleMeshes Array of instanced meshes containing particles
   * @param bondMeshes Array of instanced meshes containing bonds (optional)
   * @param debugMode If true, render to screen instead of picking
   * @returns PickResult if a particle was hit, undefined otherwise
   */
  pick(
    x: number,
    y: number,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    scene: THREE.Scene,
    particleMeshes: THREE.InstancedMesh[],
    bondMeshes: THREE.InstancedMesh[] = [],
    debugMode: boolean = false
  ): PickResult | undefined {
    if (particleMeshes.length === 0) {
      return undefined
    }

    const { width, height } = this.renderer.getSize(new THREE.Vector2())

    // Create pick camera
    const pickCamera = debugMode
      ? camera // For debug mode, use full camera
      : (() => {
          // For picking, use view offset to render just the clicked pixel
          // setViewOffset is only available on PerspectiveCamera
          if (!(camera instanceof THREE.PerspectiveCamera)) {
            throw new Error(
              'Picking is currently only supported for PerspectiveCamera.'
            )
          }
          const cam = camera.clone()
          cam.setViewOffset(width, height, x, y, 1, 1)
          return cam
        })()

    // Store original materials
    const originalMaterials = new Map<
      THREE.InstancedMesh,
      THREE.Material | THREE.Material[]
    >()

    // Store original visibility of all non-particle objects
    const originalVisibility = new Map<THREE.Object3D, boolean>()

    // Create a set of objects to keep visible (particle and bond meshes and their ancestors)
    const keepVisible = new Set<THREE.Object3D>()
    for (const mesh of [...particleMeshes, ...bondMeshes]) {
      keepVisible.add(mesh)
      // Keep all ancestors visible too
      let parent = mesh.parent
      while (parent) {
        keepVisible.add(parent)
        parent = parent.parent
      }
    }

    // Hide all objects except particle/bond meshes and their parents
    scene.traverse((obj) => {
      if (!keepVisible.has(obj)) {
        originalVisibility.set(obj, obj.visible)
        obj.visible = false
      }
    })

    // Helper function to swap materials and update uniforms
    const swapToPickingMaterial = (
      meshes: THREE.InstancedMesh[],
      pickingMaterial: THREE.ShaderMaterial
    ) => {
      for (const mesh of meshes) {
        originalMaterials.set(mesh, mesh.material)

        // Update picking material uniforms from the original material
        const originalMaterial = mesh.material as THREE.ShaderMaterial
        if (originalMaterial.uniforms) {
          const invModelMatrixUniform =
            originalMaterial.uniforms.inverseModelMatrix
          if (invModelMatrixUniform?.value) {
            pickingMaterial.uniforms.inverseModelMatrix.value.copy(
              invModelMatrixUniform.value
            )
          } else {
            pickingMaterial.uniforms.inverseModelMatrix.value.identity()
          }
        }

        mesh.material = pickingMaterial
      }
    }

    // Swap to picking materials
    swapToPickingMaterial(particleMeshes, this.pickingMaterial)
    swapToPickingMaterial(bondMeshes, this.bondPickingMaterial)

    // Render
    const originalRenderTarget = this.renderer.getRenderTarget()
    const originalClearColor = this.renderer.getClearColor(new THREE.Color())
    const originalClearAlpha = this.renderer.getClearAlpha()

    if (debugMode) {
      // Debug mode: render full screen to see picking visualization
      this.renderer.setRenderTarget(null)
      this.renderer.setClearColor(0xffffff, 1) // White background
      this.renderer.clear()
      this.renderer.render(scene, pickCamera)
    } else {
      // Normal mode: render to 1x1 target
      this.renderer.setRenderTarget(this.pickingTarget)
      this.renderer.setClearColor(0xffffff, 1) // White background so missed picks are obvious
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
    }

    // Restore original state
    this.renderer.setRenderTarget(originalRenderTarget)
    this.renderer.setClearColor(originalClearColor, originalClearAlpha)

    // Restore original materials
    for (const [mesh, material] of originalMaterials) {
      mesh.material = material
    }

    // Restore visibility of all objects
    for (const [obj, visibility] of originalVisibility) {
      obj.visible = visibility
    }

    if (debugMode) {
      return undefined // Don't actually pick in debug mode
    }

    // Decode the particle index from RGB
    const r = this.pixelBuffer[0]
    const g = this.pixelBuffer[1]
    const b = this.pixelBuffer[2]
    const a = this.pixelBuffer[3]

    // Calculate picked ID from RGB components
    const pickedId = r * 65536 + g * 256 + b

    // Check if we hit the background
    if (pickedId === PickingHandler.BACKGROUND_ID) {
      return undefined
    }

    // Check if we hit a bond (bonds are not clickable)
    if (pickedId === PickingHandler.BOND_ID) {
      return undefined
    }

    const particleIndex = pickedId

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

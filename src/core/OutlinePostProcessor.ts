import * as THREE from 'three'
import {
  outlineVertexShader,
  outlineFragmentShader
} from './post-processing/outlineShader'
import { OUTLINE_ALPHA_DIVISOR } from './constants'

/**
 * Handles outline post-processing for selected particles.
 *
 * This class manages:
 * - Render target for intermediate rendering
 * - Outline shader material
 * - Fullscreen quad for post-processing pass
 * - Blending configuration for compositing outlines over the main render
 */
export class OutlinePostProcessor {
  private renderTarget: THREE.WebGLRenderTarget
  private material: THREE.ShaderMaterial
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private quad: THREE.Mesh

  constructor(width: number, height: number) {
    // Create render target for intermediate rendering
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    })

    // Create outline material with blending properties set once
    this.material = new THREE.ShaderMaterial({
      vertexShader: outlineVertexShader,
      fragmentShader: outlineFragmentShader,
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        resolution: { value: new THREE.Vector2(width, height) },
        outlineOffset: { value: 1.5 }, // 1-2 pixel offset for thin outline
        outlineAlphaDivisor: { value: OUTLINE_ALPHA_DIVISOR }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false
    })

    // Create fullscreen quad for post-processing
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.quad = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.quad)
  }

  /**
   * Resize the render target and update shader resolution.
   */
  public resize(width: number, height: number): void {
    this.renderTarget.setSize(width, height)
    this.material.uniforms.resolution.value.set(width, height)
  }

  /**
   * Render the outline pass on top of the existing render.
   *
   * @param mainScene - The main scene to render for the selection mask
   * @param mainCamera - The camera to render from
   * @param renderer - The WebGL renderer
   */
  public render(
    mainScene: THREE.Scene,
    mainCamera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ): void {
    // Render selection mask to intermediate target
    renderer.setRenderTarget(this.renderTarget)
    renderer.clear()
    renderer.render(mainScene, mainCamera)

    // Apply outline-only pass on top
    renderer.setRenderTarget(null)

    // Disable auto-clear so we don't erase the main render
    const autoClear = renderer.autoClear
    renderer.autoClear = false

    renderer.render(this.scene, this.camera)

    // Restore auto-clear
    renderer.autoClear = autoClear
  }

  /**
   * Clean up resources.
   */
  public dispose(): void {
    this.renderTarget.dispose()
    this.material.dispose()
    this.quad.geometry.dispose()
  }
}

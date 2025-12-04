import * as THREE from 'three'

import { rttFragment, rttVertex } from './shaders/rtt'
import { antialiasFragment, antialiasVertex } from './shaders/antialias'
import {
  PostProcessingManager,
  PostProcessingSettings,
  DEFAULT_POST_PROCESSING_SETTINGS
} from './PostProcessingManager'

interface SceneInfo {
  scene: THREE.Scene
  uniforms: { [name: string]: THREE.IUniform }
}

function setupRenderingPass(options: {
  uniforms: { [name: string]: THREE.IUniform }
  defines: { [key: string]: string | number | boolean }
  vertexShader: string
  fragmentShader: string
}): { scene: THREE.Scene; material: THREE.Material } {
  const scene = new THREE.Scene()
  const material = new THREE.ShaderMaterial({
    uniforms: options.uniforms,
    defines: options.defines,
    vertexShader: options.vertexShader,
    fragmentShader: options.fragmentShader,
    depthWrite: false
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  scene.add(quad)
  return { scene, material }
}

function getBlob(canvas: HTMLCanvasElement): Promise<any> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob != null ? blob : undefined))
  })
}

const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

export default class OMOVIRenderer {
  onBeforeModelRender: () => void
  onBeforeSelectRender: () => void
  onAfterRender: () => void
  private alpha: boolean
  private renderer: THREE.WebGLRenderer
  private modelTarget: THREE.WebGLRenderTarget
  private screenshotTarget: THREE.WebGLRenderTarget
  private rttTarget: THREE.WebGLRenderTarget
  private GUIScene: THREE.Scene
  private rttScene: THREE.Scene
  private rttUniforms: { [name: string]: THREE.IUniform }
  private antiAliasScene: THREE.Scene
  private antiAliasUniforms: { [name: string]: THREE.IUniform }

  // Post-processing manager
  private postProcessingManager: PostProcessingManager | null = null
  private postProcessingScene: THREE.Scene | null = null
  private postProcessingCamera: THREE.PerspectiveCamera | null = null

  constructor(options: { alpha: boolean }) {
    const { alpha } = options
    this.alpha = alpha
    this.renderer = new THREE.WebGLRenderer({ alpha })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.localClippingEnabled = true

    this.modelTarget = new THREE.WebGLRenderTarget(0, 0)
    this.modelTarget.depthBuffer = true
    this.modelTarget.depthTexture = new THREE.DepthTexture(0, 0)
    this.modelTarget.depthTexture.type = THREE.UnsignedIntType

    this.screenshotTarget = new THREE.WebGLRenderTarget(0, 0)
    this.screenshotTarget.depthBuffer = false
    this.screenshotTarget.stencilBuffer = false

    this.rttTarget = new THREE.WebGLRenderTarget(0, 0)

    this.GUIScene = new THREE.Scene()

    const { scene: rttScene, uniforms: rttUniforms } = this.createRTTScene()
    this.rttScene = rttScene
    this.rttUniforms = rttUniforms

    const { scene: antiAliasScene, uniforms: antiAliasUniforms } =
      this.createAntialiasScene()
    this.antiAliasScene = antiAliasScene
    this.antiAliasUniforms = antiAliasUniforms

    this.onBeforeModelRender = () => {}
    this.onBeforeSelectRender = () => {}
    this.onAfterRender = () => {}
  }

  dispose() {
    this.renderer.dispose()
    this.modelTarget.depthTexture?.dispose()
    this.modelTarget.dispose()
    this.screenshotTarget.dispose()
    this.rttTarget.dispose()
    this.postProcessingManager?.dispose()
  }

  addGUIComponent(object: THREE.Object3D) {
    this.GUIScene.add(object)
  }

  createRTTScene(): SceneInfo {
    const uniforms = {
      tBase: { value: this.modelTarget.texture },
      texelSize: { value: new THREE.Vector2() }
    }
    const { scene } = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: rttVertex,
      fragmentShader: rttFragment
    })
    return { scene, uniforms }
  }

  createAntialiasScene(): SceneInfo {
    const uniforms = {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2() }
    }
    const { scene } = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: antialiasVertex,
      fragmentShader: antialiasFragment
    })
    return { scene, uniforms }
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height, false)

    this.modelTarget.setSize(width, height)
    this.screenshotTarget.setSize(width, height)
    this.rttTarget.setSize(width, height)
    this.rttUniforms.texelSize.value.set(1.75 / width, 1.75 / height)
    this.antiAliasUniforms.resolution.value.set(width, height)

    // Update post-processing manager size
    this.postProcessingManager?.setSize(width, height)
  }

  getSize(): { width: number; height: number } {
    return this.renderer.getSize(new THREE.Vector2())
  }

  async getScreenshot(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    width = this.getSize().width,
    height = this.getSize().height
  ) {
    const { width: oldWidth, height: oldHeight } = this.getSize()
    this.setSize(width, height)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(width, 1)

    const pixelBuffer = new Uint8Array(width * 4)

    this.render(scene, camera, this.screenshotTarget)
    for (let y = 0; y < height; y++) {
      this.renderer.readRenderTargetPixels(
        this.screenshotTarget,
        0,
        y,
        width,
        1,
        pixelBuffer
      )

      if (!this.alpha) {
        for (let x = 0; x < width; x++) {
          let idx = x * 4 + 3
          if (pixelBuffer[idx] === 0) {
            pixelBuffer[idx--] = 255
            pixelBuffer[idx--] = 0
            pixelBuffer[idx--] = 0
            pixelBuffer[idx--] = 0
          }
        }
      }
      imageData.data.set(pixelBuffer)
      ctx.putImageData(imageData, 0, height - 1 - y)
    }
    this.setSize(oldWidth, oldHeight)

    const blob = await getBlob(canvas)
    canvas.remove()

    return URL.createObjectURL(blob)
  }

  render(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    target?: THREE.WebGLRenderTarget
  ) {
    this.onBeforeModelRender()

    // Use PostProcessingManager if available and has active effects
    if (
      this.postProcessingManager &&
      this.postProcessingManager.hasActiveEffects()
    ) {
      // Update camera in case it changed
      if (camera instanceof THREE.PerspectiveCamera) {
        this.postProcessingManager.setCamera(camera)
      }

      // ALWAYS render scene to modelTarget first
      // This ensures consistent lighting/material behavior
      this.renderer.setRenderTarget(this.modelTarget)
      this.renderer.render(scene, camera)
      this.onBeforeSelectRender()

      // Then apply post-processing
      if (target) {
        // For screenshots, render post-processing, then copy result to target
        this.postProcessingManager.render()
        const originalTexture = this.rttUniforms.tBase.value
        this.rttUniforms.tBase.value =
          this.postProcessingManager.getOutputTexture()
        this.renderer.setRenderTarget(target)
        this.renderer.render(this.rttScene, quadCamera)
        this.rttUniforms.tBase.value = originalTexture
      } else {
        // Render post-processing directly to screen
        this.postProcessingManager.render()
      }
    } else {
      // No post-processing - render directly
      this.renderer.setRenderTarget(this.modelTarget)
      this.renderer.render(scene, camera)
      this.onBeforeSelectRender()

      this.renderer.setRenderTarget(target || null)
      this.renderer.render(this.rttScene, quadCamera)
    }

    // GUI overlay
    this.renderer.autoClear = false
    this.renderer.render(this.GUIScene, camera)
    this.renderer.autoClear = true

    this.onAfterRender()
  }

  getRawRenderer() {
    return this.renderer
  }

  /**
   * Initialize the post-processing pipeline.
   *
   * @param scene - The scene to render
   * @param camera - The camera to use
   * @param settings - Optional post-processing settings
   */
  initPostProcessing(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    settings?: Partial<PostProcessingSettings>
  ): void {
    this.postProcessingScene = scene
    this.postProcessingCamera = camera

    // Pass the modelTarget so N8AO can reuse it instead of re-rendering
    this.postProcessingManager = new PostProcessingManager(
      this.renderer,
      scene,
      camera,
      settings,
      this.modelTarget
    )

    // Sync size
    const size = this.getSize()
    if (size.width > 0 && size.height > 0) {
      this.postProcessingManager.setSize(size.width, size.height)
    }
  }

  /**
   * Update post-processing settings.
   *
   * @param settings - Partial settings to update
   */
  updatePostProcessingSettings(
    settings: Partial<PostProcessingSettings>
  ): void {
    this.postProcessingManager?.updateSettings(settings)
  }

  /**
   * Get current post-processing settings.
   *
   * @returns Current settings or defaults if not initialized
   */
  getPostProcessingSettings(): PostProcessingSettings {
    return this.postProcessingManager
      ? this.postProcessingManager.getSettings()
      : DEFAULT_POST_PROCESSING_SETTINGS
  }

  /**
   * Check if post-processing is enabled.
   *
   * @returns True if post-processing pipeline is active
   */
  isPostProcessingEnabled(): boolean {
    return this.postProcessingManager !== null
  }

  /**
   * Enable or disable SSAO rendering.
   *
   * @param enabled - Whether to enable SSAO
   */
  setSSAOEnabled(enabled: boolean): void {
    this.postProcessingManager?.updateSettings({
      ssao: { ...this.getPostProcessingSettings().ssao, enabled }
    })
  }
}

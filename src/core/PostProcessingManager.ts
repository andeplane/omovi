import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { N8AOPass } from 'n8ao'

/**
 * Settings for Screen Space Ambient Occlusion (SSAO) effect.
 */
export interface SSAOSettings {
  /** Whether SSAO is enabled */
  enabled: boolean
  /** AO sampling radius - larger values affect more distant surfaces */
  radius: number
  /** AO intensity - higher values create darker shadows */
  intensity: number
}

/**
 * Configuration for all post-processing effects.
 * Each effect has its own settings object for clean organization.
 */
export interface PostProcessingSettings {
  /** Screen Space Ambient Occlusion settings */
  ssao: SSAOSettings
  // Future effects follow same pattern:
  // bloom: BloomSettings
  // ssr: SSRSettings
}

/**
 * Default post-processing settings.
 */
export const DEFAULT_POST_PROCESSING_SETTINGS: PostProcessingSettings = {
  ssao: {
    enabled: true,
    radius: 10.0,
    intensity: 5.0
  }
}

/**
 * Manages post-processing effects using Three.js EffectComposer.
 *
 * This class provides a clean abstraction for adding, configuring, and
 * rendering post-processing effects. Currently supports N8AO for SSAO.
 *
 * @example
 * ```typescript
 * const manager = new PostProcessingManager(renderer, scene, camera)
 * manager.updateSettings({ ssao: { enabled: true, radius: 15, intensity: 3 } })
 * // In render loop:
 * manager.render()
 * ```
 */
export class PostProcessingManager {
  private renderer: THREE.WebGLRenderer
  private composer: EffectComposer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private beautyRenderTarget: THREE.WebGLRenderTarget | null = null

  // Passes
  private renderPass: RenderPass
  private outputPass: OutputPass
  private n8aoPass: N8AOPass | null = null

  // Current settings
  private settings: PostProcessingSettings

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    settings: Partial<PostProcessingSettings> = {},
    beautyRenderTarget?: THREE.WebGLRenderTarget
  ) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    this.beautyRenderTarget = beautyRenderTarget || null
    this.settings = this.mergeSettings(DEFAULT_POST_PROCESSING_SETTINGS, settings)

    // Create effect composer
    this.composer = new EffectComposer(renderer)

    // Create render pass (always needed)
    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)

    // Create output pass (always needed, handles color space)
    this.outputPass = new OutputPass()

    // Initialize passes based on settings
    this.initializePasses()
    this.rebuildPassChain()
  }

  /**
   * Deep merge settings with defaults.
   */
  private mergeSettings(
    defaults: PostProcessingSettings,
    overrides: Partial<PostProcessingSettings>
  ): PostProcessingSettings {
    return {
      ssao: {
        ...defaults.ssao,
        ...(overrides.ssao || {})
      }
    }
  }

  /**
   * Initialize all post-processing passes.
   */
  private initializePasses(): void {
    const size = this.renderer.getSize(new THREE.Vector2())
    const width = size.x || 1
    const height = size.y || 1

    // N8AO Pass
    this.n8aoPass = new N8AOPass(this.scene, this.camera, width, height)
    
    // If we have a beauty render target, configure N8AO to use it
    // This prevents double-rendering of the scene
    if (this.beautyRenderTarget) {
      this.n8aoPass.beautyRenderTarget = this.beautyRenderTarget
      this.n8aoPass.configuration.autoRenderBeauty = false
    }
    
    this.n8aoPass.configuration.aoRadius = this.settings.ssao.radius
    this.n8aoPass.configuration.intensity = this.settings.ssao.intensity
    this.n8aoPass.configuration.distanceFalloff = 1.0
    this.n8aoPass.setQualityMode('Medium')
  }

  /**
   * Rebuild the pass chain based on current settings.
   * Pass order is important for correct rendering.
   */
  private rebuildPassChain(): void {
    // Remove all passes except render pass
    while (this.composer.passes.length > 0) {
      this.composer.removePass(this.composer.passes[0])
    }

    if (!this.beautyRenderTarget) {
      // Standard mode: render scene ourselves
      this.composer.addPass(this.renderPass)
    }
    // If beautyRenderTarget is provided, scene is already rendered externally

    // Ambient Occlusion (N8AO)
    if (this.settings.ssao.enabled && this.n8aoPass) {
      // N8AOPass doesn't extend Pass, so we cast it
      this.composer.addPass(this.n8aoPass as unknown as RenderPass)
    }

    if (!this.beautyRenderTarget) {
      // Standard mode: apply output pass for color space conversion
      this.composer.addPass(this.outputPass)
    }
    // Skip OutputPass when using external render target to match legacy behavior
  }

  /**
   * Update settings. Supports partial updates.
   *
   * @param settings - Partial settings to update
   *
   * @example
   * ```typescript
   * manager.updateSettings({ ssao: { intensity: 8 } })
   * ```
   */
  updateSettings(settings: Partial<PostProcessingSettings>): void {
    const oldSsaoEnabled = this.settings.ssao.enabled
    this.settings = this.mergeSettings(this.settings, settings)

    // Update N8AO pass settings
    if (this.n8aoPass) {
      this.n8aoPass.configuration.aoRadius = this.settings.ssao.radius
      this.n8aoPass.configuration.intensity = this.settings.ssao.intensity
    }

    // Rebuild chain if SSAO enabled state changed
    if (oldSsaoEnabled !== this.settings.ssao.enabled) {
      this.rebuildPassChain()
    }
  }

  /**
   * Enable or disable SSAO.
   *
   * @param enabled - Whether to enable SSAO
   */
  setSSAOEnabled(enabled: boolean): void {
    this.updateSettings({ ssao: { ...this.settings.ssao, enabled } })
  }

  /**
   * Update the size of all passes.
   *
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  setSize(width: number, height: number): void {
    this.composer.setSize(width, height)

    if (this.n8aoPass) {
      this.n8aoPass.setSize(width, height)
    }
  }

  /**
   * Update the camera reference for all passes.
   *
   * @param camera - New camera
   */
  setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera
    this.renderPass.camera = camera

    if (this.n8aoPass) {
      this.n8aoPass.camera = camera
    }
  }

  /**
   * Render the scene with all enabled post-processing effects.
   */
  render(): void {
    this.composer.render()
  }

  /**
   * Check if any post-processing effects are enabled.
   *
   * @returns True if at least one effect is enabled
   */
  hasActiveEffects(): boolean {
    return this.settings.ssao.enabled
  }

  /**
   * Get current settings.
   *
   * @returns Copy of current settings
   */
  getSettings(): PostProcessingSettings {
    return {
      ssao: { ...this.settings.ssao }
    }
  }

  /**
   * Get the output texture from the composer.
   * This contains the result of the post-processing pipeline.
   *
   * @returns The final texture after all post-processing effects
   */
  getOutputTexture(): THREE.Texture {
    return this.composer.readBuffer.texture
  }

  /**
   * Dispose of all resources.
   */
  dispose(): void {
    this.n8aoPass?.dispose()
    this.composer.dispose()
  }
}

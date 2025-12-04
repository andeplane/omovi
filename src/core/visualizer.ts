import * as THREE from 'three'
import { ComboControls, CameraUpdateEvent } from '../controls'
import { Material } from './materials'
import DataTexture from './datatexture'
import createMaterial from './materials'
import particleFragmentShader from './geometries/particles/shaders/fragment'
import particleVertexShader from './geometries/particles/shaders/vertex'
import bondFragmentShader from './geometries/bonds/shaders/fragment'
import bondVertexShader from './geometries/bonds/shaders/vertex'
import Particles from './geometries/particles/particles'
import Bonds from './geometries/bonds/bonds'
import { Color } from './types'
import OMOVIRenderer from './renderer'
import { PostProcessingSettings } from './PostProcessingManager'
import { VRButton } from '../utils/VRButton'
import { PickingHandler, PickResult } from './picking'
import {
  outlineVertexShader,
  outlineFragmentShader
} from './post-processing/outlineShader'
import {
  DEFAULT_SELECTION_COLOR,
  OUTLINE_ALPHA_DIVISOR,
  MAX_PARTICLE_INDEX,
  MAX_TEXTURE_SIZE,
  CLICK_DISTANCE_THRESHOLD,
  DEFAULT_CAMERA_FOV,
  DEFAULT_CAMERA_NEAR,
  DEFAULT_CAMERA_FAR
} from './constants'
import { SelectionManager } from './selection/SelectionManager'
import {
  InputHandler,
  ParticleClickEvent as InputParticleClickEvent
} from './input/InputHandler'

import Stats from 'stats.js'

const inverseModelMatrix = new THREE.Matrix4()
const modelViewMatrix = new THREE.Matrix4()
const normalMatrix = new THREE.Matrix3()
const inverseNormalMatrix = new THREE.Matrix3()

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()

const makePerpendicular = (v: THREE.Vector3, t: THREE.Vector3) => {
  if (v.x == 0.0 && v.y == 0.0) {
    if (v.z == 0.0) {
      return t.set(0.0, 0.0, 0.0)
    }
    return t.set(0.0, 1.0, 0.0)
  }
  return t.set(-v.y, v.x, 0.0).normalize()
}

const adjustCamera = (
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
) => {
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = width / height
  }
  camera.updateProjectionMatrix()
}

/**
 * Event data passed when a particle is clicked.
 */
export interface ParticleClickEvent {
  /** The LAMMPS atom ID of the clicked particle */
  particleIndex: number
  /** 3D position of the clicked particle */
  position: THREE.Vector3
  /** Whether the shift key was pressed during the click */
  shiftKey: boolean
}

/**
 * Configuration options for the Visualizer.
 */
interface VisualizerProps {
  /** DOM element to attach the visualizer to */
  domElement?: HTMLElement
  /** Callback fired when camera position or target changes */
  onCameraChanged?: (position: THREE.Vector3, target: THREE.Vector3) => void
  /** Callback fired when a particle is clicked */
  onParticleClick?: (event: ParticleClickEvent) => void
  /** Initial colors for particle types (indexed by type) */
  initialColors?: Color[]
}

/**
 * Main visualization class for rendering molecular dynamics simulations.
 *
 * Manages a Three.js scene with camera controls, particle/bond rendering,
 * selection, and post-processing effects like SSAO and outlines.
 *
 * @example
 * ```typescript
 * const visualizer = new Visualizer({
 *   domElement: container,
 *   onParticleClick: (event) => {
 *     console.log('Clicked particle:', event.particleIndex)
 *     visualizer.setSelected(event.particleIndex, true)
 *   }
 * })
 *
 * visualizer.add(particles)
 * visualizer.setColor(1, { r: 255, g: 0, b: 0 })
 * ```
 */
export default class Visualizer {
  private canvas: HTMLCanvasElement
  public scene: THREE.Scene
  public forceRender: boolean
  public renderer: OMOVIRenderer
  public ambientLight: THREE.AmbientLight
  public idle: boolean
  public pointLight: THREE.PointLight
  public materials: { [key: string]: Material }
  private cachedMeshes: { [key: string]: THREE.Mesh }
  private setRadiusCalled: boolean
  private camera: THREE.PerspectiveCamera
  private controls: ComboControls
  private clock: THREE.Clock
  private domElement?: HTMLElement
  private object: THREE.Object3D
  private cpuStats: Stats
  private memoryStats: Stats
  private colorTexture: DataTexture
  private radiusTexture: DataTexture
  private selectionTexture: DataTexture
  private selectionManager: SelectionManager
  private atomIdToParticleInfo: Map<
    number,
    { particles: Particles; arrayIndex: number }
  > = new Map() // O(1) lookup for picking
  private pickingHandler: PickingHandler
  private inputHandler: InputHandler
  private currentParticles?: Particles
  public debugPickingRender: boolean = false // Set to true to see picking visualization
  private selectionColor: THREE.Color
  private outlineRenderTarget?: THREE.WebGLRenderTarget
  private outlineMaterial?: THREE.ShaderMaterial
  private outlineScene?: THREE.Scene
  private outlineCamera?: THREE.OrthographicCamera
  private outlineQuad?: THREE.Mesh
  private systemBounds?: THREE.Box3
  private systemCenter?: THREE.Vector3
  private systemDiagonal?: number
  private particlesObjects: Particles[] = []
  private bondsObjects: Bonds[] = []
  // Reusable Vector3 instances for calculations to reduce allocations
  private _v1 = new THREE.Vector3()
  private _v2 = new THREE.Vector3()

  constructor({
    domElement,
    initialColors,
    onCameraChanged,
    onParticleClick
  }: VisualizerProps = {}) {
    this.renderer = new OMOVIRenderer({
      alpha: false
    })
    this.idle = false
    this.setRadiusCalled = false
    this.canvas = this.renderer.getRawRenderer().domElement
    if (domElement) {
      this.domElement = domElement
      this.domElement.appendChild(this.canvas)
    }
    this.setupCanvas(this.canvas)

    this.scene = new THREE.Scene()
    this.forceRender = false
    this.cachedMeshes = {}

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.05)
    // Point light with modern lighting (candela units, physically correct)
    this.pointLight = new THREE.PointLight(0xffffff, 20.0, 200, 0.8)
    this.scene.add(this.ambientLight)
    this.scene.add(this.pointLight)

    this.colorTexture = new DataTexture(
      'colorTexture',
      MAX_PARTICLE_INDEX,
      'rgba',
      () => {
        this.forceRender = true
      }
    )
    this.radiusTexture = new DataTexture(
      'radiusTexture',
      MAX_PARTICLE_INDEX,
      'float',
      () => {
        this.forceRender = true
      }
    )
    this.selectionTexture = new DataTexture(
      'selectionTexture',
      MAX_PARTICLE_INDEX,
      'rgba',
      () => {
        this.forceRender = true
      }
    )
    // Initialize selection manager
    this.selectionManager = new SelectionManager(this.selectionTexture, () => {
      this.forceRender = true
    })

    initialColors?.forEach((color, index) => {
      this.colorTexture.setRGBA(index, color.r, color.g, color.b)
    })

    this.camera = new THREE.PerspectiveCamera(
      DEFAULT_CAMERA_FOV,
      640 / 480,
      DEFAULT_CAMERA_NEAR,
      DEFAULT_CAMERA_FAR
    )
    this.setupCamera(this.camera)
    this.controls = new ComboControls(this.camera, this.canvas)
    this.controls.addEventListener('cameraChange', (event) => {
      const { position, target } = event.camera

      // Update light position
      this.updatePointLightPosition()

      if (onCameraChanged) {
        onCameraChanged(position, target)
      }
    })

    this.clock = new THREE.Clock()
    this.object = new THREE.Object3D()
    this.scene.add(this.object)

    this.cpuStats = new Stats()
    this.memoryStats = new Stats()
    this.cpuStats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    this.memoryStats.showPanel(2) // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(this.cpuStats.dom)
    // this.cpuStats.domElement.style.cssText =
    //   'position:absolute;top:0px;right:80px;'
    // this.memoryStats.domElement.style.cssText =
    //   'position:absolute;top:0px;right:0px;'
    // document.body.appendChild(this.memoryStats.dom)

    this.materials = {}
    this.selectionColor = DEFAULT_SELECTION_COLOR
    this.materials['particles'] = createMaterial(
      'particle',
      particleVertexShader,
      particleFragmentShader,
      this.colorTexture,
      this.radiusTexture,
      this.selectionTexture,
      this.selectionColor
    )
    this.materials['bonds'] = createMaterial(
      'bonds',
      bondVertexShader,
      bondFragmentShader,
      this.colorTexture,
      this.radiusTexture
    )

    // Initialize picking handler
    this.pickingHandler = new PickingHandler(
      this.renderer.getRawRenderer(),
      this.radiusTexture
    )

    // Initialize input handler for particle picking
    this.inputHandler = new InputHandler(
      this.canvas,
      this.pickingHandler,
      this.camera,
      this.scene,
      this.particlesObjects,
      this.bondsObjects,
      this.renderer,
      this.atomIdToParticleInfo,
      onParticleClick
    )

    // Initialize outline post-processing
    this.initializeOutlinePostProcessing()

    this.animate()

    // this.renderer.getRawRenderer().xr.enabled = true
    // document.body.appendChild(
    //   VRButton.createButton(this.renderer.getRawRenderer())
    // )
    this.renderer.getRawRenderer().setAnimationLoop(this.animate)
  }

  /**
   * Add particles or bonds to the scene.
   *
   * @param object - Particles or Bonds object to add
   *
   * @example
   * ```typescript
   * const particles = new Particles(100)
   * particles.add(0, 0, 0, 0, 1)
   * visualizer.add(particles)
   * ```
   */
  add = (object: Particles | Bonds) => {
    if (this.cachedMeshes[object.id]) {
      this.object.add(this.cachedMeshes[object.id])
      if (object instanceof Particles) {
        this.currentParticles = object
        this.inputHandler.setCurrentParticles(object)
        // Populate atomIdToParticleInfo map for O(1) picking lookup
        for (let i = 0; i < object.count; i++) {
          const atomId = object.indices[i]
          this.atomIdToParticleInfo.set(atomId, {
            particles: object,
            arrayIndex: i
          })
        }
      }
      return
    }

    let material: THREE.Material
    if (object instanceof Particles) {
      material = this.materials['particles']
      this.currentParticles = object
      this.inputHandler.setCurrentParticles(object)
      // Track particles object for bounds calculation
      if (!this.particlesObjects.includes(object)) {
        this.particlesObjects.push(object)
      }
      // Populate atomIdToParticleInfo map for O(1) picking lookup
      for (let i = 0; i < object.count; i++) {
        const atomId = object.indices[i]
        this.atomIdToParticleInfo.set(atomId, {
          particles: object,
          arrayIndex: i
        })
      }
    } else {
      material = this.materials['bonds']
      // Track bonds object for bounds calculation
      if (!this.bondsObjects.includes(object)) {
        this.bondsObjects.push(object)
      }
    }

    const geometry = object.getGeometry()
    const mesh = new THREE.InstancedMesh(geometry, material, object.capacity)
    mesh.count = object.count

    object.mesh = mesh
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < object.count; i++) {
      mesh.setMatrixAt(i, matrix)
    }
    mesh.frustumCulled = false

    this.cachedMeshes[object.id] = mesh

    this.object.add(mesh)

    // Recalculate bounds and update light position when objects are added
    this.calculateSystemBounds()
    this.updatePointLightPosition()
    // Update camera planes based on system bounds (fallback if simulation box not available)
    if (this.systemBounds) {
      this.updateCameraPlanes(this.systemBounds)
    }
  }

  /**
   * Remove particles or bonds from the scene.
   *
   * @param object - Particles or Bonds object to remove
   * @throws Error if the object was never added to the scene
   */
  remove = (object: Particles | Bonds) => {
    if (this.cachedMeshes[object.id]) {
      this.object.remove(this.cachedMeshes[object.id])

      // Clear atomIdToParticleInfo map entries for this Particles object
      if (object instanceof Particles) {
        for (let i = 0; i < object.count; i++) {
          const atomId = object.indices[i]
          this.atomIdToParticleInfo.delete(atomId)
        }
        // Remove from particles objects tracking
        const particlesIndex = this.particlesObjects.indexOf(object)
        if (particlesIndex !== -1) {
          this.particlesObjects.splice(particlesIndex, 1)
        }
      } else {
        // Remove from bonds objects tracking
        const bondsIndex = this.bondsObjects.indexOf(object)
        if (bondsIndex !== -1) {
          this.bondsObjects.splice(bondsIndex, 1)
        }
      }

      // Recalculate bounds and update light position when objects are removed
      this.calculateSystemBounds()
      this.updatePointLightPosition()
      // Update camera planes based on system bounds (fallback if simulation box not available)
      if (this.systemBounds) {
        this.updateCameraPlanes(this.systemBounds)
      }

      return
    }
    throw new Error('Tried to remove object that never was added to the scene.')
  }

  setupCanvas = (canvas: HTMLCanvasElement) => {
    canvas.style.width = '640px'
    canvas.style.height = '480px'
    canvas.style.minWidth = '100%'
    canvas.style.minHeight = '100%'
    canvas.style.maxWidth = '100%'
    canvas.style.maxHeight = '100%'
  }

  setupCamera = (camera: THREE.PerspectiveCamera) => {
    camera.position.set(10, 10, 10)
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  }

  updateUniforms = (camera: THREE.PerspectiveCamera) => {
    this.object.matrixWorld.copy(this.object.matrixWorld).invert()
    modelViewMatrix
      .copy(camera.matrixWorldInverse)
      .multiply(this.object.matrixWorld)
    normalMatrix.getNormalMatrix(modelViewMatrix)
    inverseNormalMatrix.copy(normalMatrix).invert()

    Object.values(this.materials).forEach((material) => {
      if (material.uniforms.inverseModelMatrix != null) {
        material.uniforms.inverseModelMatrix.value.copy(inverseModelMatrix)
      }
      if (material.uniforms.inverseNormalMatrix != null) {
        material.uniforms.inverseNormalMatrix.value.copy(inverseNormalMatrix)
      }
    })
  }

  /**
   * Clean up resources and remove event listeners.
   * Call this when the visualizer is no longer needed.
   */
  dispose = () => {
    this.inputHandler.dispose()
    this.pickingHandler.dispose()
    if (this.domElement) {
      this.domElement.removeChild(this.canvas)
    }
    Object.values(this.materials).forEach((material) => {
      material.dispose()
    })
    this.renderer.dispose()
  }

  /**
   * Get the current camera position.
   *
   * @returns Camera position as a Three.js Vector3
   */
  getCameraPosition = () => {
    return this.controls.getState().position
  }

  /**
   * Get the current camera target (look-at point).
   *
   * @returns Camera target as a Three.js Vector3
   */
  getCameraTarget = () => {
    return this.controls.getState().target
  }

  /**
   * Set the camera position.
   *
   * @param position - New camera position
   *
   * @example
   * ```typescript
   * visualizer.setCameraPosition(new THREE.Vector3(10, 10, 10))
   * ```
   */
  setCameraPosition = (position: THREE.Vector3) => {
    this.controls.setState(position, this.getCameraTarget())
  }

  /**
   * Set the camera target (look-at point).
   *
   * @param target - New camera target
   *
   * @example
   * ```typescript
   * visualizer.setCameraTarget(new THREE.Vector3(0, 0, 0))
   * ```
   */
  setCameraTarget = (target: THREE.Vector3) => {
    this.controls.setState(this.getCameraPosition(), target)
  }

  /**
   * Set the color for a particle type.
   *
   * @param index - Particle type index
   * @param color - RGB color with values 0-255
   *
   * @example
   * ```typescript
   * visualizer.setColor(1, { r: 255, g: 0, b: 0 }) // Red
   * ```
   */
  setColor = (index: number, color: Color) => {
    this.colorTexture.setRGBA(index, color.r, color.g, color.b)
  }

  /**
   * Set the radius for a particle type.
   *
   * @param index - Particle type index
   * @param radius - Particle radius in simulation units
   *
   * @example
   * ```typescript
   * visualizer.setRadius(1, 0.5) // Half unit radius
   * ```
   */
  setRadius = (index: number, radius: number) => {
    this.setRadiusCalled = true
    this.radiusTexture.setFloat(index, radius)
  }

  /**
   * Set the selection state of a particle by atom ID.
   * Selected particles are highlighted with an outline.
   *
   * @param atomId - The LAMMPS atom ID
   * @param selected - Whether the particle should be selected
   *
   * @example
   * ```typescript
   * visualizer.setSelected(42, true)  // Select particle with ID 42
   * visualizer.setSelected(42, false) // Deselect it
   * ```
   */
  setSelected = (atomId: number, selected: boolean) => {
    this.selectionManager.setSelected(atomId, selected)
  }

  /**
   * Clear all particle selections.
   *
   * @example
   * ```typescript
   * visualizer.clearSelection()
   * ```
   */
  clearSelection = () => {
    this.selectionManager.clearSelection()
  }

  private initializeOutlinePostProcessing = () => {
    const size = this.renderer.getRawRenderer().getSize(new THREE.Vector2())

    // Create render target for intermediate rendering
    this.outlineRenderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    })

    // Create outline material
    this.outlineMaterial = new THREE.ShaderMaterial({
      vertexShader: outlineVertexShader,
      fragmentShader: outlineFragmentShader,
      uniforms: {
        tDiffuse: { value: this.outlineRenderTarget.texture },
        resolution: { value: new THREE.Vector2(size.x, size.y) },
        outlineOffset: { value: 1.5 }, // 1-2 pixel offset for thin outline
        outlineAlphaDivisor: { value: OUTLINE_ALPHA_DIVISOR }
      }
    })

    // Create fullscreen quad for post-processing
    this.outlineScene = new THREE.Scene()
    this.outlineCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.outlineQuad = new THREE.Mesh(geometry, this.outlineMaterial)
    this.outlineScene.add(this.outlineQuad)
  }

  private hasSelection = (): boolean => {
    return this.selectionManager.hasSelection()
  }

  private calculateSystemBounds = () => {
    const box = new THREE.Box3()
    let hasAnyPositions = false
    const position = new THREE.Vector3()

    // Add all particle positions
    for (const particles of this.particlesObjects) {
      const positions = particles.positions
      for (let i = 0; i < particles.count; i++) {
        position.fromArray(positions, i * 3)
        box.expandByPoint(position)
        hasAnyPositions = true
      }
    }

    // Add all bond endpoint positions
    for (const bonds of this.bondsObjects) {
      const positions1 = bonds.positions1
      const positions2 = bonds.positions2
      for (let i = 0; i < bonds.count; i++) {
        position.fromArray(positions1, i * 3)
        box.expandByPoint(position)
        position.fromArray(positions2, i * 3)
        box.expandByPoint(position)
        hasAnyPositions = true
      }
    }

    if (hasAnyPositions) {
      this.systemBounds = box.clone()
      this.systemCenter = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      this.systemDiagonal = size.length()
    } else {
      this.systemBounds = undefined
      this.systemCenter = undefined
      this.systemDiagonal = undefined
    }
  }

  private updatePointLightPosition = () => {
    const cameraPosition = this.camera.position

    // Calculate point light position based on system bounds
    if (
      this.systemBounds &&
      this.systemCenter &&
      this.systemDiagonal !== undefined
    ) {
      // Direction from center to camera
      const direction = this._v1.subVectors(cameraPosition, this.systemCenter)
      const distanceToCenter = direction.length()

      // Max distance from center: position light so the box subtends 90 degrees (45° half-angle)
      // tan(45°) = radius / distance, so distance = radius
      // Using systemDiagonal / 2 as conservative estimate of perpendicular extent
      const maxDistanceFromCenter = this.systemDiagonal / 2

      if (distanceToCenter < 1e-6) {
        // Camera is at center, use a default direction (e.g., +Z)
        this.pointLight.position
          .copy(this.systemCenter)
          .add(this._v2.set(0, 0, maxDistanceFromCenter))
      } else {
        const normalizedDirection = this._v2.copy(direction).normalize()

        // Light is along camera-center axis, but never further than maxDistanceFromCenter
        // Use camera distance if closer, otherwise clamp to max
        const lightDistance = Math.min(distanceToCenter, maxDistanceFromCenter)
        this.pointLight.position
          .copy(this.systemCenter)
          .addScaledVector(normalizedDirection, lightDistance)
      }
    } else {
      // Fall back to current behavior if no system bounds available
      this.pointLight.position.copy(cameraPosition)
    }
  }

  animate = () => {
    if (!this.idle) {
      this.memoryStats.update()
      this.cpuStats.begin()
      this.resizeIfNeeded()
      this.controls.update(this.clock.getDelta())

      this.updateUniforms(this.camera)

      // If debug picking is enabled, render with picking material instead
      if (this.debugPickingRender) {
        const particleMeshes: THREE.InstancedMesh[] = []
        const bondMeshes: THREE.InstancedMesh[] = []
        for (const mesh of Object.values(this.cachedMeshes)) {
          if (
            mesh instanceof THREE.InstancedMesh &&
            mesh.material === this.materials['particles']
          ) {
            particleMeshes.push(mesh)
          }
          if (
            mesh instanceof THREE.InstancedMesh &&
            mesh.material === this.materials['bonds']
          ) {
            bondMeshes.push(mesh)
          }
        }
        // Trigger a debug render (this will render to screen)
        if (particleMeshes.length > 0) {
          this.pickingHandler.pick(
            0,
            0,
            this.camera,
            this.scene,
            particleMeshes,
            bondMeshes,
            true
          )
        }
      } else {
        // Check if we need outline post-processing
        const needsOutline = this.hasSelection()

        // Always render with SSAO first
        this.renderer.render(this.scene, this.camera)

        // If selection active, do outline pass on top
        if (
          needsOutline &&
          this.outlineRenderTarget &&
          this.outlineMaterial &&
          this.outlineScene &&
          this.outlineCamera
        ) {
          const rawRenderer = this.renderer.getRawRenderer()

          // Render selection mask to intermediate target (raw renderer, no SSAO needed)
          rawRenderer.setRenderTarget(this.outlineRenderTarget)
          rawRenderer.clear()
          rawRenderer.render(this.scene, this.camera)

          // Apply outline-only pass on top
          rawRenderer.setRenderTarget(null)

          // Configure material for blending on top
          this.outlineMaterial.transparent = true
          this.outlineMaterial.depthTest = false
          this.outlineMaterial.depthWrite = false

          // Disable auto-clear so we don't erase the SSAO render
          const autoClear = rawRenderer.autoClear
          rawRenderer.autoClear = false

          rawRenderer.render(this.outlineScene, this.outlineCamera)

          // Restore auto-clear
          rawRenderer.autoClear = autoClear
        }
      }

      this.cpuStats.end()

      this.forceRender = false
    }
    // this.latestRequestId = requestAnimationFrame(this.animate.bind(this))
  }

  resizeIfNeeded = () => {
    const rendererSize = this.renderer.getSize()
    const rendererPixelWidth = rendererSize.width
    const rendererPixelHeight = rendererSize.height

    let clientWidth: number
    let clientHeight: number
    // client width and height are in virtual pixels and not yet scaled by dpr
    if (this.domElement) {
      clientWidth =
        this.domElement.clientWidth !== 0
          ? this.domElement.clientWidth
          : this.canvas.clientWidth
      clientHeight =
        this.domElement.clientHeight !== 0
          ? this.domElement.clientHeight
          : this.canvas.clientHeight
    } else {
      clientWidth = this.canvas.clientWidth
      clientHeight = this.canvas.clientHeight
    }
    const clientPixelWidth = window.devicePixelRatio * clientWidth
    const clientPixelHeight = window.devicePixelRatio * clientHeight
    const clientTextureSize = clientPixelWidth * clientPixelHeight

    const scale =
      clientTextureSize > MAX_TEXTURE_SIZE
        ? Math.sqrt(MAX_TEXTURE_SIZE / clientTextureSize)
        : 1

    const width = clientPixelWidth * scale
    const height = clientPixelHeight * scale

    const maxError = 0.1 // pixels
    const isOptimalSize =
      Math.abs(rendererPixelWidth - width) < maxError &&
      Math.abs(rendererPixelHeight - height) < maxError

    if (isOptimalSize) {
      return false
    }

    this.renderer.setSize(width, height)

    adjustCamera(this.camera, width, height)

    // Resize outline render target if it exists
    if (this.outlineRenderTarget && this.outlineMaterial) {
      this.outlineRenderTarget.setSize(width, height)
      this.outlineMaterial.uniforms.resolution.value.set(width, height)
    }

    return true
  }

  /**
   * Set the color used for highlighting selected particles.
   *
   * @param color - Three.js Color object
   *
   * @example
   * ```typescript
   * import * as THREE from 'three'
   * visualizer.setSelectionColor(new THREE.Color(1.0, 0.5, 0.0)) // Orange
   * ```
   */
  public setSelectionColor = (color: THREE.Color) => {
    this.selectionColor.copy(color)
    // Update the material uniform
    const particleMaterial = this.materials['particles']
    if (
      particleMaterial &&
      particleMaterial.uniforms &&
      particleMaterial.uniforms.selectionColor
    ) {
      particleMaterial.uniforms.selectionColor.value.copy(color)
    }
    this.forceRender = true
  }

  // ============================================
  // Post-Processing Methods
  // ============================================

  /**
   * Initialize the post-processing pipeline.
   * This sets up EffectComposer with configurable effects.
   *
   * @param settings - Optional initial settings for post-processing effects
   *
   * @example
   * ```typescript
   * visualizer.initPostProcessing({
   *   ssao: { enabled: true, radius: 15, intensity: 3 }
   * })
   * ```
   */
  public initPostProcessing = (
    settings?: Partial<PostProcessingSettings>
  ): void => {
    this.renderer.initPostProcessing(this.scene, this.camera, settings)
    this.forceRender = true
  }

  /**
   * Update post-processing settings.
   *
   * @param settings - Partial settings to update
   *
   * @example
   * ```typescript
   * visualizer.updatePostProcessingSettings({
   *   ssao: { intensity: 8 }
   * })
   * ```
   */
  public updatePostProcessingSettings = (
    settings: Partial<PostProcessingSettings>
  ): void => {
    this.renderer.updatePostProcessingSettings(settings)
    this.forceRender = true
  }

  /**
   * Get current post-processing settings.
   *
   * @returns Current post-processing settings
   */
  public getPostProcessingSettings = (): PostProcessingSettings => {
    return this.renderer.getPostProcessingSettings()
  }

  /**
   * Check if post-processing is enabled.
   *
   * @returns True if post-processing pipeline is active
   */
  public isPostProcessingEnabled = (): boolean => {
    return this.renderer.isPostProcessingEnabled()
  }

  /**
   * Enable or disable SSAO (ambient occlusion).
   *
   * @param enabled - Whether to enable SSAO
   *
   * @example
   * ```typescript
   * visualizer.setSSAO(true)
   * ```
   */
  public setSSAO = (enabled: boolean): void => {
    const currentSettings = this.getPostProcessingSettings()
    this.updatePostProcessingSettings({
      ssao: { ...currentSettings.ssao, enabled }
    })
  }

  /**
   * Update camera near and far clipping planes based on a bounding box.
   * This ensures the entire simulation box is visible from any camera angle.
   *
   * @param boundingBox - THREE.Box3 representing the bounding box to encompass
   *
   * @example
   * ```typescript
   * const box = new THREE.Box3()
   * box.expandByPoint(new THREE.Vector3(0, 0, 0))
   * box.expandByPoint(new THREE.Vector3(100, 100, 100))
   * visualizer.updateCameraPlanes(box)
   * ```
   */
  public updateCameraPlanes = (boundingBox: THREE.Box3): void => {
    if (!boundingBox || boundingBox.isEmpty()) {
      return
    }

    // Calculate the diagonal length of the bounding box
    const size = boundingBox.getSize(new THREE.Vector3())
    const diagonal = size.length()

    // Handle edge case: very small or zero-sized box
    if (diagonal < 1e-6) {
      return
    }

    // Calculate near plane: small fraction of diagonal with minimum value
    // This ensures we can see close objects without z-fighting
    const nearPlane = Math.max(diagonal * 0.001, DEFAULT_CAMERA_NEAR)

    // Calculate far plane: multiple of diagonal to account for:
    // 1. Camera might be far from the box
    // 2. Need to see the entire box from any angle
    // 3. Account for perspective projection
    // Use 3x diagonal as a safe multiplier, with a maximum to prevent precision issues
    const farPlane = Math.min(diagonal * 3, DEFAULT_CAMERA_FAR)

    // Only update if values are valid and different
    if (
      isFinite(nearPlane) &&
      isFinite(farPlane) &&
      nearPlane > 0 &&
      farPlane > nearPlane &&
      (this.camera.near !== nearPlane || this.camera.far !== farPlane)
    ) {
      this.camera.near = nearPlane
      this.camera.far = farPlane
      this.camera.updateProjectionMatrix()
    }
  }
}

import * as THREE from 'three'
import { PickingHandler } from '../picking'
import Particles from '../geometries/particles/particles'
import Bonds from '../geometries/bonds/bonds'
import { CLICK_DISTANCE_THRESHOLD } from '../constants'

/**
 * Event data for particle clicks.
 */
export interface ParticleClickEvent {
  particleIndex: number
  position: THREE.Vector3
  shiftKey: boolean
}

/**
 * Handles mouse and touch input for particle picking.
 *
 * Manages click/tap detection, drag threshold checking, and coordinates
 * with the PickingHandler to identify clicked particles.
 */
export class InputHandler {
  private canvas: HTMLCanvasElement
  private pickingHandler: PickingHandler
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  private scene: THREE.Scene
  private particlesObjects: Particles[]
  private bondsObjects: Bonds[]
  private renderer: { getSize: () => { width: number; height: number } }
  private currentParticles?: Particles
  private atomIdToParticleInfo: Map<
    number,
    { particles: Particles; arrayIndex: number }
  >
  private onParticleClick?: (event: ParticleClickEvent) => void

  private mouseDownPosition?: { x: number; y: number }
  private mouseDownShiftKey: boolean = false
  private readonly clickDistanceThreshold = CLICK_DISTANCE_THRESHOLD
  private enabled: boolean = true

  /**
   * Create a new InputHandler.
   *
   * @param canvas - Canvas element to attach event listeners to
   * @param pickingHandler - Picking handler for ray-particle intersection
   * @param camera - Camera for picking calculations
   * @param scene - Scene containing particles and bonds
   * @param particlesObjects - Array of Particles objects
   * @param bondsObjects - Array of Bonds objects
   * @param renderer - Renderer for size calculations
   * @param atomIdToParticleInfo - Map for O(1) particle lookup
   * @param onParticleClick - Callback for particle clicks
   */
  constructor(
    canvas: HTMLCanvasElement,
    pickingHandler: PickingHandler,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    scene: THREE.Scene,
    particlesObjects: Particles[],
    bondsObjects: Bonds[],
    renderer: { getSize: () => { width: number; height: number } },
    atomIdToParticleInfo: Map<
      number,
      { particles: Particles; arrayIndex: number }
    >,
    onParticleClick?: (event: ParticleClickEvent) => void
  ) {
    this.canvas = canvas
    this.pickingHandler = pickingHandler
    this.camera = camera
    this.scene = scene
    this.particlesObjects = particlesObjects
    this.bondsObjects = bondsObjects
    this.renderer = renderer
    this.atomIdToParticleInfo = atomIdToParticleInfo
    this.onParticleClick = onParticleClick

    // Attach event listeners
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('touchstart', this.handleTouchStart)
    this.canvas.addEventListener('touchend', this.handleTouchEnd)
  }

  /**
   * Set the current particles object.
   *
   * @param particles - Current particles to use for picking
   */
  setCurrentParticles(particles: Particles): void {
    this.currentParticles = particles
  }

  /**
   * Set the camera used for picking calculations.
   *
   * @param camera - The new camera to use
   */
  setCamera(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera): void {
    this.camera = camera
  }

  /**
   * Enable or disable particle picking.
   *
   * @param enabled - Whether picking should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Clean up event listeners.
   */
  dispose(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)
  }

  private handleMouseDown = (event: MouseEvent) => {
    if (!this.enabled) {
      return
    }
    this.mouseDownPosition = { x: event.clientX, y: event.clientY }
    this.mouseDownShiftKey = event.shiftKey
  }

  private handleMouseUp = (event: MouseEvent) => {
    if (!this.enabled || !this.mouseDownPosition) {
      return
    }

    // Check if mouse moved significantly (drag vs click)
    const dx = event.clientX - this.mouseDownPosition.x
    const dy = event.clientY - this.mouseDownPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // If it's a drag, don't pick
    if (distance > this.clickDistanceThreshold) {
      this.mouseDownPosition = undefined
      return
    }

    this.mouseDownPosition = undefined

    // Perform picking at the event coordinates
    this.performPick(event.clientX, event.clientY)
  }

  private handleTouchStart = (event: TouchEvent) => {
    if (!this.enabled) {
      return
    }
    if (event.touches.length > 0) {
      const touch = event.touches[0]
      this.mouseDownPosition = { x: touch.clientX, y: touch.clientY }
      // On mobile, always act as if shift is pressed (toggle selection)
      this.mouseDownShiftKey = true
    }
  }

  private handleTouchEnd = (event: TouchEvent) => {
    if (!this.enabled || !this.mouseDownPosition) {
      return
    }

    if (event.changedTouches.length === 0) {
      this.mouseDownPosition = undefined
      return
    }

    const touch = event.changedTouches[0]

    // Check if touch moved significantly (drag vs tap)
    const dx = touch.clientX - this.mouseDownPosition.x
    const dy = touch.clientY - this.mouseDownPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // If it's a drag, don't pick
    if (distance > this.clickDistanceThreshold) {
      this.mouseDownPosition = undefined
      return
    }

    this.mouseDownPosition = undefined

    // Prevent default touch behavior to avoid double-firing or scrolling
    event.preventDefault()

    // Perform picking at the touch coordinates
    this.performPick(touch.clientX, touch.clientY)
  }

  /**
   * Shared picking logic used by both mouse and touch events.
   *
   * @param clientX - X coordinate in client space
   * @param clientY - Y coordinate in client space
   */
  private performPick = (clientX: number, clientY: number) => {
    if (!this.onParticleClick || !this.currentParticles) {
      return
    }

    // Get particle and bond meshes directly from objects
    const particleMeshes = this.particlesObjects
      .map((p) => p.mesh)
      .filter((m): m is THREE.InstancedMesh => !!m)
    const bondMeshes = this.bondsObjects
      .map((b) => b.mesh)
      .filter((m): m is THREE.InstancedMesh => !!m)

    if (particleMeshes.length === 0) {
      return
    }

    // Get coordinates relative to the canvas
    const rect = this.canvas.getBoundingClientRect()

    // Get renderer size (in actual pixels)
    const rendererSize = this.renderer.getSize()
    const rendererWidth = rendererSize.width
    const rendererHeight = rendererSize.height

    // Convert from client coordinates to renderer coordinates
    const x = ((clientX - rect.left) / rect.width) * rendererWidth
    const y = ((clientY - rect.top) / rect.height) * rendererHeight

    // Perform picking
    const result = this.pickingHandler.pick(
      x,
      y,
      this.camera,
      this.scene,
      particleMeshes,
      bondMeshes,
      false // Always do actual picking, debug mode just affects rendering
    )

    if (result) {
      // result.particleIndex is actually the atom ID (from particles.indices array)
      const atomId = result.particleIndex

      // O(1) lookup using atomIdToParticleInfo map (supports multiple Particles objects)
      const particleInfo = this.atomIdToParticleInfo.get(atomId)
      if (!particleInfo) {
        return
      }

      const { particles, arrayIndex } = particleInfo
      const position = particles.getPosition(arrayIndex)

      this.onParticleClick({
        particleIndex: atomId, // Return the actual atom ID
        position,
        shiftKey: this.mouseDownShiftKey
      })
    }
  }
}

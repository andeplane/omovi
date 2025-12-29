import * as THREE from 'three'
import { ComboControls } from '../controls'
import { VRButton } from '../utils/VRButton'
import { XRHandController } from './XRHandController'
import {
  XR_ROTATE_SCALE,
  XR_ZOOM_STEPS_MULTIPLIER,
  XR_ZOOM_DELTA_SCALE,
  XR_MIN_RADIUS,
  XR_MAX_RADIUS,
  XR_PHI_EPSILON
} from './constants'

/**
 * Callback to adjust camera after XR session ends.
 */
type AdjustCameraCallback = (
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
  width: number,
  height: number
) => void

/**
 * Configuration for XRSessionManager.
 */
export interface XRSessionManagerConfig {
  /** The Three.js WebGL renderer */
  renderer: THREE.WebGLRenderer
  /** Camera controls for getting/setting camera state */
  controls: ComboControls
  /** The scene to add the camera rig to */
  scene: THREE.Scene
  /** The perspective camera to use in XR mode */
  perspectiveCamera: THREE.PerspectiveCamera
  /** The current active camera (may be orthographic) */
  getActiveCamera: () => THREE.PerspectiveCamera | THREE.OrthographicCamera
  /** Callback to get renderer size */
  getRendererSize: () => { width: number; height: number }
  /** Callback to update point light position */
  onLightUpdate: () => void
  /** Callback to adjust camera after XR session ends */
  adjustCamera: AdjustCameraCallback
}

/**
 * Manages WebXR session lifecycle, camera rig, and hand controller.
 *
 * This class encapsulates all XR-related functionality:
 * - Session start/end event handling
 * - Camera rig creation and management
 * - Spherical coordinate navigation in VR
 * - Hand controller gesture handling
 */
export class XRSessionManager {
  private renderer: THREE.WebGLRenderer
  private controls: ComboControls
  private scene: THREE.Scene
  private perspectiveCamera: THREE.PerspectiveCamera
  private getActiveCamera: () =>
    | THREE.PerspectiveCamera
    | THREE.OrthographicCamera
  private getRendererSize: () => { width: number; height: number }
  private onLightUpdate: () => void
  private adjustCamera: AdjustCameraCallback

  // XR state
  private cameraRig?: THREE.Group
  private xrHandController?: XRHandController
  private sessionStartHandler?: () => void
  private sessionEndHandler?: () => void

  constructor(config: XRSessionManagerConfig) {
    this.renderer = config.renderer
    this.controls = config.controls
    this.scene = config.scene
    this.perspectiveCamera = config.perspectiveCamera
    this.getActiveCamera = config.getActiveCamera
    this.getRendererSize = config.getRendererSize
    this.onLightUpdate = config.onLightUpdate
    this.adjustCamera = config.adjustCamera
  }

  /**
   * Enable WebXR (VR/AR) mode and create a VR button.
   *
   * @returns HTMLElement - The VR button to append to your DOM
   */
  public enable(): HTMLElement {
    this.renderer.xr.enabled = true

    // Create and store session handlers so we can remove them on dispose
    this.sessionStartHandler = this.handleSessionStart.bind(this)
    this.sessionEndHandler = this.handleSessionEnd.bind(this)

    this.renderer.xr.addEventListener('sessionstart', this.sessionStartHandler)
    this.renderer.xr.addEventListener('sessionend', this.sessionEndHandler)

    // Request hand tracking as an optional feature for gesture controls
    return VRButton.createButton(this.renderer, {
      optionalFeatures: ['hand-tracking']
    })
  }

  /**
   * Update XR hand controller tracking.
   * Call this in the animation loop when XR is presenting.
   */
  public update(frame: XRFrame, referenceSpace: XRReferenceSpace): void {
    if (this.xrHandController) {
      this.xrHandController.update(frame, referenceSpace)
    }
  }

  /**
   * Check if XR session is currently presenting.
   */
  public get isPresenting(): boolean {
    return this.renderer.xr.isPresenting
  }

  /**
   * Get the camera rig position (for light positioning in XR mode).
   */
  public getCameraRigPosition(): THREE.Vector3 | undefined {
    return this.cameraRig?.position
  }

  /**
   * Clean up XR resources and event listeners.
   */
  public dispose(): void {
    // Remove event listeners
    if (this.sessionStartHandler) {
      this.renderer.xr.removeEventListener(
        'sessionstart',
        this.sessionStartHandler
      )
    }
    if (this.sessionEndHandler) {
      this.renderer.xr.removeEventListener('sessionend', this.sessionEndHandler)
    }

    // Clean up hand controller
    if (this.xrHandController) {
      this.xrHandController.dispose()
      this.xrHandController = undefined
    }

    // Clean up camera rig
    if (this.cameraRig) {
      this.cameraRig.remove(this.perspectiveCamera)
      this.scene.remove(this.cameraRig)
      this.cameraRig = undefined
    }

    this.renderer.xr.enabled = false
  }

  private handleSessionStart(): void {
    // Get current camera state at the moment VR starts
    const cameraState = this.controls.getState()

    // XR-specific spherical coordinates - target NEVER moves
    const xrTarget = cameraState.target.clone()
    const xrSpherical = new THREE.Spherical()
    const offset = cameraState.position.clone().sub(xrTarget)
    xrSpherical.setFromVector3(offset)

    // Helper to update rig from spherical coordinates
    const updateRigFromSpherical = () => {
      if (!this.cameraRig) return
      const position = new THREE.Vector3()
        .setFromSpherical(xrSpherical)
        .add(xrTarget)
      this.cameraRig.position.copy(position)
      this.cameraRig.lookAt(xrTarget)
      // Align rig's forward direction with the target (Three.js cameras look down -Z by default)
      this.cameraRig.rotateY(Math.PI)
      // Update light to follow camera in XR mode
      this.onLightUpdate()
    }

    // Create camera rig and position it where the camera currently is
    this.cameraRig = new THREE.Group()
    updateRigFromSpherical()

    // Add rig to scene, then add camera to rig
    // Camera's local position becomes (0,0,0) relative to rig
    this.scene.add(this.cameraRig)
    this.cameraRig.add(this.perspectiveCamera)
    this.perspectiveCamera.position.set(0, 0, 0)
    this.perspectiveCamera.rotation.set(0, 0, 0)

    // Initialize hand controller for gesture-based navigation
    this.xrHandController = new XRHandController(this.renderer, {
      onPinchStart: () => {
        // No-op for now
      },
      onPinchMove: (event) => {
        // Single hand pinch + drag = orbit around fixed target
        if (this.cameraRig && !this.xrHandController?.isBothHandsPinching()) {
          // Adjust spherical angles
          xrSpherical.theta -= event.delta.x * XR_ROTATE_SCALE
          xrSpherical.phi += event.delta.y * XR_ROTATE_SCALE
          // Clamp phi to avoid flipping at poles
          xrSpherical.phi = Math.max(
            XR_PHI_EPSILON,
            Math.min(Math.PI - XR_PHI_EPSILON, xrSpherical.phi)
          )

          updateRigFromSpherical()
        }
      },
      onPinchEnd: () => {
        // No-op for now
      },
      onZoom: (event) => {
        // Two hand pinch = zoom only (radius change)
        if (this.cameraRig) {
          // Use same calculation as old code for consistent zoom speed
          const zoomSteps = (1 - event.scale) * XR_ZOOM_STEPS_MULTIPLIER
          const dollyIn = zoomSteps < 0
          const deltaDistance = this.controls.getDollyDeltaDistance(
            dollyIn,
            Math.abs(zoomSteps)
          )

          // Apply to spherical radius instead of controls (slower for smoother control)
          xrSpherical.radius += deltaDistance * XR_ZOOM_DELTA_SCALE
          // Clamp radius to reasonable bounds
          xrSpherical.radius = Math.max(
            XR_MIN_RADIUS,
            Math.min(XR_MAX_RADIUS, xrSpherical.radius)
          )

          updateRigFromSpherical()
        }
      }
    })
  }

  private handleSessionEnd(): void {
    // Clean up hand controller
    if (this.xrHandController) {
      this.xrHandController.dispose()
      this.xrHandController = undefined
    }

    if (this.cameraRig) {
      // Get the rig's world position (where camera actually is after XR movement)
      // Camera is at (0,0,0) relative to rig, so rig's world position = camera's world position
      this.cameraRig.updateMatrixWorld(true)
      const rigWorldPosition = new THREE.Vector3()
      this.cameraRig.getWorldPosition(rigWorldPosition)

      // Get target from controls (should be unchanged during XR)
      const cameraState = this.controls.getState()

      // Remove camera from rig and add back to scene
      this.cameraRig.remove(this.perspectiveCamera)
      this.scene.add(this.perspectiveCamera)

      // Set camera to rig's actual world position (not stale controls state)
      this.perspectiveCamera.position.copy(rigWorldPosition)
      this.perspectiveCamera.lookAt(cameraState.target)

      // Update controls state to match actual camera position
      this.controls.setState(rigWorldPosition, cameraState.target)

      // Force matrix update after reparenting camera
      this.perspectiveCamera.updateMatrixWorld(true)

      this.scene.remove(this.cameraRig)
      this.cameraRig = undefined
    }

    // Reset render target to canvas (XR may have changed it)
    this.renderer.setRenderTarget(null)

    // Force camera aspect ratio and render target sizes to match canvas
    // XR mode may have changed these to match the headset display
    const rendererSize = this.getRendererSize()
    const activeCamera = this.getActiveCamera()
    this.adjustCamera(activeCamera, rendererSize.width, rendererSize.height)
    activeCamera.updateProjectionMatrix()

    // Update light position to follow camera (was following rig in XR mode)
    // Camera world matrix is now up-to-date after reparenting
    this.onLightUpdate()
  }
}

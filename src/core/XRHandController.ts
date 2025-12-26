import * as THREE from 'three'

/**
 * Joint names for WebXR hand tracking
 */
const THUMB_TIP = 'thumb-tip'
const INDEX_TIP = 'index-finger-tip'

/**
 * Pinch detection threshold in meters (2.5cm)
 */
const PINCH_THRESHOLD = 0.025

/**
 * State of a single hand's pinch gesture
 */
interface HandPinchState {
  isPinching: boolean
  pinchPosition: THREE.Vector3
  previousPinchPosition: THREE.Vector3
}

/**
 * Event data for pinch gestures
 */
export interface PinchEvent {
  hand: 'left' | 'right'
  position: THREE.Vector3
  delta: THREE.Vector3
}

/**
 * Event data for two-hand zoom gestures
 */
export interface ZoomEvent {
  scale: number
  centerPosition: THREE.Vector3
}

/**
 * Callback types for gesture events
 */
export interface XRHandControllerCallbacks {
  onPinchStart?: (event: PinchEvent) => void
  onPinchMove?: (event: PinchEvent) => void
  onPinchEnd?: (event: PinchEvent) => void
  onZoom?: (event: ZoomEvent) => void
}

/**
 * Controller for WebXR hand tracking with pinch gesture detection.
 * Supports single-hand pinch for panning and two-hand pinch for zooming.
 */
export class XRHandController {
  private renderer: THREE.WebGLRenderer
  private callbacks: XRHandControllerCallbacks

  // Hand state tracking
  private leftHand: HandPinchState = {
    isPinching: false,
    pinchPosition: new THREE.Vector3(),
    previousPinchPosition: new THREE.Vector3()
  }
  private rightHand: HandPinchState = {
    isPinching: false,
    pinchPosition: new THREE.Vector3(),
    previousPinchPosition: new THREE.Vector3()
  }

  // Two-hand zoom tracking
  private previousHandDistance: number = 0
  private isTwoHandZooming: boolean = false

  // Reusable vectors to avoid allocations
  private _thumbPos = new THREE.Vector3()
  private _indexPos = new THREE.Vector3()
  private _delta = new THREE.Vector3()
  private _center = new THREE.Vector3()

  // Debug flag
  private _hasLoggedInputSources = false

  constructor(renderer: THREE.WebGLRenderer, callbacks: XRHandControllerCallbacks = {}) {
    this.renderer = renderer
    this.callbacks = callbacks
  }

  /**
   * Update hand tracking state. Call this every frame when XR is presenting.
   */
  update(frame: XRFrame | null, referenceSpace: XRReferenceSpace | null): void {
    if (!frame || !referenceSpace) return

    const session = frame.session
    const inputSources = session.inputSources

    // Debug: log input sources on first call
    if (!this._hasLoggedInputSources) {
      console.log('XR Input Sources:', inputSources.length)
      for (const source of inputSources) {
        console.log('  - handedness:', source.handedness, 'hand:', !!source.hand, 'targetRayMode:', source.targetRayMode)
      }
      this._hasLoggedInputSources = true
    }

    let leftHandData: { isPinching: boolean; position: THREE.Vector3 } | null = null
    let rightHandData: { isPinching: boolean; position: THREE.Vector3 } | null = null

    // Process each input source (hand)
    for (const inputSource of inputSources) {
      if (!inputSource.hand) continue

      const handedness = inputSource.handedness
      const hand = inputSource.hand

      // Get thumb and index finger tip positions
      const thumbTip = hand.get(THUMB_TIP as XRHandJoint)
      const indexTip = hand.get(INDEX_TIP as XRHandJoint)

      if (!thumbTip || !indexTip) continue

      const thumbPose = frame.getJointPose?.(thumbTip, referenceSpace)
      const indexPose = frame.getJointPose?.(indexTip, referenceSpace)

      if (!thumbPose || !indexPose) continue

      // Get positions
      this._thumbPos.set(
        thumbPose.transform.position.x,
        thumbPose.transform.position.y,
        thumbPose.transform.position.z
      )
      this._indexPos.set(
        indexPose.transform.position.x,
        indexPose.transform.position.y,
        indexPose.transform.position.z
      )

      // Calculate pinch distance
      const pinchDistance = this._thumbPos.distanceTo(this._indexPos)
      const isPinching = pinchDistance < PINCH_THRESHOLD

      // Calculate pinch position (midpoint between thumb and index)
      const pinchPosition = new THREE.Vector3()
        .addVectors(this._thumbPos, this._indexPos)
        .multiplyScalar(0.5)

      if (handedness === 'left') {
        leftHandData = { isPinching, position: pinchPosition }
        this.processHandPinch('left', this.leftHand, isPinching, pinchPosition)
      } else if (handedness === 'right') {
        rightHandData = { isPinching, position: pinchPosition }
        this.processHandPinch('right', this.rightHand, isPinching, pinchPosition)
      }
    }

    // Check for two-hand zoom
    this.processTwoHandZoom(leftHandData, rightHandData)
  }

  /**
   * Process pinch state for a single hand
   */
  private processHandPinch(
    handedness: 'left' | 'right',
    handState: HandPinchState,
    isPinching: boolean,
    position: THREE.Vector3
  ): void {
    if (isPinching && !handState.isPinching) {
      // Pinch started
      handState.isPinching = true
      handState.pinchPosition.copy(position)
      handState.previousPinchPosition.copy(position)

      this.callbacks.onPinchStart?.({
        hand: handedness,
        position: position.clone(),
        delta: new THREE.Vector3()
      })
    } else if (isPinching && handState.isPinching) {
      // Pinch continuing - calculate delta
      this._delta.subVectors(position, handState.previousPinchPosition)

      handState.previousPinchPosition.copy(handState.pinchPosition)
      handState.pinchPosition.copy(position)

      this.callbacks.onPinchMove?.({
        hand: handedness,
        position: position.clone(),
        delta: this._delta.clone()
      })
    } else if (!isPinching && handState.isPinching) {
      // Pinch ended
      handState.isPinching = false

      this.callbacks.onPinchEnd?.({
        hand: handedness,
        position: handState.pinchPosition.clone(),
        delta: new THREE.Vector3()
      })
    }
  }

  /**
   * Process two-hand zoom gesture
   */
  private processTwoHandZoom(
    leftHandData: { isPinching: boolean; position: THREE.Vector3 } | null,
    rightHandData: { isPinching: boolean; position: THREE.Vector3 } | null
  ): void {
    const bothPinching =
      leftHandData?.isPinching && rightHandData?.isPinching

    if (bothPinching && leftHandData && rightHandData) {
      const currentDistance = leftHandData.position.distanceTo(rightHandData.position)

      if (this.isTwoHandZooming) {
        // Calculate scale factor
        const scale = currentDistance / this.previousHandDistance

        // Calculate center point between hands
        this._center
          .addVectors(leftHandData.position, rightHandData.position)
          .multiplyScalar(0.5)

        this.callbacks.onZoom?.({
          scale,
          centerPosition: this._center.clone()
        })
      }

      this.previousHandDistance = currentDistance
      this.isTwoHandZooming = true
    } else {
      this.isTwoHandZooming = false
      this.previousHandDistance = 0
    }
  }

  /**
   * Check if any hand is currently pinching
   */
  isAnyHandPinching(): boolean {
    return this.leftHand.isPinching || this.rightHand.isPinching
  }

  /**
   * Check if both hands are pinching (zoom gesture)
   */
  isBothHandsPinching(): boolean {
    return this.leftHand.isPinching && this.rightHand.isPinching
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Reset state
    this.leftHand.isPinching = false
    this.rightHand.isPinching = false
    this.isTwoHandZooming = false
  }
}

export default XRHandController


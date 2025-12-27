import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { XRHandController, XRHandControllerCallbacks } from './XRHandController'

// Helper to create a mock WebGLRenderer
function createMockRenderer(): Partial<THREE.WebGLRenderer> {
  return {}
}

// Helper to create a mock reference space
function createMockReferenceSpace(): Partial<XRReferenceSpace> {
  return {}
}

// Helper to create a joint pose with position
function createJointPose(
  x: number,
  y: number,
  z: number
): Partial<XRJointPose> {
  const position: Partial<DOMPointReadOnly> = { x, y, z, w: 1 }
  const fullPosition: DOMPointReadOnly = position as DOMPointReadOnly
  const transform: Partial<XRRigidTransform> = { position: fullPosition }
  const fullTransform: XRRigidTransform = transform as XRRigidTransform
  const pose: Partial<XRJointPose> = { transform: fullTransform }
  return pose
}

// Helper to create joint positions for a hand
function createJointPositions(
  thumbX: number,
  thumbY: number,
  thumbZ: number,
  indexX: number,
  indexY: number,
  indexZ: number
): { thumb: Partial<XRJointPose>; index: Partial<XRJointPose> } {
  return {
    thumb: createJointPose(thumbX, thumbY, thumbZ),
    index: createJointPose(indexX, indexY, indexZ)
  }
}

// Helper to create a mock joint space
function createJointSpace(jointName: XRHandJoint): Partial<XRJointSpace> {
  return { jointName }
}

// Helper to create a mock hand with specific joint positions
function createMockHand(): Partial<XRHand> {
  const jointMap: Record<string, Partial<XRJointSpace>> = {
    'thumb-tip': createJointSpace('thumb-tip'),
    'index-finger-tip': createJointSpace('index-finger-tip')
  }

  const hand: Partial<XRHand> = {
    get: (jointName: XRHandJoint) => {
      const joint: XRJointSpace | undefined = jointMap[jointName] as
        | XRJointSpace
        | undefined
      return joint
    },
    size: 2,
    forEach: vi.fn(),
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    [Symbol.iterator]: vi.fn()
  }
  return hand
}

// Helper to create a mock input source
function createInputSource(
  handedness: 'left' | 'right',
  hand: Partial<XRHand>
): Partial<XRInputSource> {
  const fullHand: XRHand = hand as XRHand
  const inputSource: Partial<XRInputSource> = {
    hand: fullHand,
    handedness,
    targetRayMode: 'tracked-pointer'
  }
  return inputSource
}

// Helper to create a mock XR frame with hands
function createMockFrame(
  hands: Array<{
    handedness: 'left' | 'right'
    joints: { thumb: Partial<XRJointPose>; index: Partial<XRJointPose> }
  }>
): Partial<XRFrame> {
  const inputSources: Partial<XRInputSource>[] = hands.map(({ handedness }) =>
    createInputSource(handedness, createMockHand())
  )

  // Create a map to look up joint poses by hand
  const jointPoseMap = new Map<string, Partial<XRJointPose>>()
  hands.forEach(({ handedness, joints }) => {
    jointPoseMap.set(`${handedness}-thumb-tip`, joints.thumb)
    jointPoseMap.set(`${handedness}-index-finger-tip`, joints.index)
  })

  const fullInputSources: XRInputSourceArray =
    inputSources as XRInputSourceArray
  const session: Partial<XRSession> = {
    inputSources: fullInputSources
  }

  const fullSession: XRSession = session as XRSession
  const thumbTipJoint: XRHandJoint = 'thumb-tip'
  const indexTipJoint: XRHandJoint = 'index-finger-tip'

  const frame: Partial<XRFrame> = {
    session: fullSession,
    getJointPose: (
      joint: XRJointSpace,
      _referenceSpace: XRSpace
    ): XRJointPose | undefined => {
      // Find which hand this joint belongs to by checking input sources
      for (const source of inputSources) {
        if (!source.hand) continue
        const hand = source.hand
        const thumbJoint = hand.get(thumbTipJoint)
        const indexJoint = hand.get(indexTipJoint)

        if (joint === thumbJoint) {
          const pose: XRJointPose | undefined = jointPoseMap.get(
            `${source.handedness}-thumb-tip`
          ) as XRJointPose | undefined
          return pose
        }
        if (joint === indexJoint) {
          const pose: XRJointPose | undefined = jointPoseMap.get(
            `${source.handedness}-index-finger-tip`
          ) as XRJointPose | undefined
          return pose
        }
      }
      return undefined
    }
  }
  return frame
}

// Helper to create pinching hand positions (below threshold)
function createPinchingJoints(): {
  thumb: Partial<XRJointPose>
  index: Partial<XRJointPose>
} {
  // Distance = 0.01m (1cm), below threshold of 2.5cm
  return createJointPositions(0, 0, 0, 0.01, 0, 0)
}

// Helper to create non-pinching hand positions (above threshold)
function createNonPinchingJoints(): {
  thumb: Partial<XRJointPose>
  index: Partial<XRJointPose>
} {
  // Distance = 0.05m (5cm), above threshold of 2.5cm
  return createJointPositions(0, 0, 0, 0.05, 0, 0)
}

describe('XRHandController', () => {
  let mockRenderer: Partial<THREE.WebGLRenderer>
  let mockReferenceSpace: Partial<XRReferenceSpace>
  let callbacks: XRHandControllerCallbacks

  beforeEach(() => {
    mockRenderer = createMockRenderer()
    mockReferenceSpace = createMockReferenceSpace()
    callbacks = {
      onPinchStart: vi.fn(),
      onPinchMove: vi.fn(),
      onPinchEnd: vi.fn(),
      onZoom: vi.fn()
    }
  })

  describe('constructor', () => {
    it('should create instance with renderer and callbacks', () => {
      // Arrange & Act
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )

      // Assert
      expect(controller).toBeInstanceOf(XRHandController)
    })

    it('should create instance with renderer only (no callbacks)', () => {
      // Arrange & Act
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer
      )

      // Assert
      expect(controller).toBeInstanceOf(XRHandController)
    })
  })

  describe('update', () => {
    it('should return early when frame is null', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )

      // Act
      controller.update(null, mockReferenceSpace as XRReferenceSpace)

      // Assert
      expect(callbacks.onPinchStart).not.toHaveBeenCalled()
      expect(callbacks.onPinchMove).not.toHaveBeenCalled()
      expect(callbacks.onPinchEnd).not.toHaveBeenCalled()
    })

    it('should return early when referenceSpace is null', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([])

      // Act
      controller.update(mockFrame as XRFrame, null)

      // Assert
      expect(callbacks.onPinchStart).not.toHaveBeenCalled()
    })

    it('should detect pinch when thumb-index distance is below threshold', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'right', joints: createPinchingJoints() }
      ])

      // Act
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(callbacks.onPinchStart).toHaveBeenCalledTimes(1)
      expect(callbacks.onPinchStart).toHaveBeenCalledWith(
        expect.objectContaining({
          hand: 'right',
          position: expect.any(THREE.Vector3)
        })
      )
    })

    it('should not detect pinch when distance is above threshold', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'right', joints: createNonPinchingJoints() }
      ])

      // Act
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(callbacks.onPinchStart).not.toHaveBeenCalled()
    })
  })

  describe('pinch callbacks', () => {
    it.each(['left', 'right'] as const)(
      'should call onPinchStart when %s hand begins pinching',
      (handedness) => {
        // Arrange
        const controller = new XRHandController(
          mockRenderer as THREE.WebGLRenderer,
          callbacks
        )
        const mockFrame = createMockFrame([
          { handedness, joints: createPinchingJoints() }
        ])

        // Act
        controller.update(
          mockFrame as XRFrame,
          mockReferenceSpace as XRReferenceSpace
        )

        // Assert
        expect(callbacks.onPinchStart).toHaveBeenCalledWith(
          expect.objectContaining({
            hand: handedness,
            position: expect.any(THREE.Vector3),
            delta: expect.any(THREE.Vector3)
          })
        )
      }
    )

    it.each(['left', 'right'] as const)(
      'should call onPinchMove with delta when %s hand continues pinching',
      (handedness) => {
        // Arrange
        const controller = new XRHandController(
          mockRenderer as THREE.WebGLRenderer,
          callbacks
        )

        // First frame - start pinch at origin
        const initialJoints = createJointPositions(0, 0, 0, 0.01, 0, 0)
        const frame1 = createMockFrame([{ handedness, joints: initialJoints }])
        controller.update(
          frame1 as XRFrame,
          mockReferenceSpace as XRReferenceSpace
        )

        // Second frame - move pinch position
        const movedJoints = createJointPositions(0.1, 0.1, 0, 0.11, 0.1, 0)
        const frame2 = createMockFrame([{ handedness, joints: movedJoints }])

        // Act
        controller.update(
          frame2 as XRFrame,
          mockReferenceSpace as XRReferenceSpace
        )

        // Assert
        expect(callbacks.onPinchMove).toHaveBeenCalledWith(
          expect.objectContaining({
            hand: handedness,
            position: expect.any(THREE.Vector3),
            delta: expect.any(THREE.Vector3)
          })
        )
      }
    )

    it.each(['left', 'right'] as const)(
      'should call onPinchEnd when %s hand releases pinch',
      (handedness) => {
        // Arrange
        const controller = new XRHandController(
          mockRenderer as THREE.WebGLRenderer,
          callbacks
        )

        // First frame - start pinch
        const pinchFrame = createMockFrame([
          { handedness, joints: createPinchingJoints() }
        ])
        controller.update(
          pinchFrame as XRFrame,
          mockReferenceSpace as XRReferenceSpace
        )

        // Second frame - release pinch
        const releaseFrame = createMockFrame([
          { handedness, joints: createNonPinchingJoints() }
        ])

        // Act
        controller.update(
          releaseFrame as XRFrame,
          mockReferenceSpace as XRReferenceSpace
        )

        // Assert
        expect(callbacks.onPinchEnd).toHaveBeenCalledWith(
          expect.objectContaining({
            hand: handedness,
            position: expect.any(THREE.Vector3),
            delta: expect.any(THREE.Vector3)
          })
        )
      }
    )

    it('should handle left and right hand independently', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'left', joints: createPinchingJoints() },
        { handedness: 'right', joints: createNonPinchingJoints() }
      ])

      // Act
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(callbacks.onPinchStart).toHaveBeenCalledTimes(1)
      expect(callbacks.onPinchStart).toHaveBeenCalledWith(
        expect.objectContaining({ hand: 'left' })
      )
    })
  })

  describe('two-hand zoom', () => {
    it('should call onZoom when both hands are pinching', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )

      // First frame - establish initial hand positions
      const leftJoints = createJointPositions(-0.1, 0, 0, -0.09, 0, 0)
      const rightJoints = createJointPositions(0.1, 0, 0, 0.11, 0, 0)
      const frame1 = createMockFrame([
        { handedness: 'left', joints: leftJoints },
        { handedness: 'right', joints: rightJoints }
      ])
      controller.update(
        frame1 as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Second frame - both hands pinching, same positions
      const frame2 = createMockFrame([
        { handedness: 'left', joints: leftJoints },
        { handedness: 'right', joints: rightJoints }
      ])

      // Act
      controller.update(
        frame2 as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(callbacks.onZoom).toHaveBeenCalled()
    })

    it('should calculate correct scale factor from hand distance change', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )

      // First frame - hands 20cm apart (pinch positions at -0.095 and 0.105)
      const leftJoints1 = createJointPositions(-0.1, 0, 0, -0.09, 0, 0)
      const rightJoints1 = createJointPositions(0.1, 0, 0, 0.11, 0, 0)
      const frame1 = createMockFrame([
        { handedness: 'left', joints: leftJoints1 },
        { handedness: 'right', joints: rightJoints1 }
      ])
      controller.update(
        frame1 as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Second frame - hands 40cm apart (double the distance)
      const leftJoints2 = createJointPositions(-0.2, 0, 0, -0.19, 0, 0)
      const rightJoints2 = createJointPositions(0.2, 0, 0, 0.21, 0, 0)
      const frame2 = createMockFrame([
        { handedness: 'left', joints: leftJoints2 },
        { handedness: 'right', joints: rightJoints2 }
      ])

      // Act
      controller.update(
        frame2 as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(callbacks.onZoom).toHaveBeenCalledWith(
        expect.objectContaining({
          scale: expect.any(Number),
          centerPosition: expect.any(THREE.Vector3)
        })
      )
      const zoomCall = vi.mocked(callbacks.onZoom!).mock.calls[0][0]
      expect(zoomCall.scale).toBeGreaterThan(1) // Zooming out (hands moved apart)
    })

    it('should not call onZoom when only one hand is pinching', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'left', joints: createPinchingJoints() },
        { handedness: 'right', joints: createNonPinchingJoints() }
      ])

      // Act
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(callbacks.onZoom).not.toHaveBeenCalled()
    })

    it('should not call onZoom when neither hand is pinching', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'left', joints: createNonPinchingJoints() },
        { handedness: 'right', joints: createNonPinchingJoints() }
      ])

      // Act
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(callbacks.onZoom).not.toHaveBeenCalled()
    })
  })

  describe('state queries', () => {
    it('isAnyHandPinching should return false initially', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )

      // Act & Assert
      expect(controller.isAnyHandPinching()).toBe(false)
    })

    it.each(['left', 'right'] as const)(
      'isAnyHandPinching should return true when %s hand is pinching',
      (handedness) => {
        // Arrange
        const controller = new XRHandController(
          mockRenderer as THREE.WebGLRenderer,
          callbacks
        )
        const mockFrame = createMockFrame([
          { handedness, joints: createPinchingJoints() }
        ])

        // Act
        controller.update(
          mockFrame as XRFrame,
          mockReferenceSpace as XRReferenceSpace
        )

        // Assert
        expect(controller.isAnyHandPinching()).toBe(true)
      }
    )

    it('isBothHandsPinching should return false when only one hand is pinching', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'left', joints: createPinchingJoints() },
        { handedness: 'right', joints: createNonPinchingJoints() }
      ])

      // Act
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(controller.isBothHandsPinching()).toBe(false)
    })

    it('isBothHandsPinching should return true when both hands are pinching', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'left', joints: createPinchingJoints() },
        { handedness: 'right', joints: createPinchingJoints() }
      ])

      // Act
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )

      // Assert
      expect(controller.isBothHandsPinching()).toBe(true)
    })
  })

  describe('dispose', () => {
    it('should reset all pinch states to false', () => {
      // Arrange
      const controller = new XRHandController(
        mockRenderer as THREE.WebGLRenderer,
        callbacks
      )
      const mockFrame = createMockFrame([
        { handedness: 'left', joints: createPinchingJoints() },
        { handedness: 'right', joints: createPinchingJoints() }
      ])
      controller.update(
        mockFrame as XRFrame,
        mockReferenceSpace as XRReferenceSpace
      )
      expect(controller.isBothHandsPinching()).toBe(true) // Verify state is set

      // Act
      controller.dispose()

      // Assert
      expect(controller.isAnyHandPinching()).toBe(false)
      expect(controller.isBothHandsPinching()).toBe(false)
    })
  })
})

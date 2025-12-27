import * as THREE from 'three'

/**
 * Default selection color - matches Reveal's light blue
 */
export const DEFAULT_SELECTION_COLOR = new THREE.Color(0.392, 0.392, 1.0)

/**
 * Outline encoding divisor used in alpha channel encoding/decoding
 * This value is used to encode the outline index into the alpha channel:
 * - alpha = (255 - index * OUTLINE_ALPHA_DIVISOR) / 255
 * And to decode it:
 * - index = floor((255 - alpha * 255) / OUTLINE_ALPHA_DIVISOR + 0.5)
 */
export const OUTLINE_ALPHA_DIVISOR = 16.0

/**
 * Maximum particle index supported by the data textures
 */
export const MAX_PARTICLE_INDEX = 4096 * 4096

/**
 * Maximum texture size for rendering (pixels)
 * Limited to maintain performance on low-powered hardware
 */
export const MAX_TEXTURE_SIZE = 1.4e6

/**
 * Click distance threshold in pixels
 * Movement less than this threshold is considered a click rather than a drag
 */
export const CLICK_DISTANCE_THRESHOLD = 5

/**
 * Default camera field of view in degrees
 */
export const DEFAULT_CAMERA_FOV = 60

/**
 * Default camera near clipping plane
 */
export const DEFAULT_CAMERA_NEAR = 0.1

/**
 * Default camera far clipping plane
 */
export const DEFAULT_CAMERA_FAR = 10000

/**
 * XR hand gesture rotation sensitivity
 */
export const XR_ROTATE_SCALE = 2.6

/**
 * XR zoom steps multiplier for pinch gesture
 */
export const XR_ZOOM_STEPS_MULTIPLIER = 50

/**
 * XR zoom delta scale factor (slower for smoother control)
 */
export const XR_ZOOM_DELTA_SCALE = 0.5

/**
 * XR minimum camera radius from target
 */
export const XR_MIN_RADIUS = 1

/**
 * XR maximum camera radius from target
 */
export const XR_MAX_RADIUS = 1000

/**
 * XR spherical phi clamp epsilon (to avoid gimbal lock at poles)
 */
export const XR_PHI_EPSILON = 0.1

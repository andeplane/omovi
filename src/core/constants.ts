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

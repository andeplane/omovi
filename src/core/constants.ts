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

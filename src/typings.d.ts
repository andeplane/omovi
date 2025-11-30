/**
 * Default CSS definition for typescript,
 * will be overridden with file-specific definitions by rollup
 */
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

interface SvgrComponent extends React.StatelessComponent<
  React.SVGAttributes<SVGElement>
> {}

declare module '*.svg' {
  const svgUrl: string
  const svgComponent: SvgrComponent
  export default svgUrl
  export { svgComponent as ReactComponent }
}

declare module 'n8ao' {
  import * as THREE from 'three'

  export interface N8AOConfiguration {
    autoRenderBeauty: boolean
    aoRadius: number
    distanceFalloff: number
    intensity: number
    gammaCorrection: boolean
    halfRes: boolean
    aoSamples: number
    denoiseSamples: number
    denoiseRadius: number
    screenSpaceRadius: boolean
    accumulate: boolean
    transparencyAware: boolean
    biasOffset: number
    biasMultiplier: number
    aoTones: number
  }

  export class N8AOPass {
    camera: THREE.Camera
    scene: THREE.Scene
    beautyRenderTarget: THREE.WebGLRenderTarget
    renderTarget: THREE.WebGLRenderTarget
    configuration: N8AOConfiguration

    constructor(
      scene: THREE.Scene,
      camera: THREE.Camera,
      width: number,
      height: number
    )

    setSize(width: number, height: number): void
    setQualityMode(mode: 'Low' | 'Medium' | 'High' | 'Ultra' | 'Performance'): void
    setDisplayMode(mode: 'Combined' | 'AO' | 'No AO' | 'Split' | 'Split AO'): void
    render(
      renderer: THREE.WebGLRenderer,
      inputBuffer: THREE.Texture | null,
      outputBuffer: THREE.WebGLRenderTarget | null,
      deltaTime: number,
      stencilBuffer: THREE.Texture | null
    ): void
    dispose(): void
  }
}

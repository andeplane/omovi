import * as THREE from 'three'
import { N8AOPass } from 'n8ao'

import { rttFragment, rttVertex } from './shaders/rtt'
import { antialiasFragment, antialiasVertex } from './shaders/antialias'
import { passThroughVertex } from './shaders/passThrough'

interface SceneInfo {
  scene: THREE.Scene
  uniforms: any
}

function setupRenderingPass(options: {
  uniforms: any
  defines: any
  vertexShader: string
  fragmentShader: string
}): { scene: THREE.Scene; material: THREE.Material } {
  const scene = new THREE.Scene()
  const material = new THREE.ShaderMaterial({
    uniforms: options.uniforms,
    defines: options.defines,
    vertexShader: options.vertexShader,
    fragmentShader: options.fragmentShader,
    depthWrite: false
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  scene.add(quad)
  return { scene, material }
}

function getBlob(canvas: HTMLCanvasElement): Promise<any> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob != null ? blob : undefined))
  })
}

const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

export default class OMOVIRenderer {
  onBeforeModelRender: () => void
  onBeforeSelectRender: () => void
  onAfterRender: () => void
  public renderSsao: boolean
  private alpha: boolean
  private renderer: THREE.WebGLRenderer
  private modelTarget: THREE.WebGLRenderTarget
  private screenshotTarget: THREE.WebGLRenderTarget
  private rttTarget: THREE.WebGLRenderTarget
  private ssaoTarget: THREE.WebGLRenderTarget
  private ssaoFinalTarget: THREE.WebGLRenderTarget
  private GUIScene: THREE.Scene
  private rttScene: THREE.Scene
  private rttUniforms: any
  private antiAliasScene: THREE.Scene
  private antiAliasUniforms: any
  private n8aoPass: N8AOPass | null = null
  private aoCompositeScene: THREE.Scene
  private aoCompositeUniforms: any
  constructor(options: { alpha: boolean; ssao: boolean }) {
    const { alpha, ssao } = options
    this.alpha = alpha
    this.renderer = new THREE.WebGLRenderer({ alpha })
    this.renderer.localClippingEnabled = true

    this.modelTarget = new THREE.WebGLRenderTarget(0, 0) // adjust size later
    this.modelTarget.depthBuffer = true
    this.modelTarget.depthTexture = new THREE.DepthTexture(0, 0) // size will be set by the first render
    this.modelTarget.depthTexture.type = THREE.UnsignedIntType

    this.screenshotTarget = new THREE.WebGLRenderTarget(0, 0) // adjust size later
    this.screenshotTarget.depthBuffer = false
    this.screenshotTarget.stencilBuffer = false

    this.rttTarget = new THREE.WebGLRenderTarget(0, 0) // adjust size later

    // Keep these for backwards compatibility, but they're not used with N8AO
    this.ssaoTarget = new THREE.WebGLRenderTarget(0, 0) // adjust size later
    this.ssaoTarget.depthBuffer = false
    this.ssaoTarget.stencilBuffer = false

    this.ssaoFinalTarget = new THREE.WebGLRenderTarget(0, 0) // adjust size later
    this.ssaoFinalTarget.depthBuffer = false
    this.ssaoFinalTarget.stencilBuffer = false
    this.renderSsao = ssao

    this.GUIScene = new THREE.Scene()

    const { scene: rttScene, uniforms: rttUniforms } = this.createRTTScene()
    this.rttScene = rttScene
    this.rttUniforms = rttUniforms

    const { scene: antiAliasScene, uniforms: antiAliasUniforms } =
      this.createAntialiasScene()
    this.antiAliasScene = antiAliasScene
    this.antiAliasUniforms = antiAliasUniforms

    // Initialize N8AO if SSAO is enabled
    if (ssao) {
      // Create a temporary scene and camera for N8AO initialization
      // N8AO will be properly sized in setSize()
      const tempScene = new THREE.Scene()
      const tempCamera = new THREE.PerspectiveCamera()
      this.n8aoPass = new N8AOPass(tempScene, tempCamera, 1, 1)
      
      // Configure N8AO to use our existing render target
      this.n8aoPass.beautyRenderTarget = this.modelTarget
      this.n8aoPass.configuration.autoRenderBeauty = false
      
      // Set quality preset (Medium is a good balance)
      this.n8aoPass.setQualityMode('Medium')
      
      // Configure AO parameters for molecular visualization
      // Adjust these based on your scene scale
      this.n8aoPass.configuration.aoRadius = 5.0
      this.n8aoPass.configuration.distanceFalloff = 1.0
      this.n8aoPass.configuration.intensity = 5.0
    }

    // Create composite scene for combining AO with scene
    const { scene: aoCompositeScene, uniforms: aoCompositeUniforms } =
      this.createAOCompositeScene()
    this.aoCompositeScene = aoCompositeScene
    this.aoCompositeUniforms = aoCompositeUniforms

    this.onBeforeModelRender = () => {}
    this.onBeforeSelectRender = () => {}
    this.onAfterRender = () => {}
  }

  dispose() {
    this.renderer.dispose()
    this.modelTarget.depthTexture?.dispose()
    this.modelTarget.dispose()
    this.screenshotTarget.dispose()
    this.rttTarget.dispose()
    this.ssaoTarget.dispose()
    this.ssaoFinalTarget.dispose()
    this.n8aoPass?.dispose()
  }

  addGUIComponent(object: THREE.Object3D) {
    this.GUIScene.add(object)
  }

  createRTTScene(): SceneInfo {
    const uniforms = {
      tBase: { value: this.modelTarget.texture },
      texelSize: { value: new THREE.Vector2() }
    }
    const { scene, material } = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: rttVertex,
      fragmentShader: rttFragment
    })
    return { scene, uniforms }
  }

  createAntialiasScene(): SceneInfo {
    const uniforms = {
      tDiffuse: { value: this.ssaoFinalTarget.texture },
      resolution: { value: new THREE.Vector2() }
    }
    const { scene, material } = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: antialiasVertex,
      fragmentShader: antialiasFragment
    })
    return { scene, uniforms }
  }

  createAOCompositeScene(): SceneInfo {
    // Shader to composite N8AO output with the scene
    const compositeFragment = `
      uniform sampler2D tScene;
      uniform sampler2D tAO;
      varying vec2 vUv;

      void main() {
        vec4 sceneColor = texture2D(tScene, vUv);
        vec4 aoColor = texture2D(tAO, vUv);
        // N8AO outputs the final composited result, so we can use it directly
        // But if we need to composite manually, we'd do: sceneColor.rgb * aoColor.rgb
        gl_FragColor = aoColor;
      }
    `

    const uniforms = {
      tScene: { value: this.modelTarget.texture },
      tAO: { value: null as THREE.Texture | null }
    }

    const { scene, material } = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: passThroughVertex,
      fragmentShader: compositeFragment
    })
    return { scene, uniforms }
  }

  setSize(width: number, height: number) {
    // width = Math.floor(width)
    // height = Math.floor(height)
    this.renderer.setSize(width, height, false)

    this.modelTarget.setSize(width, height)
    this.screenshotTarget.setSize(width, height)
    this.rttTarget.setSize(width, height)
    this.rttUniforms.texelSize.value.set(1.75 / width, 1.75 / height)
    this.antiAliasUniforms.resolution.value.set(width, height)

    // Update N8AO size if it exists
    if (this.n8aoPass) {
      this.n8aoPass.setSize(width, height)
    }
  }

  getSize(): { width: number; height: number } {
    return this.renderer.getSize(new THREE.Vector2())
  }

  async getScreenshot(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    width = this.getSize().width,
    height = this.getSize().height
  ) {
    const { width: oldWidth, height: oldHeight } = this.getSize()
    this.setSize(width, height)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')! // 2d is always a valid context, so we can assert non-null
    const imageData = ctx.createImageData(width, 1)

    const pixelBuffer = new Uint8Array(width * 4)

    this.render(scene, camera, this.screenshotTarget)
    for (let y = 0; y < height; y++) {
      this.renderer.readRenderTargetPixels(
        this.screenshotTarget,
        0,
        y,
        width,
        1,
        pixelBuffer
      )

      if (!this.alpha) {
        // we need to fill in the background color to the screenshot
        for (let x = 0; x < width; x++) {
          let idx = x * 4 + 3 // idx to 'a'-value of the color
          // check for transparency
          if (pixelBuffer[idx] === 0) {
            pixelBuffer[idx--] = 255 // a
            pixelBuffer[idx--] = 0 // b
            pixelBuffer[idx--] = 0 // g
            pixelBuffer[idx--] = 0 // r
          }
        }
      }
      imageData.data.set(pixelBuffer)
      ctx.putImageData(imageData, 0, height - 1 - y)
    }
    this.setSize(oldWidth, oldHeight)

    const blob = await getBlob(canvas)
    canvas.remove()

    return URL.createObjectURL(blob)
  }

  render(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    target?: THREE.WebGLRenderTarget
  ) {
    this.onBeforeModelRender()
    
    // Render scene to modelTarget (which has depth buffer)
    this.renderer.setRenderTarget(this.modelTarget)
    this.renderer.render(scene, camera)
    this.onBeforeSelectRender()

    if (this.renderSsao && this.n8aoPass) {
      // N8AO reads from modelTarget and outputs AO-composited result
      // Update camera for N8AO
      this.n8aoPass.camera = camera
      
      // Render N8AO pass directly to the target (or screen if target is null)
      // N8AO will read from beautyRenderTarget (modelTarget) when autoRenderBeauty=false
      // The render signature is: render(renderer, inputBuffer, outputBuffer, deltaTime, stencilBuffer)
      // Pass target as outputBuffer so N8AO renders directly to it
      // If target is null, N8AO will render to screen
      this.n8aoPass.render(this.renderer, null, target || null, 0, null)
    } else {
      // No SSAO - just render RTT scene
      this.renderer.setRenderTarget(target || null)
      this.renderer.render(this.rttScene, quadCamera)
    }

    // antialias
    // this.renderer.setRenderTarget(target ? target : null);
    // this.renderer.render(this.antiAliasScene, quadCamera);

    // gui
    this.renderer.autoClear = false
    this.renderer.render(this.GUIScene, camera)
    this.renderer.autoClear = true

    this.onAfterRender()
  }

  getRawRenderer() {
    return this.renderer
  }
}

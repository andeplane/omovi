import * as THREE from 'three'
import ComboControls from '@cognite/three-combo-controls'

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

export default class Visualizer {
  private renderer: THREE.WebGLRenderer
  private canvas: HTMLCanvasElement
  public scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private ambientLight: THREE.AmbientLight
  private directionalLight: THREE.DirectionalLight
  private controls: ComboControls
  private clock: THREE.Clock
  private domElement: HTMLElement
  // @ts-ignore
  private latestRequestId?: number

  constructor(domElement: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer()

    this.canvas = this.renderer.domElement
    this.domElement = domElement
    this.domElement.appendChild(this.canvas)
    this.setupCanvas(this.canvas)

    this.scene = new THREE.Scene()

    this.ambientLight = new THREE.AmbientLight(0xffffff)
    this.directionalLight = new THREE.DirectionalLight(0xffffff)
    this.setupLights(this.ambientLight, this.directionalLight, this.scene)

    this.camera = new THREE.PerspectiveCamera(60, 640 / 480, 0.1, 10000)
    this.setupCamera(this.camera)
    this.controls = new ComboControls(this.camera, this.canvas)

    this.latestRequestId = undefined
    this.clock = new THREE.Clock()
    this.animate()
  }

  setupLights = (
    ambientLight: THREE.AmbientLight,
    directionalLight: THREE.DirectionalLight,
    scene: THREE.Scene
  ) => {
    ambientLight.intensity = 0.7
    directionalLight.intensity = 0.7
    scene.add(directionalLight)
    scene.add(ambientLight)
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

  animate = () => {
    this.resizeIfNeeded()
    this.controls.update(this.clock.getDelta())
    this.renderer.render(this.scene, this.camera)
    this.latestRequestId = requestAnimationFrame(this.animate.bind(this))
  }

  resizeIfNeeded = () => {
    // The maxTextureSize is chosen from testing on low-powered hardware,
    // and could be increased in the future.
    // TODO Increase maxTextureSize if SSAO performance is improved
    const maxTextureSize = 1.4e6

    const rendererSize = this.renderer.getSize(new THREE.Vector2())
    const rendererPixelWidth = rendererSize.width
    const rendererPixelHeight = rendererSize.height

    // client width and height are in virtual pixels and not yet scaled by dpr
    // TODO VERSION 5.0.0 remove the test for dom element size once we have removed the getCanvas function
    const clientWidth =
      this.domElement.clientWidth !== 0
        ? this.domElement.clientWidth
        : this.canvas.clientWidth
    const clientHeight =
      this.domElement.clientHeight !== 0
        ? this.domElement.clientHeight
        : this.canvas.clientHeight
    const clientPixelWidth = window.devicePixelRatio * clientWidth
    const clientPixelHeight = window.devicePixelRatio * clientHeight
    const clientTextureSize = clientPixelWidth * clientPixelHeight

    const scale =
      clientTextureSize > maxTextureSize
        ? Math.sqrt(maxTextureSize / clientTextureSize)
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

    return true
  }
}

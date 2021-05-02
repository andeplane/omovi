import * as THREE from 'three'
import ComboControls from '@cognite/three-combo-controls'
import { Material } from './materials'

// @ts-ignore
import Stats from 'stats.js'

const inverseModelMatrix = new THREE.Matrix4()
const modelViewMatrix = new THREE.Matrix4()
const normalMatrix = new THREE.Matrix3()
const inverseNormalMatrix = new THREE.Matrix3()

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

interface VisualizerProps {
  domElement: HTMLElement
  onCameraChanged?: (position: THREE.Vector3, target: THREE.Vector3) => void
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
  private object: THREE.Object3D
  private stats: Stats
  private cpuStats: Stats
  private memoryStats: Stats
  private materials: { [key: string]: Material }

  // @ts-ignore
  private latestRequestId?: number

  constructor({ domElement, onCameraChanged }: VisualizerProps) {
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
    this.controls.addEventListener('cameraChange', (event: THREE.Event) => {
      const { position, target } = event.camera
      if (onCameraChanged) {
        onCameraChanged(position, target)
      }
    })

    this.latestRequestId = undefined
    this.clock = new THREE.Clock()
    this.object = new THREE.Object3D()
    this.scene.add(this.object)

    this.cpuStats = new Stats()
    this.memoryStats = new Stats()
    this.cpuStats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    this.memoryStats.showPanel(2) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.cpuStats.dom)
    this.cpuStats.domElement.style.cssText =
      'position:absolute;top:0px;right:80px;'
    this.memoryStats.domElement.style.cssText =
      'position:absolute;top:0px;right:0px;'
    document.body.appendChild(this.memoryStats.dom)

    this.materials = {}
    this.animate()
  }

  add = (object: THREE.Mesh) => {
    if (object == null) {
      return
    }

    if (object.material instanceof Material) {
      const material = object.material as Material
      const materialType = material.type
      if (this.materials[materialType] == null) {
        this.materials[materialType] = material
      }
    }

    this.object.add(object)
  }

  remove = (object: THREE.Mesh) => {
    this.object.remove(object)
  }

  setupLights = (
    ambientLight: THREE.AmbientLight,
    directionalLight: THREE.DirectionalLight,
    scene: THREE.Scene
  ) => {
    ambientLight.intensity = 0.3
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

  updateUniforms = (camera: THREE.PerspectiveCamera) => {
    this.object.matrixWorld.copy(this.object.matrixWorld).invert()
    modelViewMatrix
      .copy(camera.matrixWorldInverse)
      .multiply(this.object.matrixWorld)
    normalMatrix.getNormalMatrix(modelViewMatrix)
    inverseNormalMatrix.copy(normalMatrix).invert()

    Object.values(this.materials).forEach((material) => {
      if (material.uniforms.inverseModelMatrix != null) {
        material.uniforms.inverseModelMatrix.value.copy(inverseModelMatrix)
      }
      if (material.uniforms.inverseNormalMatrix != null) {
        material.uniforms.inverseNormalMatrix.value.copy(inverseNormalMatrix)
      }
    })
  }

  dispose = () => {
    this.domElement.removeChild(this.canvas)
    this.renderer.dispose()
  }

  getCameraPosition = () => {
    return this.controls.getState().position
  }

  getCameraTarget = () => {
    return this.controls.getState().target
  }

  setCameraPosition = (position: THREE.Vector3) => {
    this.controls.setState(position, this.getCameraTarget())
  }

  setCameraTarget = (target: THREE.Vector3) => {
    this.controls.setState(this.getCameraPosition(), target)
  }

  animate = () => {
    this.memoryStats.update()
    this.cpuStats.begin()
    this.resizeIfNeeded()
    this.controls.update(this.clock.getDelta())

    this.updateUniforms(this.camera)
    this.renderer.render(this.scene, this.camera)
    this.cpuStats.end()

    this.latestRequestId = requestAnimationFrame(this.animate.bind(this))
    // console.log(this.camera.position.clone())
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

import * as THREE from 'three'
import ComboControls from '../controls'
import { Material } from './materials'
import DataTexture from './datatexture'
import createMaterial from 'core/materials'
import particleFragmentShader from 'core/geometries/particles/shaders/fragment'
import particleVertexShader from 'core/geometries/particles/shaders/vertex'
import bondFragmentShader from 'core/geometries/bonds/shaders/fragment'
import bondVertexShader from 'core/geometries/bonds/shaders/vertex'
import Particles from 'core/geometries/particles/particles'
import Bonds from 'core/geometries/bonds/bonds'
import { Color } from 'core/types'

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
  initialColors?: Color[]
}

export default class Visualizer {
  private renderer: THREE.WebGLRenderer
  private canvas: HTMLCanvasElement
  public scene: THREE.Scene
  public forceRender: boolean
  private cachedMeshes: {[key: string]: THREE.Mesh}
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
  private colorTexture: DataTexture
  private materials: { [key: string]: Material }

  // @ts-ignore
  private latestRequestId?: number

  constructor({ domElement, initialColors, onCameraChanged }: VisualizerProps) {
    this.renderer = new THREE.WebGLRenderer()

    this.canvas = this.renderer.domElement
    this.domElement = domElement
    this.domElement.appendChild(this.canvas)
    this.setupCanvas(this.canvas)

    this.scene = new THREE.Scene()
    this.forceRender = false
    this.cachedMeshes = {}

    this.ambientLight = new THREE.AmbientLight(0xffffff)
    this.directionalLight = new THREE.DirectionalLight(0xffffff)
    this.setupLights(this.ambientLight, this.directionalLight, this.scene)

    this.colorTexture = new DataTexture('colorTexture', 4096*4096, () => {
      this.forceRender = true
    })
    initialColors?.forEach((color, index) => {
      this.colorTexture.setRGBA(index, color.r, color.g, color.b);
    })
    
    //@ts-ignore
    window.colorTexture = this.colorTexture

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
    this.materials['particles'] = createMaterial('particle', particleVertexShader, particleFragmentShader, this.colorTexture)
    this.materials['bonds'] = createMaterial('bonds', bondVertexShader, bondFragmentShader, this.colorTexture)

    this.animate()
  }

  add = (object: Particles | Bonds) => {
    if (this.cachedMeshes[object.id]) {
      this.object.add(this.cachedMeshes[object.id])
      return
    }

    let material: THREE.Material
    if (object instanceof Particles) {
      material = this.materials['particles']
    } else {
      material = this.materials['bonds']
    }

    const geometry = object.getGeometry()
    const mesh = new THREE.InstancedMesh(geometry, material, object.count)
    
    object.mesh = mesh
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < object.count; i++) {
      mesh.setMatrixAt(i, matrix)
    }
    mesh.frustumCulled = false

    this.cachedMeshes[object.id] = mesh

    this.object.add(mesh)
  }

  remove = (object: Particles | Bonds) => {
    if (this.cachedMeshes[object.id]) {
      this.object.remove(this.cachedMeshes[object.id])
      return
    }
    throw new Error("Tried to remove object that never was added to the scene.")
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
    Object.values(this.materials).forEach(material => {
      material.dispose()
    })
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

  setColor = (index: number, color: Color) => {
    this.colorTexture.setRGBA(index, color.r, color.g, color.b);
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
    this.forceRender = false
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

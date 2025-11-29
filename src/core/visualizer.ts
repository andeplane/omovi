import * as THREE from 'three'
import { ComboControls, CameraUpdateEvent } from '../controls'
import { Material } from './materials'
import DataTexture from './datatexture'
import createMaterial from './materials'
import particleFragmentShader from './geometries/particles/shaders/fragment'
import particleVertexShader from './geometries/particles/shaders/vertex'
import bondFragmentShader from './geometries/bonds/shaders/fragment'
import bondVertexShader from './geometries/bonds/shaders/vertex'
import Particles from './geometries/particles/particles'
import Bonds from './geometries/bonds/bonds'
import { Color } from './types'
import OMOVIRenderer from './renderer'
import { VRButton } from '../utils/VRButton'
import { PickingHandler, PickResult } from './picking'
import { outlineVertexShader, outlineFragmentShader } from './post-processing/outlineShader'

// @ts-ignore
import Stats from 'stats.js'

const inverseModelMatrix = new THREE.Matrix4()
const modelViewMatrix = new THREE.Matrix4()
const normalMatrix = new THREE.Matrix3()
const inverseNormalMatrix = new THREE.Matrix3()

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()

const makePerpendicular = (v: THREE.Vector3, t: THREE.Vector3) => {
  if (v.x == 0.0 && v.y == 0.0) {
    if (v.z == 0.0) {
      return t.set(0.0, 0.0, 0.0)
    }
    return t.set(0.0, 1.0, 0.0)
  }
  return t.set(-v.y, v.x, 0.0).normalize()
}

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

export interface ParticleClickEvent {
  particleIndex: number
  position: THREE.Vector3
  shiftKey: boolean
}

interface VisualizerProps {
  domElement?: HTMLElement
  onCameraChanged?: (position: THREE.Vector3, target: THREE.Vector3) => void
  onParticleClick?: (event: ParticleClickEvent) => void
  initialColors?: Color[]
}

export default class Visualizer {
  private canvas: HTMLCanvasElement
  public scene: THREE.Scene
  public forceRender: boolean
  public renderer: OMOVIRenderer
  public ambientLight: THREE.AmbientLight
  public idle: boolean
  public pointLight: THREE.PointLight
  public materials: { [key: string]: Material }
  private cachedMeshes: { [key: string]: THREE.Mesh }
  private setRadiusCalled: boolean
  private camera: THREE.PerspectiveCamera
  private controls: ComboControls
  private clock: THREE.Clock
  private domElement?: HTMLElement
  private object: THREE.Object3D
  private cpuStats: Stats
  private memoryStats: Stats
  private colorTexture: DataTexture
  private radiusTexture: DataTexture
  private selectionTexture: DataTexture
  private pickingHandler: PickingHandler
  private onParticleClick?: (event: ParticleClickEvent) => void
  private currentParticles?: Particles
  private mouseDownPosition?: { x: number; y: number }
  private mouseDownShiftKey: boolean = false
  private readonly clickDistanceThreshold = 5 // pixels
  public debugPickingRender: boolean = false // Set to true to see picking visualization
  private selectionColor: THREE.Color
  private outlineRenderTarget?: THREE.WebGLRenderTarget
  private outlineMaterial?: THREE.ShaderMaterial
  private outlineScene?: THREE.Scene
  private outlineCamera?: THREE.OrthographicCamera
  private outlineQuad?: THREE.Mesh

  // @ts-ignore
  private latestRequestId?: number

  constructor({
    domElement,
    initialColors,
    onCameraChanged,
    onParticleClick
  }: VisualizerProps = {}) {
    this.renderer = new OMOVIRenderer({
      alpha: false,
      ssao: true
    })
    this.idle = false
    this.setRadiusCalled = false
    this.onParticleClick = onParticleClick
    this.canvas = this.renderer.getRawRenderer().domElement
    if (domElement) {
      this.domElement = domElement
      this.domElement.appendChild(this.canvas)
    }
    this.setupCanvas(this.canvas)

    this.scene = new THREE.Scene()
    this.forceRender = false
    this.cachedMeshes = {}

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.pointLight = new THREE.PointLight(0xffffff, 0.5, 150, 1)
    this.scene.add(this.ambientLight)
    this.scene.add(this.pointLight)

    const maxParticleIndex = 4096 * 4096
    this.colorTexture = new DataTexture(
      'colorTexture',
      maxParticleIndex,
      'rgba',
      () => {
        this.forceRender = true
      }
    )
    this.radiusTexture = new DataTexture(
      'radiusTexture',
      maxParticleIndex,
      'float',
      () => {
        this.forceRender = true
      }
    )
    this.selectionTexture = new DataTexture(
      'selectionTexture',
      maxParticleIndex,
      'rgba',
      () => {
        this.forceRender = true
      }
    )
    // Initialize selection texture to all unselected (black)
    for (let i = 0; i < maxParticleIndex; i++) {
      this.selectionTexture.setRGBA(i, 0, 0, 0, 255)
    }

    initialColors?.forEach((color, index) => {
      this.colorTexture.setRGBA(index, color.r, color.g, color.b)
    })

    this.camera = new THREE.PerspectiveCamera(60, 640 / 480, 0.1, 10000)
    this.setupCamera(this.camera)
    this.controls = new ComboControls(this.camera, this.canvas)
    this.controls.addEventListener('cameraChange', (event: any) => {
      const { position, target } = event.camera

      this.pointLight.position.set(position.x, position.y, position.z)

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
    // document.body.appendChild(this.cpuStats.dom)
    // this.cpuStats.domElement.style.cssText =
    //   'position:absolute;top:0px;right:80px;'
    // this.memoryStats.domElement.style.cssText =
    //   'position:absolute;top:0px;right:0px;'
    // document.body.appendChild(this.memoryStats.dom)

    this.materials = {}
    // Default to Reveal's light blue: RGB(0.392, 0.392, 1.0)
    this.selectionColor = new THREE.Color(0.392, 0.392, 1.0)
    this.materials['particles'] = createMaterial(
      'particle',
      particleVertexShader,
      particleFragmentShader,
      this.colorTexture,
      this.radiusTexture,
      this.selectionTexture,
      this.selectionColor
    )
    this.materials['bonds'] = createMaterial(
      'bonds',
      bondVertexShader,
      bondFragmentShader,
      this.colorTexture,
      this.radiusTexture
    )

    // Initialize picking handler
    this.pickingHandler = new PickingHandler(
      this.renderer.getRawRenderer(),
      this.radiusTexture
    )

    // Add click listeners for particle picking
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    
    // Initialize outline post-processing
    this.initializeOutlinePostProcessing()

    this.animate()
    //@ts-ignore
    window.visualizer = this
    //@ts-ignore
    window.THREE = THREE

    // this.renderer.getRawRenderer().xr.enabled = true
    // document.body.appendChild(
    //   VRButton.createButton(this.renderer.getRawRenderer())
    // )
    this.renderer.getRawRenderer().setAnimationLoop(this.animate)
  }

  add = (object: Particles | Bonds) => {
    if (this.cachedMeshes[object.id]) {
      this.object.add(this.cachedMeshes[object.id])
      if (object instanceof Particles) {
        this.currentParticles = object
      }
      return
    }

    let material: THREE.Material
    if (object instanceof Particles) {
      material = this.materials['particles']
      this.currentParticles = object
    } else {
      material = this.materials['bonds']
    }

    const geometry = object.getGeometry()
    const mesh = new THREE.InstancedMesh(geometry, material, object.capacity)
    mesh.count = object.count

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
    throw new Error('Tried to remove object that never was added to the scene.')
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

  private handleMouseDown = (event: MouseEvent) => {
    this.mouseDownPosition = { x: event.clientX, y: event.clientY }
    this.mouseDownShiftKey = event.shiftKey
  }

  private handleMouseUp = (event: MouseEvent) => {
    if (!this.mouseDownPosition) {
      return
    }

    // Check if mouse moved significantly (drag vs click)
    const dx = event.clientX - this.mouseDownPosition.x
    const dy = event.clientY - this.mouseDownPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // If it's a drag, don't pick
    if (distance > this.clickDistanceThreshold) {
      this.mouseDownPosition = undefined
      return
    }

    this.mouseDownPosition = undefined

    if (!this.onParticleClick || !this.currentParticles) {
      return
    }

    // Get particle meshes from cached meshes
    const particleMeshes: THREE.InstancedMesh[] = []
    for (const mesh of Object.values(this.cachedMeshes)) {
      if (mesh instanceof THREE.InstancedMesh && mesh.material === this.materials['particles']) {
        particleMeshes.push(mesh)
      }
    }

    if (particleMeshes.length === 0) {
      return
    }

    // Get click coordinates relative to the canvas
    const rect = this.canvas.getBoundingClientRect()
    
    // Get renderer size (in actual pixels)
    const rendererSize = this.renderer.getSize()
    const rendererWidth = rendererSize.width
    const rendererHeight = rendererSize.height
    
    // Convert from client coordinates to renderer coordinates
    const clientX = event.clientX - rect.left
    const clientY = event.clientY - rect.top
    
    // Scale from client size to renderer size
    const x = (clientX / rect.width) * rendererWidth
    const y = (clientY / rect.height) * rendererHeight

    // Perform picking
    const result = this.pickingHandler.pick(
      x,
      y,
      this.camera,
      this.scene,
      particleMeshes,
      false // Always do actual picking, debug mode just affects rendering
    )

    if (result) {
      // result.particleIndex is actually the atom ID (from particles.indices array)
      // We need to find which array index has this ID
      const atomId = result.particleIndex
      let arrayIndex = -1
      
      for (let i = 0; i < this.currentParticles.count; i++) {
        if (this.currentParticles.indices[i] === atomId) {
          arrayIndex = i
          break
        }
      }
      
      if (arrayIndex === -1) {
        return
      }
      
      // Look up the actual position from the particles data using array index
      const position = this.currentParticles.getPosition(arrayIndex)
      
      this.onParticleClick({
        particleIndex: atomId,  // Return the actual atom ID
        position,
        shiftKey: this.mouseDownShiftKey
      })
    }
  }

  dispose = () => {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.pickingHandler.dispose()
    if (this.domElement) {
      this.domElement.removeChild(this.canvas)
    }
    Object.values(this.materials).forEach((material) => {
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
    this.colorTexture.setRGBA(index, color.r, color.g, color.b)
  }

  setRadius = (index: number, radius: number) => {
    this.setRadiusCalled = true
    this.radiusTexture.setFloat(index, radius)
  }

  /**
   * Set the selection state of a particle by atom ID
   * @param atomId The LAMMPS atom ID
   * @param selected Whether the particle should be selected
   */
  setSelected = (atomId: number, selected: boolean) => {
    // atomId is the actual LAMMPS atom ID, which is what's stored in the shader
    // The shader reads from particles.indices which contains atom IDs
    // So we can directly set the selection using the atomId
    this.selectionTexture.setRGBA(atomId, selected ? 255 : 0, 0, 0, 255)
  }

  /**
   * Clear all selections
   */
  clearSelection = () => {
    const maxIndex = this.selectionTexture.maxParticleIndex
    for (let i = 0; i < maxIndex; i++) {
      this.selectionTexture.setRGBA(i, 0, 0, 0, 255)
    }
  }

  private initializeOutlinePostProcessing = () => {
    const size = this.renderer.getRawRenderer().getSize(new THREE.Vector2())
    
    // Create render target for intermediate rendering
    this.outlineRenderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    })
    
    // Create outline material
    this.outlineMaterial = new THREE.ShaderMaterial({
      vertexShader: outlineVertexShader,
      fragmentShader: outlineFragmentShader,
      uniforms: {
        tDiffuse: { value: this.outlineRenderTarget.texture },
        resolution: { value: new THREE.Vector2(size.x, size.y) },
        outlineOffset: { value: 1.5 } // 1-2 pixel offset for thin outline
      }
    })
    
    // Create fullscreen quad for post-processing
    this.outlineScene = new THREE.Scene()
    this.outlineCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    this.outlineQuad = new THREE.Mesh(geometry, this.outlineMaterial)
    this.outlineScene.add(this.outlineQuad)
  }

  private hasSelection = (): boolean => {
    // Check if any atoms are selected
    if (!this.selectionTexture || !this.currentParticles) return false
    
    for (let i = 0; i < this.currentParticles.count; i++) {
      const atomId = this.currentParticles.indices[i]
      if (this.selectionTexture.getInteger(atomId) > 0) {
        return true
      }
    }
    return false
  }

  animate = () => {
    if (!this.idle) {
      this.memoryStats.update()
      this.cpuStats.begin()
      this.resizeIfNeeded()
      this.controls.update(this.clock.getDelta())

      this.updateUniforms(this.camera)
      
      // If debug picking is enabled, render with picking material instead
      if (this.debugPickingRender) {
        const particleMeshes: THREE.InstancedMesh[] = []
        for (const mesh of Object.values(this.cachedMeshes)) {
          if (mesh instanceof THREE.InstancedMesh && mesh.material === this.materials['particles']) {
            particleMeshes.push(mesh)
          }
        }
        // Trigger a debug render (this will render to screen)
        if (particleMeshes.length > 0) {
          this.pickingHandler.pick(0, 0, this.camera, this.scene, particleMeshes, true)
        }
      } else {
        // Check if we need outline post-processing
        const needsOutline = this.hasSelection()
        
        // Always render with SSAO first
        this.renderer.render(this.scene, this.camera)
        
        // If selection active, do outline pass on top
        if (needsOutline && this.outlineRenderTarget && this.outlineMaterial && this.outlineScene && this.outlineCamera) {
          const rawRenderer = this.renderer.getRawRenderer()
          
          // Render selection mask to intermediate target (raw renderer, no SSAO needed)
          rawRenderer.setRenderTarget(this.outlineRenderTarget)
          rawRenderer.clear()
          rawRenderer.render(this.scene, this.camera)
          
          // Apply outline-only pass on top
          rawRenderer.setRenderTarget(null)
          
          // Configure material for blending on top
          this.outlineMaterial.transparent = true
          this.outlineMaterial.depthTest = false
          this.outlineMaterial.depthWrite = false
          
          // Disable auto-clear so we don't erase the SSAO render
          const autoClear = rawRenderer.autoClear
          rawRenderer.autoClear = false
          
          rawRenderer.render(this.outlineScene, this.outlineCamera)
          
          // Restore auto-clear
          rawRenderer.autoClear = autoClear
        }
      }
      
      this.cpuStats.end()

      this.forceRender = false
    }
    // this.latestRequestId = requestAnimationFrame(this.animate.bind(this))
  }

  resizeIfNeeded = () => {
    // The maxTextureSize is chosen from testing on low-powered hardware,
    // and could be increased in the future.
    // TODO Increase maxTextureSize if SSAO performance is improved
    const maxTextureSize = 1.4e6

    const rendererSize = this.renderer.getSize()
    const rendererPixelWidth = rendererSize.width
    const rendererPixelHeight = rendererSize.height

    let clientWidth: number
    let clientHeight: number
    // client width and height are in virtual pixels and not yet scaled by dpr
    if (this.domElement) {
      clientWidth =
        this.domElement.clientWidth !== 0
          ? this.domElement.clientWidth
          : this.canvas.clientWidth
      clientHeight =
        this.domElement.clientHeight !== 0
          ? this.domElement.clientHeight
          : this.canvas.clientHeight
    } else {
      clientWidth = this.canvas.clientWidth
      clientHeight = this.canvas.clientHeight
    }
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
    
    // Resize outline render target if it exists
    if (this.outlineRenderTarget && this.outlineMaterial) {
      this.outlineRenderTarget.setSize(width, height)
      this.outlineMaterial.uniforms.resolution.value.set(width, height)
    }

    return true
  }
  
  public setSelectionColor = (color: THREE.Color) => {
    this.selectionColor.copy(color)
    // Update the material uniform
    const particleMaterial = this.materials['particles']
    if (particleMaterial && particleMaterial.uniforms && particleMaterial.uniforms.selectionColor) {
      particleMaterial.uniforms.selectionColor.value.copy(color)
    }
    this.forceRender = true
  }
}

import * as THREE from 'three'

import {rttFragment, rttVertex} from './shaders/rtt'
import {antialiasFragment, antialiasVertex} from './shaders/antialias'
import {passThroughVertex} from './shaders/passThrough'

import {ssao, ssaoFinal} from './shaders/ssao'

interface SceneInfo {
  scene: THREE.Scene;
  uniforms: any;
}

function setupRenderingPass(options: { uniforms: any; defines: any, vertexShader: string; fragmentShader: string }): {scene: THREE.Scene, material: THREE.Material} {
  const scene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    uniforms: options.uniforms,
    defines: options.defines,
    vertexShader: options.vertexShader,
    fragmentShader: options.fragmentShader,
    depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  return {scene, material};
}

function getBlob(canvas: HTMLCanvasElement): Promise<any> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob != null ? blob : undefined));
  });
}

const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

export default class OMOVIRenderer {
  onBeforeModelRender: () => void;
  onBeforeSelectRender: () => void;
  onAfterRender: () => void;
  private alpha: boolean;
  private renderer: THREE.WebGLRenderer;
  private modelTarget: THREE.WebGLRenderTarget;
  private screenshotTarget: THREE.WebGLRenderTarget;
  private rttTarget: THREE.WebGLRenderTarget;
  private ssaoTarget: THREE.WebGLRenderTarget;
  private ssaoFinalTarget: THREE.WebGLRenderTarget;
  private GUIScene: THREE.Scene;
  private rttScene: THREE.Scene;
  private rttUniforms: any;
  private antiAliasScene: THREE.Scene;
  private antiAliasUniforms: any;
  private renderSsao: boolean
  private ssaoScene: THREE.Scene;
  private ssaoUniforms: any;
  private ssaoFinalScene: THREE.Scene;
  private ssaoFinalUniforms: any;

  constructor(options: { alpha: boolean; ssao: boolean }) {
    const { alpha, ssao } = options;
    this.alpha = alpha;
    this.renderer = new THREE.WebGLRenderer({ alpha });
    this.renderer.localClippingEnabled = true;

    this.modelTarget = new THREE.WebGLRenderTarget(0, 0); // adjust size later
    this.modelTarget.depthBuffer = true;
    this.modelTarget.depthTexture = new THREE.DepthTexture(0, 0); // size will be set by the first render
    this.modelTarget.depthTexture.type = THREE.UnsignedIntType;

    this.screenshotTarget = new THREE.WebGLRenderTarget(0, 0); // adjust size later
    this.screenshotTarget.depthBuffer = false;
    this.screenshotTarget.stencilBuffer = false;

    this.rttTarget = new THREE.WebGLRenderTarget(0, 0); // adjust size later

    this.ssaoTarget = new THREE.WebGLRenderTarget(0, 0); // adjust size later
    this.ssaoTarget.depthBuffer = false;
    this.ssaoTarget.stencilBuffer = false;

    this.ssaoFinalTarget = new THREE.WebGLRenderTarget(0, 0); // adjust size later
    this.ssaoFinalTarget.depthBuffer = false;
    this.ssaoFinalTarget.stencilBuffer = false;
    this.renderSsao = ssao

    this.GUIScene = new THREE.Scene();

    const { scene: rttScene, uniforms: rttUniforms } = this.createRTTScene();
    this.rttScene = rttScene;
    this.rttUniforms = rttUniforms;

    const { scene: antiAliasScene, uniforms: antiAliasUniforms } = this.createAntialiasScene();
    this.antiAliasScene = antiAliasScene;
    this.antiAliasUniforms = antiAliasUniforms;

    const { scene: ssaoScene, uniforms: ssaoUniforms } = this.createSSAOScene();
    this.ssaoScene = ssaoScene;
    this.ssaoUniforms = ssaoUniforms;

    const { scene: ssaoFinalScene, uniforms: ssaoFinalUniforms } = this.createSSAOFinalScene();
    this.ssaoFinalScene = ssaoFinalScene;
    this.ssaoFinalUniforms = ssaoFinalUniforms;

    this.onBeforeModelRender = () => {};
    this.onBeforeSelectRender = () => {};
    this.onAfterRender = () => {};
  }

  dispose() {
    this.renderer.dispose();
    this.modelTarget.depthTexture.dispose();
    this.modelTarget.dispose();
    this.screenshotTarget.dispose();
    this.rttTarget.dispose();
    this.ssaoTarget.dispose();
    this.ssaoFinalTarget.dispose();
  }

  addGUIComponent(object: THREE.Object3D) {
    this.GUIScene.add(object);
  }

  createRTTScene(): SceneInfo {
    const uniforms = {
      tBase: { value: this.modelTarget.texture },
      texelSize: { value: new THREE.Vector2() },
    };
    const {scene, material} = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: rttVertex,
      fragmentShader: rttFragment
    });
    return { scene, uniforms };
  }

  createAntialiasScene(): SceneInfo {
    const uniforms = {
      tDiffuse: { value: this.ssaoFinalTarget.texture },
      resolution: { value: new THREE.Vector2() }
    };
    const {scene, material} = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: antialiasVertex,
      fragmentShader: antialiasFragment
    });
    return { scene, uniforms };
  }

  createKernel(kernelSize: number): THREE.Vector3[] {
    const result: THREE.Vector3[] = [];
    for (let i = 0; i < kernelSize; i++) {
      const sample = new THREE.Vector3();
      while (sample.length() < 1.0) {
        // Ensure some distance in samples
        sample.x = Math.random() * 2 - 1;
        sample.y = Math.random() * 2 - 1;
        sample.z = Math.random();
      }
      sample.normalize();
      let scale = i / kernelSize;
      scale = lerp(0.1, 1, scale * scale);
      sample.multiplyScalar(scale);
      result.push(sample);
    }
    return result;

    function lerp(value1: number, value2: number, amount: number) {
      amount = amount < 0 ? 0 : amount;
      amount = amount > 1 ? 1 : amount;
      return value1 + (value2 - value1) * amount;
    }
  }

  createSSAOScene(): SceneInfo {
    const defines = {
      MAX_KERNEL_SIZE: 32
    }
    
    const uniforms = {
      tDepth: { value: this.modelTarget.depthTexture },
      tDiffuse: { value: this.rttTarget.texture },
      size: { value: new THREE.Vector2() },
      sampleRadius: {value: 5},
      bias: {value: 0.5},
      kernel: {value: this.createKernel(defines.MAX_KERNEL_SIZE) },
      projMatrix: { value: new THREE.Matrix4() },
      inverseProjectionMatrix: { value: new THREE.Matrix4() },
      time: {value: 0.0}
    };
    
    const {scene, material} = setupRenderingPass({
      uniforms,
      defines,
      vertexShader: passThroughVertex,
      fragmentShader: ssao
    });
    return { scene, uniforms };
  }

  createSSAOFinalScene(): SceneInfo {
    const uniforms = {
      tDiffuse: { value: this.rttTarget.texture },
      ssaoTexture: { value: this.ssaoTarget.texture },
      size: { value: new THREE.Vector2() }
    };
    
    const {scene, material} = setupRenderingPass({
      uniforms,
      defines: {},
      vertexShader: passThroughVertex,
      fragmentShader: ssaoFinal
    });
    
    return { scene, uniforms };
  }

  setSize(width: number, height: number) {
    // width = Math.floor(width)
    // height = Math.floor(height)
    console.log("Resize: ", width, height)
    this.renderer.setSize(width, height, false);

    this.modelTarget.setSize(width, height);
    this.screenshotTarget.setSize(width, height);
    this.rttTarget.setSize(width, height);
    this.rttUniforms.texelSize.value.set(1.75 / width, 1.75 / height);
    this.antiAliasUniforms.resolution.value.set(width, height);

    // const halfWidth = Math.floor(width * 0.5);
    // const halfHeight = Math.floor(height * 0.5);
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    // this.ssaoTarget.setSize(width, height);
    this.ssaoTarget.setSize(halfWidth, halfHeight);
    this.ssaoUniforms.size.value.set(halfWidth, halfHeight);

    this.ssaoFinalTarget.setSize(halfWidth, halfHeight);
    this.ssaoFinalUniforms.size.value.set(halfWidth, halfHeight);
  }

  getSize(): { width: number; height: number } {
    return this.renderer.getSize(new THREE.Vector2());
  }

  async getScreenshot(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    width = this.getSize().width,
    height = this.getSize().height
  ) {
    const { width: oldWidth, height: oldHeight } = this.getSize();
    this.setSize(width, height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!; // 2d is always a valid context, so we can assert non-null
    const imageData = ctx.createImageData(width, 1);

    const pixelBuffer = new Uint8Array(width * 4);

    this.render(scene, camera, this.screenshotTarget);
    for (let y = 0; y < height; y++) {
      this.renderer.readRenderTargetPixels(this.screenshotTarget, 0, y, width, 1, pixelBuffer);

      if (!this.alpha) {
        // we need to fill in the background color to the screenshot
        for (let x = 0; x < width; x++) {
          let idx = x * 4 + 3; // idx to 'a'-value of the color
          // check for transparency
          if (pixelBuffer[idx] === 0) {
            pixelBuffer[idx--] = 255; // a
            pixelBuffer[idx--] = 0; // b
            pixelBuffer[idx--] = 0; // g
            pixelBuffer[idx--] = 0; // r
          }
        }
      }
      imageData.data.set(pixelBuffer);
      ctx.putImageData(imageData, 0, height - 1 - y);
    }
    this.setSize(oldWidth, oldHeight);

    const blob = await getBlob(canvas);
    canvas.remove();

    return URL.createObjectURL(blob);
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, target?: THREE.RenderTarget) {
    this.ssaoUniforms.inverseProjectionMatrix.value = camera.projectionMatrixInverse;
    this.ssaoUniforms.projMatrix.value = camera.projectionMatrix;
    this.ssaoUniforms.time.value = Date.now()%1000
    
    this.onBeforeModelRender();
    this.renderer.setRenderTarget(this.modelTarget);
    this.renderer.render(scene, camera);
    this.onBeforeSelectRender();

    this.renderer.setRenderTarget(this.renderSsao ? this.rttTarget : this.ssaoFinalTarget);
    this.renderer.render(this.rttScene, quadCamera);

    // ssao
    if (this.renderSsao) {
      this.renderer.setRenderTarget(this.ssaoTarget);
      this.renderer.render(this.ssaoScene, quadCamera);
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.ssaoFinalScene, quadCamera);
    }

    // antialias
    // this.renderer.setRenderTarget(target ? target : null);
    // this.renderer.render(this.antiAliasScene, quadCamera);

    // gui
    this.renderer.autoClear = false;
    this.renderer.render(this.GUIScene, camera);
    this.renderer.autoClear = true;

    this.onAfterRender();
  }

  getRawRenderer() {
    return this.renderer;
  }
}
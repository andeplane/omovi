import * as THREE from 'three'

import {rttFragment, rttVertex} from './shaders/rtt'
import {antialiasFragment, antialiasVertex} from './shaders/antialias'
import {passThroughVertex} from './shaders/passThrough'

import {ssao, ssaoFinal} from './shaders/ssao'

interface SceneInfo {
  scene: THREE.Scene;
  uniforms: any;
}

function setupRenderingPass(options: { uniforms: any; vertexShader: string; fragmentShader: string }): THREE.Scene {
  const scene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    uniforms: options.uniforms,
    vertexShader: options.vertexShader,
    fragmentShader: options.fragmentShader,
    depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);
  return scene;
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
  private highlightColor: THREE.Color;
  private renderer: THREE.WebGLRenderer;
  private modelTarget: THREE.WebGLRenderTarget;
  private selectedTarget: THREE.WebGLRenderTarget;
  private screenshotTarget: THREE.WebGLRenderTarget;
  private rttTarget: THREE.WebGLRenderTarget;
  private ssaoTarget: THREE.WebGLRenderTarget;
  private ssaoFinalTarget: THREE.WebGLRenderTarget;
  private GUIScene: THREE.Scene;
  private rttScene: THREE.Scene;
  private rttUniforms: any;
  private antiAliasScene: THREE.Scene;
  private antiAliasUniforms: any;
  private ssaoScene: THREE.Scene;
  private ssaoUniforms: any;
  private ssaoFinalScene: THREE.Scene;
  private ssaoFinalUniforms: any;

  constructor(options: { alpha: boolean; highlightColor: THREE.Color }) {
    const { alpha, highlightColor } = options;
    this.alpha = alpha;
    this.highlightColor = highlightColor;
    this.renderer = new THREE.WebGLRenderer({ alpha });
    this.renderer.localClippingEnabled = true;

    this.modelTarget = new THREE.WebGLRenderTarget(0, 0); // adjust size later
    this.modelTarget.depthBuffer = true;
    this.modelTarget.depthTexture = new THREE.DepthTexture(0, 0); // size will be set by the first render
    this.modelTarget.depthTexture.type = THREE.UnsignedIntType;

    this.selectedTarget = new THREE.WebGLRenderTarget(0, 0); // adjust size later
    this.selectedTarget.depthBuffer = true;
    this.selectedTarget.stencilBuffer = false;

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
    this.selectedTarget.dispose();
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
      tSelected: { value: this.selectedTarget.texture },
      texelSize: { value: new THREE.Vector2() },
      uHighlightColor: { value: this.highlightColor }
    };
    const scene = setupRenderingPass({
      uniforms,
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
    const scene = setupRenderingPass({
      uniforms,
      vertexShader: antialiasVertex,
      fragmentShader: antialiasFragment
    });
    return { scene, uniforms };
  }

  createSSAOScene(): SceneInfo {
    const uniforms = {
      tDiffuse: { value: this.rttTarget.texture },
      tDepth: { value: this.modelTarget.depthTexture },
      size: { value: new THREE.Vector2() },
      cameraNear: { value: 0 }, // set during rendering
      cameraFar: { value: 0 }, // set during rendering
      radius: { value: 6 },
      onlyAO: { value: true },
      aoClamp: { value: 0.25 },
      lumInfluence: { value: 0.7 }
    };
    const scene = setupRenderingPass({
      uniforms,
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
    const scene = setupRenderingPass({
      uniforms,
      vertexShader: passThroughVertex,
      fragmentShader: ssaoFinal
    });
    return { scene, uniforms };
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height, false);

    this.modelTarget.setSize(width, height);
    this.selectedTarget.setSize(width, height);
    this.screenshotTarget.setSize(width, height);
    this.rttTarget.setSize(width, height);
    this.rttUniforms.texelSize.value.set(1.75 / width, 1.75 / height);
    this.antiAliasUniforms.resolution.value.set(width, height);

    const halfWidth = Math.floor(width * 0.5);
    const halfheight = Math.floor(height * 0.5);
    this.ssaoTarget.setSize(halfWidth, halfheight);
    this.ssaoUniforms.size.value.set(width, height);

    this.ssaoFinalTarget.setSize(width, height);
    this.ssaoFinalUniforms.size.value.set(width, height);
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
    this.onBeforeModelRender();
    this.renderer.setRenderTarget(this.modelTarget);
    this.renderer.render(scene, camera);
    this.onBeforeSelectRender();
    // this.renderer.setRenderTarget(this.selectedTarget);
    // this.renderer.render(scene, camera);

    this.renderer.setRenderTarget(this.rttTarget);
    this.renderer.render(this.rttScene, quadCamera);

    // ssao
    this.ssaoUniforms.cameraNear.value = camera.near;
    this.ssaoUniforms.cameraFar.value = camera.far;
    this.renderer.setRenderTarget(this.ssaoTarget);
    this.renderer.render(this.ssaoScene, quadCamera);
    this.renderer.setRenderTarget(this.ssaoFinalTarget);
    this.renderer.render(this.ssaoFinalScene, quadCamera);

    // antialias
    this.renderer.setRenderTarget(target ? target : null);
    this.renderer.render(this.antiAliasScene, quadCamera);

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
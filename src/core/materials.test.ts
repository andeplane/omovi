import { describe, it, expect, vi } from 'vitest'
import * as THREE from 'three'
import createMaterial from './materials'
import DataTexture from './datatexture'

// jsdom has no WebGL; createMaterial only probes the renderer for frag-depth support.
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three')
  class MockWebGLRenderer {
    domElement = { getContext: () => null }
    capabilities = { isWebGL2: true }
    dispose = vi.fn()
  }
  return { ...actual, WebGLRenderer: MockWebGLRenderer }
})

function textures() {
  return {
    color: new DataTexture('colorTexture', 16, 'rgba', () => {}),
    radius: new DataTexture('radiusTexture', 16, 'float', () => {})
  }
}

function compiledUniforms(material: THREE.Material) {
  const parameters = { uniforms: {}, vertexShader: '', fragmentShader: '' }
  material.onBeforeCompile(
    parameters as unknown as THREE.WebGLProgramParametersWithUniforms,
    {} as THREE.WebGLRenderer
  )
  return parameters.uniforms as Record<string, THREE.IUniform>
}

describe('createMaterial', () => {
  it('gives each visualizer its own material bound to its own textures', () => {
    const first = textures()
    const second = textures()
    const a = createMaterial('particle', 'vs', 'fs', first.color, first.radius)
    const b = createMaterial(
      'particle',
      'vs',
      'fs',
      second.color,
      second.radius
    )

    expect(a).not.toBe(b)
    expect(compiledUniforms(a).colorTexture.value).toBe(
      first.color.getTexture()
    )
    expect(compiledUniforms(b).colorTexture.value).toBe(
      second.color.getTexture()
    )
    expect(compiledUniforms(b).radiusTexture.value).toBe(
      second.radius.getTexture()
    )
  })

  it('keeps the shader program cache key per material type', () => {
    const { color, radius } = textures()
    const a = createMaterial('particle', 'vs', 'fs', color, radius)
    const b = createMaterial('particle', 'vs', 'fs', color, radius)
    expect(a.onBeforeCompile.toString()).toBe(b.onBeforeCompile.toString())
  })
})

import * as THREE from 'three'

function findTextureSizeFromNumPixels(numPixels: number): { width: number; height: number } {
  const exp = Math.ceil(Math.log2(numPixels)) / 2;
  const width = 2 ** Math.ceil(exp);
  const height = 2 ** Math.floor(exp);
  return { width, height };
}

export default class DataTexture {
  static rgbaFromValue(value: number, isInteger: boolean): { r: number; g: number; b: number; a: number } {
    // We pack this value (float / integer) as
    // three color values RGB which gives 24 bit precision.
    // We could in principle use RGBA to get 32 bits, but
    // if alpha is zero, all other values are zero in the shader.
    // I'm not sure why!
    // Instead we are using alpha to mark sign of value.

    if (!isInteger) {
      // We store everything as RGBA.
      // The canvas requires color values to be
      // integers in the range [0,255], so we store a float
      // as 256 times its size. This gives resolution 1/255 on floats.
      // On the GPU, these values are in the range [0,1].
      value *= 255;
    }

    // Store sign in alpha
    const a = value >= 0 ? 255 : 127;
    value = Math.abs(value);

    const r = Math.floor(value / (255 * 255));
    const g = Math.floor(value / 255) % 255;
    const b = value % 255;

    return { r, g, b, a };
  }

  static valueFromRgba(r: number, g: number, b: number, a: number, isInteger: boolean): number {
    // See comment in rgbaFromValue about why alpha isn't used.

    let value = r * 255 * 255 + g * 255 + b;
    if (a < 255) {
      value *= -1.0;
    }

    if (!isInteger) {
      // See comment in rgbaFromValue.
      // Scale back to float.
      return value / 255;
    }

    return value;
  }

  // Corresponds to packDistanceFloat and unpackDistanceFloat in data_pack.glsl and data_unpack.glsl
  // DistanceFloat is a value between 0 and 1
  static rgbaFromDistanceFloat(distanceFloat: number): { r: number; g: number; b: number; a: number } {
    const r = Math.floor(distanceFloat * 255);
    const g = Math.floor(distanceFloat * 255 * 255) % 255;
    const b = Math.floor(distanceFloat * 255 * 255 * 255) % 255;
    const a = 255.0;
    return { r, g, b, a };
  }

  static distanceFloatFromRgba(r: number, g: number, b: number, a: number): number {
    const value = r / 255 + g / (255 * 255) + b / (255 * 255 * 255);
    return value;
  }

  name: string;
  width: number;
  height: number;
  private _onChange: () => void;
  private _texture: THREE.DataTexture;

  constructor(name: string, maxParticleIndex: number, onChange: () => void) {
    this.name = name;
    this._onChange = onChange;

    const { width, height } = findTextureSizeFromNumPixels(maxParticleIndex + 10);
    this.width = width;
    this.height = height;

    const data = new Uint8Array(4 * width * height);
    for (let i = 0; i < data.length; i++) {
      data[i] = 255;
    }
    this._texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    this._texture.needsUpdate = true;
  }

  dispose() {
    this._texture.dispose();
  }

  getRGBA(particleIndex: number): { r: number; g: number; b: number; a: number } {
    let index = 4 * particleIndex;
    const r = this._texture.image.data[index++];
    const g = this._texture.image.data[index++];
    const b = this._texture.image.data[index++];
    const a = this._texture.image.data[index++];
    return { r, g, b, a };
  }

  setRGBA(particleIndex: number, r: number, g: number, b: number, a: number = 255) {
    let index = 4 * particleIndex;
    this._texture.image.data[index++] = r;
    this._texture.image.data[index++] = g;
    this._texture.image.data[index++] = b;
    this._texture.image.data[index++] = a;
    this._texture.needsUpdate = true;
    this._onChange();
  }

  getFloat(particleIndex: number): number {
    // Unpack from RGBA
    const { r, g, b, a } = this.getRGBA(particleIndex);
    return DataTexture.valueFromRgba(r, g, b, a, false);
  }

  setFloat(particleIndex: number, value: number) {
    // Pack as RGBA
    const { r, g, b, a } = DataTexture.rgbaFromValue(value, false);
    this.setRGBA(particleIndex, r, g, b, a);
  }

  getInteger(particleIndex: number): number {
    // Unpack from RGBA
    const { r, g, b, a } = this.getRGBA(particleIndex);
    return DataTexture.valueFromRgba(r, g, b, a, true);
  }

  setInteger(particleIndex: number, value: number) {
    // Pack as RGBA
    const { r, g, b, a } = DataTexture.rgbaFromValue(value, true);
    this.setRGBA(particleIndex, r, g, b, a);
  }

  getTexture(): THREE.Texture {
    return this._texture;
  }
}

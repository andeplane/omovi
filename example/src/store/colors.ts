import { action, Action } from 'easy-peasy';
import {Color} from 'types'

export interface ColorMap {[key: string]: Color}

export interface ColorModel {
  colorMap: ColorMap;
  setColorMap: Action<ColorModel, ColorMap>;
}

export const colorModel: ColorModel = {
  // Props
  colorMap: {},
  // Methods
  setColorMap: action((state, colorMap: ColorMap) => {
    state.colorMap = colorMap;
  }),
};

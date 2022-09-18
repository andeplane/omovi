import { action, Action } from 'easy-peasy';
import {Color} from 'types'

export interface ColorMap {[key: string]: Color}
export interface SetColor {particleType: string, color: Color}

export interface ColorModel {
  colorMap: ColorMap;
  setColorMap: Action<ColorModel, ColorMap>;
  setColor: Action<ColorModel, SetColor>;
}

export const colorModel: ColorModel = {
  // Props
  colorMap: {},
  // Methods
  setColorMap: action((state, colorMap: ColorMap) => {
    state.colorMap = colorMap;
  }),
  setColor: action((state, {particleType, color}) => {
    state.colorMap[particleType] = color;
  }),
};

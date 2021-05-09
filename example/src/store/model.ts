import { ColorModel, colorModel } from './colors';

export interface StoreModel {
  colors: ColorModel;
}
export const storeModel: StoreModel = {
  colors: colorModel,
};

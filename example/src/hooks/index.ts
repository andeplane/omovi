import { createTypedHooks } from 'easy-peasy'; // ๐import the helper
import { StoreModel } from 'store/model';

// Provide our model to the helper      ๐
const typedHooks = createTypedHooks<StoreModel>();

// ๐ export the typed hooks
export const { useStoreActions } = typedHooks;
export const { useStoreDispatch } = typedHooks;
export const { useStoreState } = typedHooks;

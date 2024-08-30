import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Vector3Tuple = [number, number, number];

export interface ModelMetadata {
  id: string;
  type: string; // To indicate the type of geometry, e.g., 'box'
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export interface ModelState {
  models: Array<ModelMetadata>;
  selectedModelId: string | null;
}

const initialState: ModelState = {
  models: [],
  selectedModelId: null,
};

const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    addModel: (state, action: PayloadAction<ModelMetadata>) => {
      state.models.push(action.payload);
      state.selectedModelId = action.payload.id;
    },
    selectModel: (state, action: PayloadAction<string>) => {
      state.selectedModelId = action.payload;
    },
    updateModelTransform: (state, action: PayloadAction<{ id: string, position: Vector3Tuple, rotation: Vector3Tuple, scale: Vector3Tuple }>) => {
      const model = state.models.find(m => m.id === action.payload.id);
      if (model) {
        model.position = action.payload.position;
        model.rotation = action.payload.rotation;
        model.scale = action.payload.scale;
      }
    },
  },
});

export const { addModel, selectModel, updateModelTransform } = modelSlice.actions;
export default modelSlice.reducer;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModelState {
  models: Array<any>; // Replace 'any' with your model type
  selectedModel: any | null;
}

const initialState: ModelState = {
  models: [],
  selectedModel: null,
};

const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    addModel: (state, action: PayloadAction<any>) => {
      state.models.push(action.payload);
    },
    selectModel: (state, action: PayloadAction<number>) => {
      state.selectedModel = state.models[action.payload];
    },
    // Add more actions as needed
  },
});

export const { addModel, selectModel } = modelSlice.actions;
export default modelSlice.reducer;

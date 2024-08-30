import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';

interface ModelState {
  models: Array<Group>;
  selectedModel: Group | null;
}

const initialState: ModelState = {
  models: [],
  selectedModel: null,
};

const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    addModel: (state, action: PayloadAction<Group>) => {
      state.models.push(action.payload);
      state.selectedModel = action.payload;
    },
    selectModel: (state, action: PayloadAction<number>) => {
      state.selectedModel = state.models[action.payload];
    },
    // Additional actions for model manipulation can be added here
  },
  extraReducers: (builder) => {
    builder.addCase('CREATE_NEW_MODEL', (state) => {
      const geometry = new BoxGeometry(1, 1, 1); // Example: Create a box geometry
      const material = new MeshStandardMaterial({ color: 0x00ff00 });
      const mesh = new Mesh(geometry, material);
      const newModel = new Group();
      newModel.add(mesh);
      state.models.push(newModel);
      state.selectedModel = newModel;
    });
  },
});

export const { addModel, selectModel } = modelSlice.actions;
export default modelSlice.reducer;

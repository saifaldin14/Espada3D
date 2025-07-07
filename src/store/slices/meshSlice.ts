import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MeshEditData } from '../../types';

interface MeshState {
  meshData: { [modelId: string]: MeshEditData };
  pendingOperations: { [modelId: string]: any[] };
}

const initialState: MeshState = {
  meshData: {},
  pendingOperations: {},
};

const meshSlice = createSlice({
  name: 'mesh',
  initialState,
  reducers: {
    initializeMeshData: (state, action: PayloadAction<MeshEditData>) => {
      const { modelId } = action.payload;
      state.meshData[modelId] = action.payload;
      if (!state.pendingOperations[modelId]) {
        state.pendingOperations[modelId] = [];
      }
    },

    updateMeshData: (state, action: PayloadAction<MeshEditData>) => {
      const { modelId } = action.payload;
      state.meshData[modelId] = action.payload;
    },

    clearMeshData: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      delete state.meshData[modelId];
      delete state.pendingOperations[modelId];
    },

    addMeshOperation: (state, action: PayloadAction<{
      modelId: string;
      operation: {
        type: string;
        params: any;
        timestamp: number;
      };
    }>) => {
      const { modelId, operation } = action.payload;
      if (!state.pendingOperations[modelId]) {
        state.pendingOperations[modelId] = [];
      }
      state.pendingOperations[modelId].push(operation);
    },

    clearPendingOperations: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      state.pendingOperations[modelId] = [];
    },
  },
});

export const {
  initializeMeshData,
  updateMeshData,
  clearMeshData,
  addMeshOperation,
  clearPendingOperations,
} = meshSlice.actions;

export default meshSlice.reducer;

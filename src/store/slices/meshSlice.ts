import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MeshEditData, SelectSubObjectPayload, GeometryData } from '../../types';

interface MeshState {
  meshData: { [modelId: string]: MeshEditData };
  geometryCache: { [modelId: string]: GeometryData };
  pendingOperations: { [modelId: string]: any[] };
}

const initialState: MeshState = {
  meshData: {},
  geometryCache: {},
  pendingOperations: {},
};

const meshSlice = createSlice({
  name: 'mesh',
  initialState,
  reducers: {
    initializeMeshData: (state, action: PayloadAction<MeshEditData>) => {
      const { modelId } = action.payload;
      // Create a deep copy to ensure proper re-rendering
      state.meshData[modelId] = {
        ...action.payload,
        vertices: [...action.payload.vertices],
        edges: [...action.payload.edges],
        faces: [...action.payload.faces]
      };
      if (!state.pendingOperations[modelId]) {
        state.pendingOperations[modelId] = [];
      }
    },

    updateMeshData: (state, action: PayloadAction<MeshEditData>) => {
      const { modelId } = action.payload;
      // Create a deep copy to ensure proper re-rendering
      state.meshData[modelId] = {
        ...action.payload,
        vertices: [...action.payload.vertices],
        edges: [...action.payload.edges],
        faces: [...action.payload.faces]
      };
    },

    clearMeshData: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      delete state.meshData[modelId];
      delete state.geometryCache[modelId];
      delete state.pendingOperations[modelId];
    },

    selectSubObjects: (state, action: PayloadAction<SelectSubObjectPayload>) => {
      const { modelId, type, indices, mode } = action.payload;
      
      // Update selection in mesh data if it exists
      const meshData = state.meshData[modelId];
      if (meshData) {
        // Create completely new mesh data object to ensure proper updates
        if (type === 'vertex') {
          state.meshData[modelId] = {
            ...meshData,
            vertices: meshData.vertices.map((vertex, index) => {
              const shouldSelect = indices.includes(index);
              if (mode === 'set') {
                return { ...vertex, selected: shouldSelect };
              } else if (mode === 'add' && shouldSelect) {
                return { ...vertex, selected: true };
              } else if (mode === 'remove' && shouldSelect) {
                return { ...vertex, selected: false };
              }
              return vertex;
            })
          };
        } else if (type === 'edge') {
          state.meshData[modelId] = {
            ...meshData,
            edges: meshData.edges.map((edge, index) => {
              const shouldSelect = indices.includes(index);
              if (mode === 'set') {
                return { ...edge, selected: shouldSelect };
              } else if (mode === 'add' && shouldSelect) {
                return { ...edge, selected: true };
              } else if (mode === 'remove' && shouldSelect) {
                return { ...edge, selected: false };
              }
              return edge;
            })
          };
        } else if (type === 'face') {
          state.meshData[modelId] = {
            ...meshData,
            faces: meshData.faces.map((face, index) => {
              const shouldSelect = indices.includes(index);
              if (mode === 'set') {
                return { ...face, selected: shouldSelect };
              } else if (mode === 'add' && shouldSelect) {
                return { ...face, selected: true };
              } else if (mode === 'remove' && shouldSelect) {
                return { ...face, selected: false };
              }
              return face;
            })
          };
        }
      }
    },

    setGeometryCache: (state, action: PayloadAction<GeometryData>) => {
      state.geometryCache[action.payload.modelId] = action.payload;
    },

    clearGeometryCache: (state, action: PayloadAction<string>) => {
      delete state.geometryCache[action.payload];
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
  selectSubObjects,
  setGeometryCache,
  clearGeometryCache,
  addMeshOperation,
  clearPendingOperations,
} = meshSlice.actions;

export default meshSlice.reducer;

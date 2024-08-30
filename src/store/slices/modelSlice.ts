import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export type Vector3Tuple = [number, number, number];

export interface MaterialProperties {
  type: "standard" | "phong" | "lambert";
  color?: string;
}

export interface ModelMetadata {
  id: string;
  type: 'box' | 'sphere' | 'cylinder';
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  material: MaterialProperties;
  parentId: string | null; // To manage hierarchy
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
      state.selectedModelId = action.payload.id;  // Automatically select the new model
    },
    selectModel: (state, action: PayloadAction<string | null>) => {
      state.selectedModelId = action.payload;
    },
    updateModelTransform: (
      state,
      action: PayloadAction<{ id: string; position: Vector3Tuple; rotation: Vector3Tuple; scale: Vector3Tuple }>
    ) => {
      const model = state.models.find((m) => m.id === action.payload.id);
      if (model) {
        model.position = action.payload.position;
        model.rotation = action.payload.rotation;
        model.scale = action.payload.scale;
      }
    },
    updateModelMaterial: (state, action: PayloadAction<{ id: string; material: MaterialProperties }>) => {
      const model = state.models.find((m) => m.id === action.payload.id);
      if (model) {
        model.material = action.payload.material;
      }
    },
    createNewModel: (
      state,
      action: PayloadAction<{ type: 'box' | 'sphere' | 'cylinder'; position?: Vector3Tuple; rotation?: Vector3Tuple; scale?: Vector3Tuple; material?: MaterialProperties; parentId?: string | null }>
    ) => {
      const newModel: ModelMetadata = {
        id: uuidv4(), // Generate a new unique ID
        type: action.payload.type,
        position: action.payload.position || [0, 0, 0],
        rotation: action.payload.rotation || [0, 0, 0],
        scale: action.payload.scale || [1, 1, 1],
        material: {
          type: "standard",
          color: "#ecf0f1",
        },
        parentId: action.payload.parentId || null, // Set parentId
      };
      state.models.push(newModel);
      state.selectedModelId = newModel.id;
    },
    removeModel: (state, action: PayloadAction<string>) => {
      const modelToRemove = state.models.find((model) => model.id === action.payload);
      if (modelToRemove) {
        // Remove the model and any of its children
        state.models = state.models.filter(
          (model) => model.id !== action.payload && model.parentId !== action.payload
        );
        if (state.selectedModelId === action.payload) {
          state.selectedModelId = null; // Deselect the model if it was selected
        }
      }
    },
    duplicateModel: (state, action: PayloadAction<string>) => {
      const originalModel = state.models.find((model) => model.id === action.payload);
      if (originalModel) {
        const newModel: ModelMetadata = {
          ...originalModel,
          id: uuidv4(), // Assign a new unique ID for the duplicated model
          parentId: originalModel.parentId, // Keep the parent relationship
        };
        state.models.push(newModel);
        state.selectedModelId = newModel.id; // Select the duplicated model
      }
    },
  },
});

export const { 
  addModel, 
  selectModel, 
  updateModelMaterial,
  updateModelTransform,
  createNewModel, 
  removeModel, 
  duplicateModel, 
} = modelSlice.actions;
export default modelSlice.reducer;

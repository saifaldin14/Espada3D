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
  parentId: string | null;
}

export interface ModelState {
  models: Array<ModelMetadata>;
  selectedModelIds: string[]; // Updated to an array of selected IDs
}

const initialState: ModelState = {
  models: [],
  selectedModelIds: [], // Initialize as an empty array
};

const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    addModel: (state, action: PayloadAction<ModelMetadata>) => {
      state.models.push(action.payload);
      state.selectedModelIds = [action.payload.id];  // Automatically select the new model
    },
    selectModel: (state, action: PayloadAction<{ id: string; multiSelect: boolean }>) => {
      if (action.payload.multiSelect) {
        if (state.selectedModelIds.includes(action.payload.id)) {
          // If already selected, deselect it
          state.selectedModelIds = state.selectedModelIds.filter(id => id !== action.payload.id);
        } else {
          // Add to selected models
          state.selectedModelIds.push(action.payload.id);
        }
      } else {
        // Single selection mode
        state.selectedModelIds = [action.payload.id];
      }
    },
    clearSelection: (state) => {
      state.selectedModelIds = [];
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
      state.selectedModelIds = [newModel.id];
    },
    removeModel: (state, action: PayloadAction<string>) => {
      const modelToRemove = state.models.find((model) => model.id === action.payload);
      if (modelToRemove) {
        // Remove the model and any of its children
        state.models = state.models.filter(
          (model) => model.id !== action.payload && model.parentId !== action.payload
        );
        state.selectedModelIds = state.selectedModelIds.filter(id => id !== action.payload); // Deselect the model if it was selected
      }
    },
    duplicateModel: (state, action: PayloadAction<string>) => {
      const originalModel = state.models.find((model) => model.id === action.payload);
      if (originalModel) {
        const newModel: ModelMetadata = {
          ...originalModel,
          id: uuidv4(), // Assign a new unique ID for the duplicated model
          position: [...originalModel.position] as Vector3Tuple, // Clone position
          rotation: [...originalModel.rotation] as Vector3Tuple, // Clone rotation
          scale: [...originalModel.scale] as Vector3Tuple, // Clone scale
          material: { ...originalModel.material }, // Clone material properties
        };
        state.models.push(newModel);
        state.selectedModelIds = [newModel.id]; // Select the duplicated model
      }
    },
  },
});

export const { 
  addModel, 
  selectModel, 
  clearSelection,
  updateModelMaterial,
  updateModelTransform,
  createNewModel, 
  removeModel, 
  duplicateModel 
} = modelSlice.actions;

export default modelSlice.reducer;

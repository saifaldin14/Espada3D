import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { 
  ModelMetadata, 
  ModelState, 
  CreateModelPayload,
  UpdateModelTransformPayload,
  UpdateModelMaterialPayload,
  ModelValidationError
} from '../../types';
import { APP_CONFIG, ERROR_MESSAGES } from '../../config/constants';
import { validateCreateModelPayload, validateVector3, validateMaterial } from '../../utils/validation';

const initialState: ModelState = {
  models: [],
  selectedModelId: null,
  loading: false,
  error: null,
};

const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addModel: (state, action: PayloadAction<ModelMetadata>) => {
      if (state.models.length >= APP_CONFIG.SCENE.MAX_MODELS) {
        state.error = ERROR_MESSAGES.RUNTIME.MAX_MODELS_REACHED;
        return;
      }
      state.models.push(action.payload);
      state.selectedModelId = action.payload.id;
      state.error = null;
    },
    selectModel: (state, action: PayloadAction<string | null>) => {
      state.selectedModelId = action.payload;
    },
    updateModelTransform: (state, action: PayloadAction<UpdateModelTransformPayload>) => {
      try {
        // Validate input
        validateVector3(action.payload.position, 'position');
        validateVector3(action.payload.rotation, 'rotation');
        validateVector3(action.payload.scale, 'scale');
        
        const model = state.models.find((m) => m.id === action.payload.id);
        if (!model) {
          state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
          return;
        }
        
        model.position = action.payload.position;
        model.rotation = action.payload.rotation;
        model.scale = action.payload.scale;
        model.updatedAt = new Date().toISOString();
        state.error = null;
      } catch (error) {
        state.error = error instanceof ModelValidationError ? error.message : 'Invalid transform data';
      }
    },
    updateModelMaterial: (state, action: PayloadAction<UpdateModelMaterialPayload>) => {
      try {
        // Validate material
        validateMaterial(action.payload.material);
        
        const model = state.models.find((m) => m.id === action.payload.id);
        if (!model) {
          state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
          return;
        }
        
        model.material = action.payload.material;
        model.updatedAt = new Date().toISOString();
        state.error = null;
      } catch (error) {
        state.error = error instanceof ModelValidationError ? error.message : 'Invalid material data';
      }
    },
    createNewModel: (state, action: PayloadAction<CreateModelPayload>) => {
      try {
        if (state.models.length >= APP_CONFIG.SCENE.MAX_MODELS) {
          state.error = ERROR_MESSAGES.RUNTIME.MAX_MODELS_REACHED;
          return;
        }

        // Validate payload
        const validatedPayload = validateCreateModelPayload(action.payload);
        
        const now = new Date().toISOString();
        const newModel: ModelMetadata = {
          id: uuidv4(),
          type: validatedPayload.type,
          position: validatedPayload.position || [...APP_CONFIG.SCENE.DEFAULT_POSITION],
          rotation: validatedPayload.rotation || [...APP_CONFIG.SCENE.DEFAULT_ROTATION],
          scale: validatedPayload.scale || [...APP_CONFIG.SCENE.DEFAULT_SCALE],
          material: validatedPayload.material || {
            type: "standard",
            color: APP_CONFIG.MATERIALS.DEFAULT_COLOR,
            opacity: APP_CONFIG.MATERIALS.DEFAULT_OPACITY,
            metalness: APP_CONFIG.MATERIALS.DEFAULT_METALNESS,
            roughness: APP_CONFIG.MATERIALS.DEFAULT_ROUGHNESS,
          },
          parentId: validatedPayload.parentId || null,
          createdAt: now,
          updatedAt: now,
          name: validatedPayload.name,
        };
        
        state.models.push(newModel);
        state.selectedModelId = newModel.id;
        state.error = null;
      } catch (error) {
        state.error = error instanceof ModelValidationError ? error.message : 'Failed to create model';
      }
    },
    removeModel: (state, action: PayloadAction<string>) => {
      const modelToRemove = state.models.find((model) => model.id === action.payload);
      if (!modelToRemove) {
        state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
        return;
      }
      
      // Remove the model and any of its children
      state.models = state.models.filter(
        (model) => model.id !== action.payload && model.parentId !== action.payload
      );
      
      if (state.selectedModelId === action.payload) {
        state.selectedModelId = null;
      }
      state.error = null;
    },
    duplicateModel: (state, action: PayloadAction<string>) => {
      const originalModel = state.models.find((model) => model.id === action.payload);
      if (!originalModel) {
        state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
        return;
      }
      
      if (state.models.length >= APP_CONFIG.SCENE.MAX_MODELS) {
        state.error = ERROR_MESSAGES.RUNTIME.MAX_MODELS_REACHED;
        return;
      }
      
      const now = new Date().toISOString();
      const newModel: ModelMetadata = {
        ...originalModel,
        id: uuidv4(),
        position: [
          originalModel.position[0] + 0.5,
          originalModel.position[1],
          originalModel.position[2]
        ],
        rotation: [...originalModel.rotation],
        scale: [...originalModel.scale],
        material: { ...originalModel.material },
        name: originalModel.name ? `${originalModel.name} Copy` : undefined,
        createdAt: now,
        updatedAt: now,
      };

      state.models.push(newModel);
      state.selectedModelId = newModel.id;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  setLoading,
  setError,
  addModel, 
  selectModel, 
  updateModelMaterial,
  updateModelTransform,
  createNewModel, 
  removeModel, 
  duplicateModel,
  clearError
} = modelSlice.actions;

export default modelSlice.reducer;

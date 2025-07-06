import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { 
  ModelMetadata, 
  ModelState, 
  CreateModelPayload,
  UpdateModelTransformPayload,
  UpdateModelMaterialPayload,
  UpdateModelMetadataPayload,
  UpdateModelHierarchyPayload,
  DuplicateModelPayload,
  GroupModelsPayload,
  ModelValidationError,
  Vector3Tuple
} from '../../types';
import { APP_CONFIG, ERROR_MESSAGES } from '../../config/constants';
import { validateCreateModelPayload, validateVector3, validateMaterial } from '../../utils/validation';

const initialState: ModelState = {
  models: [],
  selectedModelId: null,
  selectedModelIds: [],
  loading: false,
  error: null,
  history: [[]],
  historyIndex: 0,
  clipboard: [],
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
          name: validatedPayload.name || `${validatedPayload.type}_${Date.now()}`,
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
          visible: true,
          locked: false,
          createdAt: now,
          updatedAt: now,
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
        name: `${originalModel.name} Copy`,
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
    // New advanced editing actions
    updateModelMetadata: (state, action: PayloadAction<UpdateModelMetadataPayload>) => {
      const model = state.models.find((m) => m.id === action.payload.id);
      if (!model) {
        state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
        return;
      }
      
      if (action.payload.name !== undefined) model.name = action.payload.name;
      if (action.payload.visible !== undefined) model.visible = action.payload.visible;
      if (action.payload.locked !== undefined) model.locked = action.payload.locked;
      if (action.payload.userData !== undefined) model.userData = { ...model.userData, ...action.payload.userData };
      
      model.updatedAt = new Date().toISOString();
      state.error = null;
    },
    updateModelHierarchy: (state, action: PayloadAction<UpdateModelHierarchyPayload>) => {
      const model = state.models.find((m) => m.id === action.payload.id);
      if (!model) {
        state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
        return;
      }
      
      // Remove from old parent's children
      if (model.parentId) {
        const oldParent = state.models.find((m) => m.id === model.parentId);
        if (oldParent && oldParent.children) {
          oldParent.children = oldParent.children.filter(id => id !== action.payload.id);
        }
      }
      
      // Add to new parent's children
      if (action.payload.parentId) {
        const newParent = state.models.find((m) => m.id === action.payload.parentId);
        if (newParent) {
          if (!newParent.children) newParent.children = [];
          newParent.children.push(action.payload.id);
        }
      }
      
      model.parentId = action.payload.parentId;
      model.updatedAt = new Date().toISOString();
      state.error = null;
    },
    selectMultipleModels: (state, action: PayloadAction<string[]>) => {
      state.selectedModelIds = action.payload;
      state.selectedModelId = action.payload.length === 1 ? action.payload[0] : null;
    },
    toggleModelSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedModelIds.indexOf(action.payload);
      if (index === -1) {
        state.selectedModelIds.push(action.payload);
      } else {
        state.selectedModelIds.splice(index, 1);
      }
      state.selectedModelId = state.selectedModelIds.length === 1 ? state.selectedModelIds[0] : null;
    },
    groupModels: (state, action: PayloadAction<GroupModelsPayload>) => {
      const { modelIds, groupName } = action.payload;
      
      // Create group parent
      const groupId = uuidv4();
      const now = new Date().toISOString();
      const groupModel: ModelMetadata = {
        id: groupId,
        type: 'box',
        name: groupName,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        material: { type: 'standard', color: '#cccccc', transparent: true, opacity: 0.1 },
        parentId: null,
        children: [...modelIds],
        visible: true,
        locked: false,
        createdAt: now,
        updatedAt: now,
      };
      
      // Update child models
      modelIds.forEach(id => {
        const model = state.models.find(m => m.id === id);
        if (model) {
          model.parentId = groupId;
        }
      });
      
      state.models.push(groupModel);
      state.selectedModelId = groupId;
      state.error = null;
    },
    ungroupModels: (state, action: PayloadAction<string>) => {
      const groupModel = state.models.find(m => m.id === action.payload);
      if (!groupModel || !groupModel.children) {
        state.error = 'Group not found or has no children';
        return;
      }
      
      // Remove parent reference from children
      groupModel.children.forEach(childId => {
        const child = state.models.find(m => m.id === childId);
        if (child) {
          child.parentId = null;
        }
      });
      
      // Remove group model
      state.models = state.models.filter(m => m.id !== action.payload);
      
      if (state.selectedModelId === action.payload) {
        state.selectedModelId = null;
      }
      
      state.error = null;
    },
    copyModels: (state, action: PayloadAction<string[]>) => {
      const modelsToCopy = state.models.filter(m => action.payload.includes(m.id));
      state.clipboard = modelsToCopy.map(model => ({ ...model }));
    },
    pasteModels: (state) => {
      if (state.clipboard.length === 0) return;
      
      const now = new Date().toISOString();
      const newModels = state.clipboard.map(model => ({
        ...model,
        id: uuidv4(),
        name: `${model.name} Copy`,
        position: [model.position[0] + 1, model.position[1], model.position[2]] as Vector3Tuple,
        createdAt: now,
        updatedAt: now,
      }));
      
      state.models.push(...newModels);
      state.selectedModelIds = newModels.map(m => m.id);
      state.selectedModelId = newModels.length === 1 ? newModels[0].id : null;
    },
    saveToHistory: (state) => {
      // Remove future history if we're not at the end
      if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
      }
      
      // Add current state to history
      state.history.push(state.models.map(model => ({ ...model })));
      state.historyIndex = state.history.length - 1;
      
      // Limit history size
      if (state.history.length > 50) {
        state.history.shift();
        state.historyIndex--;
      }
    },
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        state.models = state.history[state.historyIndex].map(model => ({ ...model }));
      }
    },
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.models = state.history[state.historyIndex].map(model => ({ ...model }));
      }
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
  updateModelMetadata,
  updateModelHierarchy,
  selectMultipleModels,
  toggleModelSelection,
  groupModels,
  ungroupModels,
  copyModels,
  pasteModels,
  createNewModel, 
  removeModel, 
  duplicateModel,
  saveToHistory,
  undo,
  redo,
  clearError
} = modelSlice.actions;

export default modelSlice.reducer;

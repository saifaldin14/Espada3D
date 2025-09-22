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
  Vector3Tuple,
  UpdateVertexPayload,
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
    updateModelMetadata: (state, action: PayloadAction<UpdateModelMetadataPayload>) => {
      const model = state.models.find((m) => m.id === action.payload.id);
      if (!model) {
        state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
        return;
      }
      
      if (action.payload.name !== undefined) model.name = action.payload.name;
      if (action.payload.visible !== undefined) model.visible = action.payload.visible;
      if (action.payload.locked !== undefined) model.locked = action.payload.locked;
      if (action.payload.userData !== undefined) {
        model.userData = { ...model.userData, ...action.payload.userData };
      }
      
      model.updatedAt = new Date().toISOString();
      state.error = null;
    },
    updateModelHierarchy: (state, action: PayloadAction<UpdateModelHierarchyPayload>) => {
      const model = state.models.find((m) => m.id === action.payload.id);
      if (!model) {
        state.error = ERROR_MESSAGES.RUNTIME.MODEL_NOT_FOUND;
        return;
      }
      
      const oldParent = model.parentId ? state.models.find(m => m.id === model.parentId) : null;
      if (oldParent && oldParent.children) {
        oldParent.children = oldParent.children.filter(id => id !== model.id);
      }
      
      model.parentId = action.payload.parentId;
      
      if (action.payload.parentId) {
        const newParent = state.models.find(m => m.id === action.payload.parentId);
        if (newParent) {
          if (!newParent.children) newParent.children = [];
          newParent.children.push(model.id);
        }
      }
      
      model.updatedAt = new Date().toISOString();
      state.error = null;
    },
    selectMultipleModels: (state, action: PayloadAction<string[]>) => {
      state.selectedModelIds = action.payload;
    },
    toggleModelSelection: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      const index = state.selectedModelIds.indexOf(modelId);
      if (index > -1) {
        state.selectedModelIds.splice(index, 1);
      } else {
        state.selectedModelIds.push(modelId);
      }
    },
    groupModels: (state, action: PayloadAction<GroupModelsPayload>) => {
      const { modelIds, groupName } = action.payload;
      const groupId = uuidv4();
      
      const groupModel: ModelMetadata = {
        id: groupId,
        type: 'box',
        name: groupName,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        material: { type: 'standard', color: '#808080' },
        parentId: null,
        children: modelIds,
        visible: true,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userData: { isGroup: true }
      };
      
      state.models.push(groupModel);
      
      modelIds.forEach(id => {
        const model = state.models.find(m => m.id === id);
        if (model) {
          model.parentId = groupId;
        }
      });
    },
    ungroupModels: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      const group = state.models.find(m => m.id === groupId);
      
      if (group && group.children) {
        group.children.forEach(childId => {
          const child = state.models.find(m => m.id === childId);
          if (child) {
            child.parentId = null;
          }
        });
        
        state.models = state.models.filter(m => m.id !== groupId);
      }
    },
    createNewModel: (state, action: PayloadAction<CreateModelPayload>) => {
      try {
        validateCreateModelPayload(action.payload);
        
        const newModel: ModelMetadata = {
          id: uuidv4(),
          type: action.payload.type,
          name: action.payload.name || `${action.payload.type}_${Date.now()}`,
          position: action.payload.position || [0, 0, 0],
          rotation: action.payload.rotation || [0, 0, 0],
          scale: action.payload.scale || [1, 1, 1],
          material: action.payload.material || { type: 'standard', color: '#00ff00' },
          parentId: action.payload.parentId || null,
          visible: true,
          locked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        if (state.models.length >= APP_CONFIG.SCENE.MAX_MODELS) {
          state.error = ERROR_MESSAGES.RUNTIME.MAX_MODELS_REACHED;
          return;
        }
        
        state.models.push(newModel);
        state.selectedModelId = newModel.id;
        state.error = null;
        
      } catch (error) {
        state.error = error instanceof ModelValidationError ? error.message : 'Failed to create model';
      }
    },
    removeModel: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      
      const removeRecursively = (id: string) => {
        const model = state.models.find(m => m.id === id);
        if (model && model.children) {
          model.children.forEach(childId => removeRecursively(childId));
        }
        state.models = state.models.filter(m => m.id !== id);
      };
      
      removeRecursively(modelId);
      
      if (state.selectedModelId === modelId) {
        state.selectedModelId = null;
      }
      state.selectedModelIds = state.selectedModelIds.filter(id => id !== modelId);
    },
    clearModels: (state) => {
      state.models = [];
      state.selectedModelId = null;
      state.selectedModelIds = [];
      state.error = null;
    },
    setModels: (state, action: PayloadAction<ModelMetadata[]>) => {
      state.models = action.payload;
      state.selectedModelId = null;
      state.selectedModelIds = [];
      state.error = null;
    },
    duplicateModel: (state, action: PayloadAction<DuplicateModelPayload>) => {
      const { id, position: offset, name } = action.payload;
      const originalModel = state.models.find(m => m.id === id);
      
      if (originalModel) {
        const duplicatedModel: ModelMetadata = {
          ...originalModel,
          id: uuidv4(),
          name: name || `${originalModel.name}_copy`,
          position: offset || [
            originalModel.position[0] + 1,
            originalModel.position[1],
            originalModel.position[2]
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        state.models.push(duplicatedModel);
      }
    },
    copyModels: (state, action: PayloadAction<string[]>) => {
      const modelIds = action.payload;
      state.clipboard = modelIds.map(id => 
        state.models.find(m => m.id === id)
      ).filter(Boolean) as ModelMetadata[];
    },
    pasteModels: (state, action: PayloadAction<Vector3Tuple>) => {
      const offset = action.payload;
      
      state.clipboard.forEach(model => {
        const pastedModel: ModelMetadata = {
          ...model,
          id: uuidv4(),
          name: `${model.name}_paste`,
          position: [
            model.position[0] + offset[0],
            model.position[1] + offset[1],
            model.position[2] + offset[2]
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        state.models.push(pastedModel);
      });
    },
    saveToHistory: (state) => {
      const currentState = JSON.parse(JSON.stringify(state.models));
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(currentState);
      
      if (state.history.length > 50) {
        state.history.shift();
      } else {
        state.historyIndex++;
      }
    },
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        state.models = state.history[state.historyIndex];
      }
    },
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.models = state.history[state.historyIndex];
      }
    },
    clearError: (state) => {
      state.error = null;
    },

    // Basic vertex updates
    updateVertex: (state, action: PayloadAction<UpdateVertexPayload>) => {
      const { modelId, vertexIndex, position } = action.payload;
      const model = state.models.find(m => m.id === modelId);
      if (model) {
        if (!model.userData) model.userData = {};
        if (!model.userData.vertexModifications) model.userData.vertexModifications = {};
        model.userData.vertexModifications[vertexIndex] = position;
        model.updatedAt = new Date().toISOString();
      }
    },

    // Signal that mesh editing operations should be processed
    triggerMeshUpdate: (state, action: PayloadAction<{ modelId: string }>) => {
      const { modelId } = action.payload;
      const model = state.models.find(m => m.id === modelId);
      if (model) {
        model.updatedAt = new Date().toISOString();
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
  clearModels,
  setModels,
  duplicateModel,
  saveToHistory,
  undo,
  redo,
  clearError,
  updateVertex,
  triggerMeshUpdate,
} = modelSlice.actions;

export default modelSlice.reducer;

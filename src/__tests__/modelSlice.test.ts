import modelReducer, {
  addModel,
  removeModel,
  updateModelTransform,
  updateModelMaterial,
  updateModelMetadata,
  selectModel,
  clearModels,
} from '../store/slices/modelSlice';
import { ModelMetadata, ModelState } from '../types';

const createTestModel = (overrides: Partial<ModelMetadata> = {}): ModelMetadata => ({
  id: `model_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type: 'box',
  name: 'Test Box',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  material: { type: 'standard', color: '#ffffff', roughness: 0.5, metalness: 0.1 },
  parentId: null,
  visible: true,
  locked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('modelSlice', () => {
  const initialState: ModelState = {
    models: [],
    selectedModelId: null,
    selectedModelIds: [],
    loading: false,
    error: null,
    history: [],
    historyIndex: -1,
    clipboard: [],
  };

  describe('addModel', () => {
    it('should add a model to the state', () => {
      const model = createTestModel({ id: 'test-1' });
      const state = modelReducer(initialState, addModel(model));

      expect(state.models).toHaveLength(1);
      expect(state.models[0].id).toBe('test-1');
      expect(state.models[0].name).toBe('Test Box');
    });

    it('should allow adding the same model twice', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));
      state = modelReducer(state, addModel(model));

      // modelSlice does not prevent duplicate IDs
      expect(state.models).toHaveLength(2);
    });
  });

  describe('removeModel', () => {
    it('should remove a model by ID', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));
      state = modelReducer(state, removeModel('test-1'));

      expect(state.models).toHaveLength(0);
    });

    it('should clear selection when removing selected model', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));
      state = modelReducer(state, selectModel('test-1'));
      state = modelReducer(state, removeModel('test-1'));

      expect(state.selectedModelId).toBeNull();
    });
  });

  describe('updateModelTransform', () => {
    it('should update model position, rotation, and scale', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));

      state = modelReducer(state, updateModelTransform({
        id: 'test-1',
        position: [5, 10, 15],
        rotation: [0.5, 1.0, 1.5],
        scale: [2, 2, 2],
      }));

      expect(state.models[0].position).toEqual([5, 10, 15]);
      expect(state.models[0].rotation).toEqual([0.5, 1.0, 1.5]);
      expect(state.models[0].scale).toEqual([2, 2, 2]);
    });

    it('should not crash when updating a non-existent model', () => {
      const state = modelReducer(initialState, updateModelTransform({
        id: 'non-existent',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      }));

      expect(state.models).toHaveLength(0);
    });
  });

  describe('updateModelMaterial', () => {
    it('should update model material properties', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));

      state = modelReducer(state, updateModelMaterial({
        id: 'test-1',
        material: { type: 'phong', color: '#ff0000', roughness: 0.8 },
      }));

      expect(state.models[0].material.type).toBe('phong');
      expect(state.models[0].material.color).toBe('#ff0000');
    });
  });

  describe('updateModelMetadata', () => {
    it('should update model name and visibility', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));

      state = modelReducer(state, updateModelMetadata({
        id: 'test-1',
        name: 'Renamed Model',
        visible: false,
      }));

      expect(state.models[0].name).toBe('Renamed Model');
      expect(state.models[0].visible).toBe(false);
    });
  });

  describe('selectModel', () => {
    it('should select a model by ID', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));
      state = modelReducer(state, selectModel('test-1'));

      expect(state.selectedModelId).toBe('test-1');
    });

    it('should deselect when selecting null', () => {
      const model = createTestModel({ id: 'test-1' });
      let state = modelReducer(initialState, addModel(model));
      state = modelReducer(state, selectModel('test-1'));
      state = modelReducer(state, selectModel(null));

      expect(state.selectedModelId).toBeNull();
    });
  });

  describe('clearModels', () => {
    it('should remove all models', () => {
      let state = modelReducer(initialState, addModel(createTestModel({ id: 'test-1' })));
      state = modelReducer(state, addModel(createTestModel({ id: 'test-2' })));
      state = modelReducer(state, clearModels());

      expect(state.models).toHaveLength(0);
    });
  });
});

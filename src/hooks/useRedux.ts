import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useMemo, useCallback } from 'react';
import { RootState, ModelMetadata } from '../types';
import { AppDispatch } from '../store';
import { 
  createNewModel, 
  updateModelTransform, 
  updateModelMaterial,
  removeModel,
  duplicateModel,
  selectModel,
  clearError
} from '../store/slices/modelSlice';
import { CreateModelPayload, UpdateModelTransformPayload, UpdateModelMaterialPayload } from '../types';

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom model hooks
export const useModels = () => {
  const dispatch = useAppDispatch();
  const { models, selectedModelId, loading, error } = useAppSelector(state => state.models);
  
  const selectedModel = useMemo(() => 
    models.find(model => model.id === selectedModelId) || null,
    [models, selectedModelId]
  );
  
  const createModel = useCallback((payload: CreateModelPayload) => {
    dispatch(createNewModel(payload));
  }, [dispatch]);
  
  const updateTransform = useCallback((payload: UpdateModelTransformPayload) => {
    dispatch(updateModelTransform(payload));
  }, [dispatch]);
  
  const updateMaterial = useCallback((payload: UpdateModelMaterialPayload) => {
    dispatch(updateModelMaterial(payload));
  }, [dispatch]);
  
  const deleteModel = useCallback((id: string) => {
    dispatch(removeModel(id));
  }, [dispatch]);
  
  const duplicateModelById = useCallback((id: string) => {
    dispatch(duplicateModel({ id }));
  }, [dispatch]);
  
  const selectModelById = useCallback((id: string | null) => {
    dispatch(selectModel(id));
  }, [dispatch]);
  
  const clearModelError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  return {
    models,
    selectedModel,
    selectedModelId,
    loading,
    error,
    createModel,
    updateTransform,
    updateMaterial,
    deleteModel,
    duplicateModelById,
    selectModelById,
    clearModelError,
  };
};

// Custom UI hooks
export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(state => state.ui);
  
  const setActiveTool = useCallback((tool: 'translate' | 'rotate' | 'scale' | 'select') => {
    dispatch({ type: 'ui/setActiveTool', payload: tool });
  }, [dispatch]);
  
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'ui/toggleSidebar' });
  }, [dispatch]);
  
  const toggleEditor = useCallback(() => {
    dispatch({ type: 'ui/toggleEditor' });
  }, [dispatch]);
  
  const setGrid = useCallback((show: boolean) => {
    dispatch({ type: 'ui/setGrid', payload: show });
  }, [dispatch]);
  
  const setWireframe = useCallback((show: boolean) => {
    dispatch({ type: 'ui/setWireframe', payload: show });
  }, [dispatch]);
  
  const setModalOpen = useCallback((open: boolean) => {
    dispatch({ type: 'ui/setModalOpen', payload: open });
  }, [dispatch]);
  
  return {
    ...ui,
    setActiveTool,
    toggleSidebar,
    toggleEditor,
    setGrid,
    setWireframe,
    setModalOpen,
  };
};

// Performance optimized selectors
export const useModelCount = () => useAppSelector(state => state.models.models.length);
export const useHasSelectedModel = () => useAppSelector(state => state.models.selectedModelId !== null);
export const useModelError = () => useAppSelector(state => state.models.error);
export const useModelLoading = () => useAppSelector(state => state.models.loading);

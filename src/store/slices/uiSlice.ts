import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, ToolType, EditMode, SelectionMode, SubObjectType, SelectSubObjectPayload, MeshEditData } from '../../types';

const initialState: UIState = {
  activeTool: 'translate',
  editMode: 'model',
  isSidebarOpen: true,
  isEditorOpen: true,
  showGrid: true,
  showWireframe: false,
  isModalOpen: false,
  isHierarchyPanelOpen: false,
  isAnimationPanelOpen: false,
  snap: false,
  snapSize: 0.5,
  meshEditData: {},
  subObjectSelectionMode: 'single',
  currentSubObjectType: 'vertex',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<ToolType>) => {
      state.activeTool = action.payload;
    },
    setEditMode: (state, action: PayloadAction<EditMode>) => {
      state.editMode = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleEditor: (state) => {
      state.isEditorOpen = !state.isEditorOpen;
    },
    toggleHierarchyPanel: (state) => {
      state.isHierarchyPanelOpen = !state.isHierarchyPanelOpen;
    },
    toggleAnimationPanel: (state) => {
      state.isAnimationPanelOpen = !state.isAnimationPanelOpen;
    },
    setGrid: (state, action: PayloadAction<boolean>) => {
      state.showGrid = action.payload;
    },
    setWireframe: (state, action: PayloadAction<boolean>) => {
      state.showWireframe = action.payload;
    },
    setSnap: (state, action: PayloadAction<boolean>) => {
      state.snap = action.payload;
    },
    setSnapSize: (state, action: PayloadAction<number>) => {
      state.snapSize = action.payload;
    },
    setModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },
    setSubObjectSelectionMode: (state, action: PayloadAction<SelectionMode>) => {
      state.subObjectSelectionMode = action.payload;
    },
    setCurrentSubObjectType: (state, action: PayloadAction<SubObjectType>) => {
      state.currentSubObjectType = action.payload;
    },
    initializeMeshEditData: (state, action: PayloadAction<MeshEditData>) => {
      state.meshEditData[action.payload.modelId] = action.payload;
    },
    selectSubObjects: (state, action: PayloadAction<SelectSubObjectPayload>) => {
      const { modelId, type, indices, mode } = action.payload;
      const meshData = state.meshEditData[modelId];
      
      if (!meshData) return;
      
      const targetArray = type === 'vertex' ? meshData.vertices : 
                         type === 'edge' ? meshData.edges : 
                         meshData.faces;
      
      if (mode === 'set') {
        // Clear all selections first
        targetArray.forEach(item => item.selected = false);
        // Then select specified indices
        indices.forEach(index => {
          if (targetArray[index]) {
            targetArray[index].selected = true;
          }
        });
      } else if (mode === 'add') {
        indices.forEach(index => {
          if (targetArray[index]) {
            targetArray[index].selected = true;
          }
        });
      } else if (mode === 'remove') {
        indices.forEach(index => {
          if (targetArray[index]) {
            targetArray[index].selected = false;
          }
        });
      }
    },
    clearMeshEditData: (state, action: PayloadAction<string>) => {
      delete state.meshEditData[action.payload];
    },
  },
});

export const { 
  setActiveTool, 
  setEditMode,
  toggleSidebar, 
  toggleEditor, 
  toggleHierarchyPanel,
  toggleAnimationPanel,
  setGrid, 
  setWireframe, 
  setSnap,
  setSnapSize,
  setModalOpen,
  setSubObjectSelectionMode,
  setCurrentSubObjectType,
  initializeMeshEditData,
  selectSubObjects,
  clearMeshEditData
} = uiSlice.actions;
export default uiSlice.reducer;
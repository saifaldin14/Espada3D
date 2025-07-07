import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, ToolType, EditMode, SelectionMode, SubObjectType, SelectSubObjectPayload, MeshEditData, GeometryData } from '../../types';

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
  geometryCache: {},
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
      
      // Update selection in mesh data if it exists
      const meshData = state.meshEditData[modelId];
      if (meshData) {
        // Create new arrays with updated selection states instead of mutating
        if (type === 'vertex') {
          meshData.vertices = meshData.vertices.map((vertex, index) => {
            const shouldSelect = indices.includes(index);
            if (mode === 'set') {
              return { ...vertex, selected: shouldSelect };
            } else if (mode === 'add' && shouldSelect) {
              return { ...vertex, selected: true };
            } else if (mode === 'remove' && shouldSelect) {
              return { ...vertex, selected: false };
            }
            return vertex;
          });
        } else if (type === 'edge') {
          meshData.edges = meshData.edges.map((edge, index) => {
            const shouldSelect = indices.includes(index);
            if (mode === 'set') {
              return { ...edge, selected: shouldSelect };
            } else if (mode === 'add' && shouldSelect) {
              return { ...edge, selected: true };
            } else if (mode === 'remove' && shouldSelect) {
              return { ...edge, selected: false };
            }
            return edge;
          });
        } else if (type === 'face') {
          meshData.faces = meshData.faces.map((face, index) => {
            const shouldSelect = indices.includes(index);
            if (mode === 'set') {
              return { ...face, selected: shouldSelect };
            } else if (mode === 'add' && shouldSelect) {
              return { ...face, selected: true };
            } else if (mode === 'remove' && shouldSelect) {
              return { ...face, selected: false };
            }
            return face;
          });
        }
      }
    },
    clearMeshEditData: (state, action: PayloadAction<string>) => {
      delete state.meshEditData[action.payload];
    },
    setGeometryCache: (state, action: PayloadAction<GeometryData>) => {
      state.geometryCache[action.payload.modelId] = action.payload;
    },
    clearGeometryCache: (state, action: PayloadAction<string>) => {
      delete state.geometryCache[action.payload];
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
  clearMeshEditData,
  setGeometryCache,
  clearGeometryCache,
} = uiSlice.actions;
export default uiSlice.reducer;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, ToolType, EditMode, SelectionMode, SubObjectType } from '../../types';
import { EditModes } from '../../Enums';

const initialState: UIState = {
  activeTool: 'translate',
  editMode: EditModes.model,
  isSidebarOpen: true,
  isEditorOpen: true,
  showGrid: true,
  showWireframe: false,
  isModalOpen: false,
  isHierarchyPanelOpen: false,
  isAnimationPanelOpen: false,
  isNodeEditorOpen: false,
  snap: false,
  snapSize: 0.5,
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
    toggleNodeEditor: (state) => {
      state.isNodeEditorOpen = !state.isNodeEditorOpen;
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
  },
});

export const { 
  setActiveTool, 
  setEditMode,
  toggleSidebar, 
  toggleEditor, 
  toggleHierarchyPanel,
  toggleAnimationPanel,
  toggleNodeEditor,
  setGrid, 
  setWireframe, 
  setSnap,
  setSnapSize,
  setModalOpen,
  setSubObjectSelectionMode,
  setCurrentSubObjectType,
} = uiSlice.actions;
export default uiSlice.reducer;
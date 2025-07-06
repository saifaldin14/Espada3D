import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, ToolType } from '../../types';

const initialState: UIState = {
  activeTool: 'translate',
  isSidebarOpen: true,
  isEditorOpen: true,
  showGrid: true,
  showWireframe: false,
  isModalOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<ToolType>) => {
      state.activeTool = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleEditor: (state) => {
      state.isEditorOpen = !state.isEditorOpen;
    },
    setGrid: (state, action: PayloadAction<boolean>) => {
      state.showGrid = action.payload;
    },
    setWireframe: (state, action: PayloadAction<boolean>) => {
      state.showWireframe = action.payload;
    },
    setModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },
  },
});

export const { setActiveTool, toggleSidebar, toggleEditor, setGrid, setWireframe, setModalOpen } = uiSlice.actions;
export default uiSlice.reducer;
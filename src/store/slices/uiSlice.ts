import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeTool: 'translate' | 'rotate' | 'scale'; // Can store the current tool like 'translate', 'rotate', etc.
  isSidebarOpen: boolean;    // Toggle the visibility of the sidebar
  isEditorOpen: boolean;     // Toggle the visibility of the model editor
  showGrid: boolean;       // Toggle the visibility of the grid
  showWireframe: boolean;   // Toggle for wireframe view
}

const initialState: UIState = {
  activeTool: 'translate',  // Default tool set to 'translate'
  isSidebarOpen: true,
  isEditorOpen: true,
  showGrid: true,
  showWireframe: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<'translate' | 'rotate' | 'scale'>) => {
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
  },
});

export const { setActiveTool, toggleSidebar, toggleEditor, setGrid, setWireframe } = uiSlice.actions;
export default uiSlice.reducer;
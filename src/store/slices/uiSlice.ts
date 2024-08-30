import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  activeTool: string | null; // Can store the current tool like 'translate', 'rotate', etc.
  isSidebarOpen: boolean;    // Toggle the visibility of the sidebar
  isEditorOpen: boolean;     // Toggle the visibility of the model editor
}

const initialState: UIState = {
  activeTool: null,
  isSidebarOpen: true,
  isEditorOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTool: (state, action: PayloadAction<string | null>) => {
      state.activeTool = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleEditor: (state) => {
      state.isEditorOpen = !state.isEditorOpen;
    },
  },
});

export const { setActiveTool, toggleSidebar, toggleEditor } = uiSlice.actions;

export default uiSlice.reducer;

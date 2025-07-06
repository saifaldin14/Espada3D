import React from "react";
import Canvas3D from "./components/Main/Canvas3D";
import Sidebar from "./components/Sidebar/Sidebar";
import ModelEditor from "./components/ModelEditor/ModelEditor";
import EditorToolbar from "./components/ModelEditor/EditorToolbar";
import HierarchyPanel from "./components/ModelEditor/HierarchyPanel";
import AnimationPanel from "./components/ModelEditor/AnimationPanel";
import MeshEditingKeyboardShortcuts from "./components/Main/MeshEditingKeyboardShortcuts";
import ErrorBoundary from "./components/ErrorBoundary";
import { Provider } from "react-redux";
import store from "./store";
import { ModelProvider } from "./components/Main/ModelContext";
import { useAppSelector } from "./hooks/useRedux";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { modernTheme } from "./config/theme";

const AppContent: React.FC = () => {
  const isHierarchyPanelOpen = useAppSelector(
    (state) => state.ui.isHierarchyPanelOpen
  );
  const isAnimationPanelOpen = useAppSelector(
    (state) => state.ui.isAnimationPanelOpen
  );

  return (
    <Box sx={styles.container} className="fade-in">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>

      <Box sx={styles.mainContent}>
        <ErrorBoundary>
          <EditorToolbar />
        </ErrorBoundary>

        <Box sx={styles.canvasContainer}>
          <ErrorBoundary>
            <Canvas3D />
          </ErrorBoundary>
        </Box>
      </Box>

      <ErrorBoundary>
        <ModelProvider selectedModel={null}>
          <ModelEditor />
        </ModelProvider>
      </ErrorBoundary>

      {isHierarchyPanelOpen && (
        <ErrorBoundary>
          <HierarchyPanel isOpen={isHierarchyPanelOpen} />
        </ErrorBoundary>
      )}

      {isAnimationPanelOpen && (
        <ErrorBoundary>
          <AnimationPanel isOpen={isAnimationPanelOpen} />
        </ErrorBoundary>
      )}

      {/* Global keyboard shortcuts for mesh editing */}
      <MeshEditingKeyboardShortcuts />
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={modernTheme}>
        <CssBaseline />
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
    background: "transparent",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    minWidth: 0,
  },
  canvasContainer: {
    flex: 1,
    display: "flex",
    position: "relative",
    minHeight: 0,
  },
};

export default App;

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

const AppContent: React.FC = () => {
  const isHierarchyPanelOpen = useAppSelector(
    (state) => state.ui.isHierarchyPanelOpen
  );
  const isAnimationPanelOpen = useAppSelector(
    (state) => state.ui.isAnimationPanelOpen
  );

  return (
    <div style={styles.container}>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>

      <div style={styles.mainContent}>
        <ErrorBoundary>
          <EditorToolbar />
        </ErrorBoundary>

        <div style={styles.canvasContainer}>
          <ErrorBoundary>
            <Canvas3D />
          </ErrorBoundary>
        </div>
      </div>

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
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Provider>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
  },
  canvasContainer: {
    flex: 1,
    display: "flex",
  },
};

export default App;

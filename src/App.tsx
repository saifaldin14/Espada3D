import React from "react";
import Canvas3D from "./components/Main/Canvas3D";
import Sidebar from "./components/Sidebar/Sidebar";
import ModelEditor from "./components/ModelEditor/ModelEditor";
import ErrorBoundary from "./components/ErrorBoundary";
import { Provider } from "react-redux";
import store from "./store";
import { Group } from "three";
import { ModelProvider } from "./components/Main/ModelContext";
import { useAppSelector } from "./hooks/useRedux";

const AppContent: React.FC = () => {
  const selectedModel = useAppSelector(
    (state) => state.models.selectedModelId
  ) as Group | null;

  return (
    <div style={styles.container}>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>

      <div style={styles.mainContent}>
        <ErrorBoundary>
          <Canvas3D selectedModel={selectedModel} />
        </ErrorBoundary>
      </div>

      <ErrorBoundary>
        <ModelProvider selectedModel={selectedModel}>
          <ModelEditor />
        </ModelProvider>
      </ErrorBoundary>
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
  },
};

export default App;

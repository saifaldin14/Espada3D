import React from "react";
import Canvas3D from "./components/Main/Canvas3D";
import Sidebar from "./components/Sidebar/Sidebar";
import ModelEditor from "./components/ModelEditor/ModelEditor";
import EditorToolbar from "./components/ModelEditor/EditorToolbar";
import HierarchyPanel from "./components/ModelEditor/HierarchyPanel";
import AnimationPanel from "./components/ModelEditor/AnimationPanel";
import NodeEditor from "./components/NodeEditor/NodeEditor";
import MeshEditingKeyboardShortcuts from "./components/Main/MeshEditingKeyboardShortcuts";
import ErrorBoundary from "./components/ErrorBoundary";
import { ResizablePanel } from "./components/Layout";
import { ModelProvider } from "./components/Main/ModelContext";
import { useAppSelector } from "./hooks/useRedux";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
} from "@mui/material";
import {
  RadioButtonChecked,
  ViewInAr,
} from "@mui/icons-material";
import { modernTheme } from "./config/theme";
import { Z_INDEX } from "./config/constants";

const AppContent: React.FC = () => {
  const ui = useAppSelector((state) => state.ui);
  const modelsCount = useAppSelector((state) => state.models.models.length);

  return (
    <Box sx={styles.appContainer} className="fade-in">
      {/* Application Header */}
      <Box sx={styles.headerRegion}>
        <ErrorBoundary>
          <EditorToolbar />
        </ErrorBoundary>
      </Box>

      {/* Main Workspace */}
      <Box sx={styles.workspaceContainer}>
        {/* Left Sidebar - Resizable */}
        <ResizablePanel
          defaultWidth={240}
          minWidth={180}
          maxWidth={360}
          side="left"
          className="workspace-sidebar-left"
        >
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
        </ResizablePanel>

        {/* Central Viewport */}
        <Box sx={styles.viewportRegion}>
          <Box sx={styles.canvasWrapper}>
            <ErrorBoundary>
              <Canvas3D />
            </ErrorBoundary>
            {/* Viewport overlay info */}
            <Box sx={styles.viewportOverlay}>
              <Box sx={styles.viewportCornerInfo}>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 500 }}
                >
                  Perspective View
                </Typography>
              </Box>
              <Box sx={styles.viewportTopRight}>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}
                >
                  Objects: {modelsCount}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Properties Panel - Resizable */}
        <ResizablePanel
          defaultWidth={240}
          minWidth={180}
          maxWidth={300}
          side="right"
          className="workspace-sidebar-right"
        >
          <ErrorBoundary>
            <ModelProvider selectedModel={null}>
              <ModelEditor />
            </ModelProvider>
          </ErrorBoundary>
        </ResizablePanel>
      </Box>

      {/* Floating Panels */}
      {ui.isHierarchyPanelOpen && (
        <Box sx={styles.hierarchyPanel}>
          <ErrorBoundary>
            <HierarchyPanel isOpen={ui.isHierarchyPanelOpen} />
          </ErrorBoundary>
        </Box>
      )}

      {ui.isAnimationPanelOpen && (
        <Box sx={styles.animationPanel}>
          <ErrorBoundary>
            <AnimationPanel isOpen={ui.isAnimationPanelOpen} />
          </ErrorBoundary>
        </Box>
      )}

      {ui.isNodeEditorOpen && (
        <ErrorBoundary>
          <NodeEditor isOpen={ui.isNodeEditorOpen} />
        </ErrorBoundary>
      )}

      {/* Status Bar */}
      <Box sx={styles.statusBar}>
        <Box sx={styles.statusLeft}>
          <Box sx={styles.statusItem}>
            <RadioButtonChecked
              sx={{ color: "#43e97b", fontSize: 12, mr: 0.5 }}
            />
            Ready
          </Box>
          <Box sx={styles.statusDivider} />
          <Box sx={styles.statusItem}>{ui.editMode || "Object"}</Box>
          <Box sx={styles.statusDivider} />
          <Box sx={styles.statusItem}>{ui.activeTool || "Select"}</Box>
        </Box>
        <Box sx={styles.statusRight}>
          <Box sx={styles.statusItem}>
            <ViewInAr sx={{ mr: 0.5, fontSize: 12, opacity: 0.6 }} />
            SaifEngine v1.0
          </Box>
        </Box>
      </Box>

      {/* Global keyboard shortcuts */}
      <MeshEditingKeyboardShortcuts />
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
    background: "transparent",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  headerRegion: {
    zIndex: Z_INDEX.toolbar,
    position: "sticky" as const,
    top: 0,
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    background: "rgba(10, 10, 15, 0.95)",
    backdropFilter: "blur(20px)",
  },
  workspaceContainer: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    background: "rgba(255, 255, 255, 0.02)",
  },
  viewportRegion: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    minWidth: 0,
    background: "rgba(20, 25, 35, 0.4)",
    position: "relative",
    overflow: "hidden",
  },
  canvasWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(ellipse at center, rgba(20, 30, 50, 0.2) 0%, rgba(10, 15, 25, 0.4) 100%)",
  },
  viewportOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 1,
  },
  viewportCornerInfo: {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    background: "rgba(10, 15, 25, 0.6)",
    backdropFilter: "blur(8px)",
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  viewportTopRight: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(10, 15, 25, 0.6)",
    backdropFilter: "blur(8px)",
    padding: "4px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  hierarchyPanel: {
    position: "fixed" as const,
    top: "80px",
    right: "260px",
    zIndex: Z_INDEX.floatingPanel,
    animation: "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4))",
  },
  animationPanel: {
    position: "fixed" as const,
    top: "120px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: Z_INDEX.floatingPanel,
    animation: "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4))",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "28px",
    padding: "0 16px",
    background: "rgba(10, 10, 15, 0.95)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    fontSize: "0.7rem",
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: 500,
    userSelect: "none",
    zIndex: Z_INDEX.statusBar,
    position: "relative" as const,
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.7rem",
    whiteSpace: "nowrap",
  },
  statusDivider: {
    width: "1px",
    height: "12px",
    background: "rgba(255, 255, 255, 0.12)",
  },
};

export default App;

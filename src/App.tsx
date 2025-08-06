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
import { Provider } from "react-redux";
import store from "./store";
import { ModelProvider } from "./components/Main/ModelContext";
import { useAppSelector } from "./hooks/useRedux";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Chip,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Settings,
  ZoomIn,
  CameraAlt,
  RadioButtonChecked,
  Speed,
  ViewInAr,
} from "@mui/icons-material";
import { modernTheme } from "./config/theme";

const AppContent: React.FC = () => {
  const isHierarchyPanelOpen = useAppSelector(
    (state) => state.ui.isHierarchyPanelOpen
  );
  const isAnimationPanelOpen = useAppSelector(
    (state) => state.ui.isAnimationPanelOpen
  );
  const isNodeEditorOpen = useAppSelector((state) => state.ui.isNodeEditorOpen);

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
          <Box sx={styles.viewportHeader}>
            <Box sx={styles.viewportTitle}>
              <ViewInAr sx={styles.viewportIcon} />
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 600 }}
              >
                3D Viewport
              </Typography>
              <Chip size="small" label="Active" sx={styles.activeChip} />
            </Box>
            <Box sx={styles.viewportControls}>
              <Box sx={styles.viewportInfo}>
                Objects: {useAppSelector((state) => state.models.models.length)}
              </Box>
              <Box sx={styles.viewportActions}>
                <Tooltip title="Viewport Settings">
                  <IconButton size="small" sx={styles.viewportActionButton}>
                    <Settings fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Controls">
                  <IconButton size="small" sx={styles.viewportActionButton}>
                    <ZoomIn fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Camera Settings">
                  <IconButton size="small" sx={styles.viewportActionButton}>
                    <CameraAlt fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
          <Box sx={styles.canvasWrapper}>
            <ErrorBoundary>
              <Canvas3D />
            </ErrorBoundary>
            {/* Viewport overlay info */}
            <Box sx={styles.viewportOverlay}>
              <Box sx={styles.viewportCornerInfo}>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.7)", fontWeight: 500 }}
                >
                  Perspective View
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
      {isHierarchyPanelOpen && (
        <Box sx={{ ...styles.floatingPanel, ...styles.hierarchyPanel }}>
          <ErrorBoundary>
            <HierarchyPanel isOpen={isHierarchyPanelOpen} />
          </ErrorBoundary>
        </Box>
      )}

      {isAnimationPanelOpen && (
        <Box sx={{ ...styles.floatingPanel, ...styles.animationPanel }}>
          <ErrorBoundary>
            <AnimationPanel isOpen={isAnimationPanelOpen} />
          </ErrorBoundary>
        </Box>
      )}

      {isNodeEditorOpen && (
        <Box sx={{ ...styles.floatingPanel, ...styles.nodeEditorPanel }}>
          <ErrorBoundary>
            <NodeEditor isOpen={isNodeEditorOpen} />
          </ErrorBoundary>
        </Box>
      )}

      {/* Status Bar */}
      <Box sx={styles.statusBar}>
        <Box sx={styles.statusLeft}>
          <Box sx={styles.statusItem}>
            <RadioButtonChecked
              sx={{ color: "#43e97b", fontSize: 16, mr: 1 }}
            />
            Ready
          </Box>
          <Box sx={styles.statusItem}>
            Mode: {useAppSelector((state) => state.ui.editMode || "Object")}
          </Box>
          <Box sx={styles.statusItem}>
            Tool: {useAppSelector((state) => state.ui.activeTool || "Select")}
          </Box>
        </Box>
        <Box sx={styles.statusRight}>
          <Box sx={styles.statusItem}>
            <Speed sx={{ mr: 0.5, fontSize: 14 }} />
            FPS: 60
          </Box>
          <Box sx={styles.statusItem}>
            Tris:{" "}
            {(
              useAppSelector((state) => state.models.models.length) * 1200
            ).toLocaleString()}
          </Box>
          <Box sx={styles.statusItem}>
            Verts:{" "}
            {(
              useAppSelector((state) => state.models.models.length) * 800
            ).toLocaleString()}
          </Box>
          <Box sx={styles.statusItem}>
            <ViewInAr sx={{ mr: 0.5, fontSize: 14 }} />
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
    zIndex: 1000,
    position: "sticky" as const,
    top: 0,
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
  viewportHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    background:
      "linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(15, 25, 35, 0.2) 100%)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(10px)",
  },
  viewportTitle: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "1.1rem",
    letterSpacing: "0.5px",
  },
  viewportIcon: {
    fontSize: 22,
    color: "#00c9ff",
    filter: "drop-shadow(0 0 8px rgba(0, 255, 255, 0.3))",
  },
  viewportControls: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  viewportActions: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: "4px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  viewportActionButton: {
    color: "rgba(255, 255, 255, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "6px",
    padding: "6px",
    transition: "all 0.2s ease",
    "&:hover": {
      color: "#00c9ff",
      backgroundColor: "rgba(0, 201, 255, 0.1)",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
  },
  viewportInfo: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "0.875rem",
    fontWeight: 500,
    background: "rgba(255, 255, 255, 0.05)",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    letterSpacing: "0.3px",
  },
  activeChip: {
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "rgba(0, 0, 0, 0.8)",
    fontWeight: 600,
    fontSize: "0.7rem",
    height: "20px",
    boxShadow: "0 2px 8px rgba(56, 249, 215, 0.3)",
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
    bottom: "16px",
    left: "16px",
    background: "rgba(10, 15, 25, 0.7)",
    backdropFilter: "blur(10px)",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  floatingPanel: {
    position: "absolute" as const,
    top: "120px",
    right: "420px",
    zIndex: 500,
    animation: "slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))",
  },
  hierarchyPanel: {
    top: "120px",
    right: "420px",
  },
  animationPanel: {
    top: "160px",
    right: "840px",
  },
  nodeEditorPanel: {
    top: "120px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80vw",
    height: "70vh",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "36px",
    padding: "0 20px",
    background:
      "linear-gradient(90deg, rgba(10, 10, 15, 0.95) 0%, rgba(15, 20, 30, 0.9) 100%)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: 500,
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  statusRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  statusItem: {
    padding: "6px 10px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    fontWeight: 500,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    fontSize: "0.75rem",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.08)",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
    },
  },
};

export default App;

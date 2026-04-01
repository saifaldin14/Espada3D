import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  PlayArrow,
  Stop,
  Close,
  Fullscreen,
  FullscreenExit,
  Minimize,
  AspectRatio,
} from "@mui/icons-material";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import {
  Node,
  NodeType,
  NodeData,
  Position,
  NODE_REGISTRY,
} from "../../types/nodeTypes";
import NodeCanvas from "./NodeCanvas";
import NodeLibrary from "./NodeLibrary";
import NodeProperties from "./NodeProperties";
import {
  addNode,
  connectNodes,
  disconnectNodes,
  updateNodePosition,
  updateNodeData,
  updateNodeSize,
  setSelectedNode,
  setExecuting,
  setNodeExecutionResult,
  selectNodesInArea,
  deleteSelectedNodes,
  duplicateSelectedNodes,
  copySelectedToClipboard,
  pasteFromClipboard,
  alignSelectedNodes,
  distributeSelectedNodes,
} from "../../store/slices/nodeSlice";
import { toggleNodeEditor } from "../../store/slices/uiSlice";
import { createNodeExecutor } from "../../utils/nodeExecutor";

interface NodeEditorProps {
  isOpen: boolean;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ isOpen }) => {
  const dispatch = useAppDispatch();
  const { nodes, connections, selectedNodeId, isExecuting } = useAppSelector(
    (state) => state.nodes
  );
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [editorSize, setEditorSize] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize default size
  useEffect(() => {
    if (isOpen && editorSize.width === 0) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Calculate optimal size - more conservative to prevent cutoff
      // Account for panels: sidebar (220px) + properties (280px when shown) + margins
      // Also account for top nav bar (estimated ~60-80px)
      const topNavHeight = 80;
      const optimalWidth = Math.max(800, Math.min(1100, windowWidth * 0.75));
      const optimalHeight = Math.max(
        600,
        Math.min(750, (windowHeight - topNavHeight) * 0.8)
      );

      setEditorSize({
        width: optimalWidth,
        height: optimalHeight,
        x: Math.max(10, (windowWidth - optimalWidth) / 2),
        y: Math.max(
          topNavHeight + 10,
          (windowHeight - optimalHeight) / 2 + topNavHeight / 2
        ),
      });
    }
  }, [isOpen, editorSize.width]);

  const handleNodeDragStart = useCallback((nodeType: NodeType) => {
    setDraggedNodeType(nodeType);
  }, []);

  const handleClose = useCallback(() => {
    dispatch(toggleNodeEditor());
  }, [dispatch]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setIsMinimized(false);
    }
  }, [isFullscreen]);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  // Handle window dragging
  const handleHeaderMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (isFullscreen) return;
      if ((event.target as HTMLElement).closest("button")) return; // Don't drag when clicking buttons

      setIsDragging(true);
      setDragStart({
        x: event.clientX - editorSize.x,
        y: event.clientY - editorSize.y,
      });
    },
    [isFullscreen, editorSize]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isDragging) {
        setEditorSize((prev) => ({
          ...prev,
          x: event.clientX - dragStart.x,
          y: event.clientY - dragStart.y,
        }));
      } else if (isResizing && resizeHandle) {
        const deltaX = event.movementX;
        const deltaY = event.movementY;

        setEditorSize((prev) => {
          let newSize = { ...prev };

          if (resizeHandle.includes("right")) {
            newSize.width = Math.max(600, prev.width + deltaX);
          }
          if (resizeHandle.includes("left")) {
            const newWidth = Math.max(600, prev.width - deltaX);
            if (newWidth > 600) {
              newSize.width = newWidth;
              newSize.x = prev.x + deltaX;
            }
          }
          if (resizeHandle.includes("bottom")) {
            newSize.height = Math.max(400, prev.height + deltaY);
          }
          if (resizeHandle.includes("top")) {
            const newHeight = Math.max(400, prev.height - deltaY);
            if (newHeight > 400) {
              newSize.height = newHeight;
              newSize.y = prev.y + deltaY;
            }
          }

          return newSize;
        });
      }
    },
    [isDragging, isResizing, resizeHandle, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback(
    (handle: string) => (event: React.MouseEvent) => {
      if (isFullscreen) return;
      event.stopPropagation();
      setIsResizing(true);
      setResizeHandle(handle);
    },
    [isFullscreen]
  );

  const handleCanvasDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedNodeType || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - viewportOffset.x) / zoom;
      const y = (event.clientY - rect.top - viewportOffset.y) / zoom;

      const newNode: Omit<Node, "id"> = {
        type: draggedNodeType,
        position: { x, y },
        data: getDefaultNodeData(draggedNodeType),
        inputs: getNodeInputs(draggedNodeType),
        outputs: getNodeOutputs(draggedNodeType),
      };

      dispatch(addNode(newNode));
      setDraggedNodeType(null);
    },
    [draggedNodeType, viewportOffset, zoom, dispatch]
  );

  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      dispatch(setSelectedNode(nodeId));
    },
    [dispatch]
  );

  const handleNodeDelete = useCallback(() => {
    dispatch(deleteSelectedNodes());
  }, [dispatch]);

  const handleNodeDuplicate = useCallback(() => {
    dispatch(duplicateSelectedNodes({ offsetX: 30, offsetY: 30 }));
  }, [dispatch]);

  const handleCopy = useCallback(() => {
    dispatch(copySelectedToClipboard());
  }, [dispatch]);

  const handlePaste = useCallback(() => {
    dispatch(pasteFromClipboard({ offsetX: 30, offsetY: 30 }));
  }, [dispatch]);

  const handleAddNode = useCallback(
    (nodeType: NodeType, position: Position) => {
      const newNode: Omit<Node, "id"> = {
        type: nodeType,
        position,
        data: getDefaultNodeData(nodeType),
        inputs: getNodeInputs(nodeType),
        outputs: getNodeOutputs(nodeType),
      };

      dispatch(addNode(newNode));
    },
    [dispatch]
  );

  const handleSelectArea = useCallback(
    (area: { x1: number; y1: number; x2: number; y2: number }) => {
      dispatch(selectNodesInArea(area));
    },
    [dispatch]
  );

  const handleAlign = useCallback(
    (
      alignment:
        | "left"
        | "right"
        | "top"
        | "bottom"
        | "center-horizontal"
        | "center-vertical"
    ) => {
      dispatch(alignSelectedNodes(alignment));
    },
    [dispatch]
  );

  const handleDistribute = useCallback(
    (direction: "horizontal" | "vertical") => {
      dispatch(distributeSelectedNodes(direction));
    },
    [dispatch]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete key
      if (event.key === "Delete" || event.key === "Backspace") {
        handleNodeDelete();
      }
      // Ctrl/Cmd + D for duplicate
      else if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        handleNodeDuplicate();
      }
      // Ctrl/Cmd + C for copy
      else if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        event.preventDefault();
        handleCopy();
      }
      // Ctrl/Cmd + V for paste
      else if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        handlePaste();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleNodeDelete, handleNodeDuplicate, handleCopy, handlePaste]);

  const handleNodeResize = useCallback(
    (nodeId: string, width: number, height: number) => {
      dispatch(updateNodeSize({ nodeId, width, height }));
    },
    [dispatch]
  );

  const handleExecute = useCallback(async () => {
    dispatch(setExecuting(true));

    try {
      const executor = createNodeExecutor(nodes, connections);
      const results = await executor.executeGraph();

      // Store execution results
      Object.values(results).forEach((result) => {
        dispatch(setNodeExecutionResult(result));
      });
    } catch (error) {
      console.error("Node execution failed:", error);
    } finally {
      dispatch(setExecuting(false));
    }
  }, [nodes, connections, dispatch]);

  // Auto-execute the node graph when node data or connections change
  const autoExecuteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesDataFingerprint = useMemo(() => {
    return JSON.stringify(nodes.map(n => ({ id: n.id, type: n.type, data: n.data })));
  }, [nodes]);
  const connectionsFingerprint = useMemo(() => {
    return JSON.stringify(connections.map(c => ({ s: c.sourceNodeId, t: c.targetNodeId, sp: c.sourcePort, tp: c.targetPort })));
  }, [connections]);

  useEffect(() => {
    if (!isOpen || nodes.length === 0) return;
    // Debounce auto-execution to avoid rapid re-runs
    if (autoExecuteTimeoutRef.current) {
      clearTimeout(autoExecuteTimeoutRef.current);
    }
    autoExecuteTimeoutRef.current = setTimeout(() => {
      handleExecute();
    }, 500);
    return () => {
      if (autoExecuteTimeoutRef.current) {
        clearTimeout(autoExecuteTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleExecute excluded to prevent double-trigger (it depends on nodes/connections which are already tracked via fingerprints)
  }, [nodesDataFingerprint, connectionsFingerprint, isOpen]);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  if (!isOpen) return null;

  const containerStyle = isFullscreen
    ? styles.containerFullscreen
    : isMinimized
      ? styles.containerMinimized
      : {
          ...styles.containerWindowed,
          width: editorSize.width,
          height: editorSize.height,
          left: editorSize.x,
          top: editorSize.y,
        };

  return (
    <Box ref={editorRef} sx={containerStyle}>
      {/* Resize Handles */}
      {!isFullscreen && !isMinimized && (
        <>
          <Box
            sx={styles.resizeHandleTop}
            onMouseDown={handleResizeStart("top")}
          />
          <Box
            sx={styles.resizeHandleRight}
            onMouseDown={handleResizeStart("right")}
          />
          <Box
            sx={styles.resizeHandleBottom}
            onMouseDown={handleResizeStart("bottom")}
          />
          <Box
            sx={styles.resizeHandleLeft}
            onMouseDown={handleResizeStart("left")}
          />
          <Box
            sx={styles.resizeHandleTopLeft}
            onMouseDown={handleResizeStart("top-left")}
          />
          <Box
            sx={styles.resizeHandleTopRight}
            onMouseDown={handleResizeStart("top-right")}
          />
          <Box
            sx={styles.resizeHandleBottomLeft}
            onMouseDown={handleResizeStart("bottom-left")}
          />
          <Box
            sx={styles.resizeHandleBottomRight}
            onMouseDown={handleResizeStart("bottom-right")}
          />
        </>
      )}

      {/* Header */}
      <Box
        sx={{
          ...styles.header,
          cursor: isFullscreen ? "default" : "move",
        }}
        onMouseDown={handleHeaderMouseDown}
      >
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>
          Node Editor
        </Typography>
        <Box sx={styles.headerActions}>
          <Tooltip title={isExecuting ? "Running..." : "Execute Graph"}>
            <IconButton
              onClick={handleExecute}
              disabled={isExecuting}
              sx={{
                ...styles.actionButton,
                ...(isExecuting ? {} : {
                  backgroundColor: "rgba(67, 233, 123, 0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(67, 233, 123, 0.2)",
                    color: "#43e97b",
                  },
                }),
              }}
            >
              {isExecuting ? <Stop fontSize="small" /> : <PlayArrow fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Selected">
            <span>
              <IconButton
                onClick={handleNodeDelete}
                disabled={!selectedNodeId}
                sx={styles.actionButton}
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ width: "1px", height: 20, background: "rgba(255,255,255,0.1)", mx: 0.5 }} />

          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton
              onClick={handleToggleFullscreen}
              sx={styles.actionButton}
              size="small"
            >
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={isMinimized ? "Restore" : "Minimize"}>
            <IconButton onClick={handleToggleMinimize} sx={styles.actionButton} size="small">
              {isMinimized ? <AspectRatio fontSize="small" /> : <Minimize fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={handleClose} sx={{
              ...styles.actionButton,
              "&:hover": {
                backgroundColor: "rgba(244, 67, 54, 0.15)",
                color: "#f44336",
              },
            }} size="small">
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Content */}
      {!isMinimized && (
        <Box sx={isFullscreen ? styles.contentFullscreen : styles.content}>
          {/* Node Library */}
          <Box sx={styles.sidebar}>
            <NodeLibrary onNodeDragStart={handleNodeDragStart} />
          </Box>

          {/* Canvas */}
          <Box
            sx={styles.canvasContainer}
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
          >
            <NodeCanvas
              nodes={nodes}
              connections={connections}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
              onNodeMove={(nodeId, position) =>
                dispatch(updateNodePosition({ nodeId, position }))
              }
              onNodeResize={handleNodeResize}
              onConnect={(sourceId, targetId, sourcePort, targetPort) =>
                dispatch(
                  connectNodes({ sourceId, targetId, sourcePort, targetPort })
                )
              }
              onDisconnect={(connectionId) =>
                dispatch(disconnectNodes(connectionId))
              }
              onDataChange={(nodeId, data) =>
                dispatch(updateNodeData({ nodeId, data }))
              }
              viewportOffset={viewportOffset}
              zoom={zoom}
              onViewportChange={setViewportOffset}
              onZoomChange={setZoom}
              onAddNode={handleAddNode}
              onSelectArea={handleSelectArea}
              onAlign={handleAlign}
              onDistribute={handleDistribute}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onDuplicate={handleNodeDuplicate}
              onDelete={handleNodeDelete}
            />
          </Box>

          {/* Properties Panel */}
          {selectedNode && (
            <Box sx={styles.propertiesPanel}>
              <NodeProperties
                node={selectedNode}
                onUpdateData={(data) =>
                  dispatch(updateNodeData({ nodeId: selectedNode.id, data }))
                }
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// Helper functions
const getDefaultNodeData = (type: NodeType): NodeData => {
  switch (type) {
    case "input":
      return { value: 0, name: "Input" };
    case "color":
      return { value: "#ffffff", name: "Color" };
    case "output":
      return { name: "Output" };
    case "math":
      return { operation: "add", valueA: 0, valueB: 0 };
    case "transform":
      return { transformType: "translate", value: [0, 0, 0] };
    case "material":
      return { materialType: "standard", color: "#ffffff", roughness: 0.5 };
    case "geometry":
      return { geometryType: "box", dimensions: [1, 1, 1] };
    case "mesh":
      return { meshSource: "geometry", subdivision: 0 };
    case "texture":
      return { textureSource: "file", textureType: "diffuse", textureFile: "" };
    case "light":
      return { lightType: "directional", intensity: 1.0, castShadows: true };
    case "camera":
      return { cameraType: "perspective", fov: 75, near: 0.1, far: 1000 };
    case "script":
      return { scriptContent: "", scriptLanguage: "javascript" };
    case "filter":
      return { filterType: "blur", strength: 1.0 };
    case "condition":
      return { condition: "equals", value: 0 };
    case "numberSlider":
      return { value: 0.5, min: 0, max: 1 };
    case "booleanToggle":
      return { value: true };
    case "point":
      return { value: [0, 0, 0] };
    case "list":
      return { value: [] };
    case "watch":
      return {};
    case "sequence":
      return { start: 0, end: 10, step: 1 };
    default:
      return {};
  }
};

const getNodeInputs = (type: NodeType): string[] => {
  const entry = NODE_REGISTRY[type];
  if (entry) return entry.inputs.map(p => p.name);
  return [];
};

const getNodeOutputs = (type: NodeType): string[] => {
  const entry = NODE_REGISTRY[type];
  if (entry) return entry.outputs.map(p => p.name);
  return [];
};

const styles = {
  containerFullscreen: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "rgba(15, 20, 30, 0.98)",
    backdropFilter: "blur(10px)",
    border: "none",
    borderRadius: 0,
    overflow: "hidden",
    zIndex: 10000,
  },
  containerMinimized: {
    position: "fixed" as const,
    bottom: 20,
    right: 20,
    width: 320,
    height: 56,
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "rgba(20, 25, 35, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    borderRadius: "10px",
    overflow: "hidden",
    zIndex: 900,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  },
  containerWindowed: {
    position: "fixed" as const,
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "rgba(20, 25, 35, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    borderRadius: "12px",
    overflow: "hidden",
    zIndex: 900,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
  },
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    backgroundColor: "rgba(20, 25, 35, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    background:
      "linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)",
    borderBottom: "1px solid rgba(102, 126, 234, 0.15)",
    userSelect: "none" as const,
    cursor: "move",
  },
  headerActions: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  actionButton: {
    color: "rgba(255, 255, 255, 0.8)",
    padding: "5px",
    transition: "all 0.2s ease",
    borderRadius: "6px",
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.15)",
      color: "#667eea",
    },
    "&:disabled": {
      color: "rgba(255, 255, 255, 0.25)",
    },
  },
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    minHeight: 0,
    height: "100%",
  },
  contentFullscreen: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    minHeight: 0,
    height: "calc(100vh - 60px)", // Account for header
  },
  sidebar: {
    width: "200px",
    minWidth: "180px",
    maxWidth: "250px",
    backgroundColor: "rgba(20, 25, 35, 0.95)",
    borderRight: "1px solid rgba(102, 126, 234, 0.2)",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0,
    flex: "0 0 200px",
    height: "100%",
    overflow: "auto",
  },
  canvasContainer: {
    flex: 1,
    position: "relative" as const,
    overflow: "hidden",
    backgroundColor: "rgba(15, 20, 30, 0.98)",
    minWidth: 0,
  },
  propertiesPanel: {
    width: "260px",
    minWidth: "240px",
    maxWidth: "300px",
    backgroundColor: "rgba(20, 25, 35, 0.95)",
    borderLeft: "1px solid rgba(102, 126, 234, 0.2)",
    overflow: "auto",
    flex: "0 0 260px",
  },
  // Resize handles
  resizeHandleTop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    cursor: "ns-resize",
    zIndex: 10,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.5)",
    },
  },
  resizeHandleRight: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
    cursor: "ew-resize",
    zIndex: 10,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.5)",
    },
  },
  resizeHandleBottom: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    cursor: "ns-resize",
    zIndex: 10,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.5)",
    },
  },
  resizeHandleLeft: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    cursor: "ew-resize",
    zIndex: 10,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.5)",
    },
  },
  resizeHandleTopLeft: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: 12,
    height: 12,
    cursor: "nwse-resize",
    zIndex: 11,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.6)",
    },
  },
  resizeHandleTopRight: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    cursor: "nesw-resize",
    zIndex: 11,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.6)",
    },
  },
  resizeHandleBottomLeft: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    width: 12,
    height: 12,
    cursor: "nesw-resize",
    zIndex: 11,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.6)",
    },
  },
  resizeHandleBottomRight: {
    position: "absolute" as const,
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    cursor: "nwse-resize",
    zIndex: 11,
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.6)",
    },
  },
};

export default NodeEditor;

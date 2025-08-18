import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
} from "@mui/material";
import {
  Add,
  Delete,
  PlayArrow,
  Stop,
  Save,
  FolderOpen,
  ExpandLess,
  ExpandMore,
  Close,
} from "@mui/icons-material";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import {
  Node,
  NodeConnection,
  NodeType,
  NodeData,
} from "../../types/nodeTypes";
import NodeCanvas from "./NodeCanvas";
import NodeLibrary from "./NodeLibrary";
import NodeProperties from "./NodeProperties";
import {
  addNode,
  deleteNode,
  connectNodes,
  disconnectNodes,
  updateNodePosition,
  updateNodeData,
  setSelectedNode,
  setExecuting,
  setNodeExecutionResult,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeDragStart = useCallback((nodeType: NodeType) => {
    setDraggedNodeType(nodeType);
  }, []);

  const handleClose = useCallback(() => {
    dispatch(toggleNodeEditor());
  }, [dispatch]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

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
    if (selectedNodeId) {
      dispatch(deleteNode(selectedNodeId));
    }
  }, [selectedNodeId, dispatch]);

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

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  if (!isOpen) return null;

  return (
    <Box sx={styles.container}>
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>
          Node Editor
        </Typography>
        <Box sx={styles.headerActions}>
          <Tooltip title="Execute Graph">
            <IconButton
              onClick={handleExecute}
              disabled={isExecuting}
              sx={styles.actionButton}
            >
              {isExecuting ? <Stop /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Selected">
            <IconButton
              onClick={handleNodeDelete}
              disabled={!selectedNodeId}
              sx={styles.actionButton}
            >
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save Graph">
            <IconButton sx={styles.actionButton}>
              <Save />
            </IconButton>
          </Tooltip>
          <Tooltip title="Load Graph">
            <IconButton sx={styles.actionButton}>
              <FolderOpen />
            </IconButton>
          </Tooltip>
          <Tooltip title={isCollapsed ? "Expand" : "Collapse"}>
            <IconButton onClick={handleToggleCollapse} sx={styles.actionButton}>
              {isCollapsed ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={handleClose} sx={styles.actionButton}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
        <Box sx={styles.content}>
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
              onConnect={(sourceId, targetId, sourcePort, targetPort) =>
                dispatch(
                  connectNodes({ sourceId, targetId, sourcePort, targetPort })
                )
              }
              onDisconnect={(connectionId) =>
                dispatch(disconnectNodes(connectionId))
              }
              viewportOffset={viewportOffset}
              zoom={zoom}
              onViewportChange={setViewportOffset}
              onZoomChange={setZoom}
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
      </Collapse>
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
    default:
      return {};
  }
};

const getNodeInputs = (type: NodeType): string[] => {
  switch (type) {
    case "input":
      return [];
    case "color":
      return [];
    case "output":
      return ["value"];
    case "math":
      return ["a", "b"];
    case "transform":
      return ["geometry", "value"];
    case "material":
      return ["color", "roughness", "metalness"];
    case "geometry":
      return ["dimensions"];
    case "mesh":
      return ["geometry", "material"];
    case "texture":
      return [];
    case "light":
      return ["intensity", "color"];
    case "camera":
      return ["fov", "near", "far"];
    case "script":
      return ["input"];
    case "filter":
      return ["input", "strength"];
    case "condition":
      return ["input", "compare"];
    default:
      return [];
  }
};

const getNodeOutputs = (type: NodeType): string[] => {
  switch (type) {
    case "input":
      return ["value"];
    case "color":
      return ["color"];
    case "output":
      return [];
    case "math":
      return ["result"];
    case "transform":
      return ["geometry"];
    case "material":
      return ["material"];
    case "geometry":
      return ["geometry"];
    case "mesh":
      return ["mesh"];
    case "texture":
      return ["texture"];
    case "light":
      return ["light"];
    case "camera":
      return ["camera"];
    case "script":
      return ["output"];
    case "filter":
      return ["output"];
    case "condition":
      return ["true", "false"];
    default:
      return [];
  }
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#252525",
    borderBottom: "1px solid #333",
  },
  headerActions: {
    display: "flex",
    gap: "8px",
  },
  actionButton: {
    color: "#00ccff",
    "&:hover": {
      backgroundColor: "rgba(0, 204, 255, 0.1)",
    },
    "&:disabled": {
      color: "#666",
    },
  },
  content: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  sidebar: {
    width: "200px",
    backgroundColor: "#2a2a2a",
    borderRight: "1px solid #333",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  canvasContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#1e1e1e",
  },
  propertiesPanel: {
    width: "250px",
    backgroundColor: "#2a2a2a",
    borderLeft: "1px solid #333",
    overflow: "auto",
  },
};

export default NodeEditor;

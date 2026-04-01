import React, { useRef, useCallback, useState, useEffect } from "react";
import { Box } from "@mui/material";
import {
  Node,
  NodeConnection,
  Position,
  NodeType,
} from "../../types/nodeTypes";
import NodeComponent from "./NodeComponent";
import ConnectionComponent from "./ConnectionComponent";
import SearchMenu from "./SearchMenu";
import Minimap from "./Minimap";
import CanvasToolbar from "./CanvasToolbar";
import CanvasHelpOverlay from "./CanvasHelpOverlay";

interface NodeCanvasProps {
  nodes: Node[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
  onNodeResize?: (nodeId: string, width: number, height: number) => void;
  onConnect: (
    sourceId: string,
    targetId: string,
    sourcePort: string,
    targetPort: string
  ) => void;
  onDisconnect: (connectionId: string) => void;
  onDataChange?: (nodeId: string, data: Partial<import("../../types/nodeTypes").NodeData>) => void;
  viewportOffset: Position;
  zoom: number;
  onViewportChange: (offset: Position) => void;
  onZoomChange: (zoom: number) => void;
  onAddNode?: (nodeType: NodeType, position: Position) => void;
  onSelectMultiple?: (nodeIds: string[]) => void;
  onSelectArea?: (area: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) => void;
  onAlign?: (
    alignment:
      | "left"
      | "right"
      | "top"
      | "bottom"
      | "center-horizontal"
      | "center-vertical"
  ) => void;
  onDistribute?: (direction: "horizontal" | "vertical") => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const NodeCanvas: React.FC<NodeCanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onNodeSelect,
  onNodeMove,
  onNodeResize,
  onConnect,
  onDisconnect,
  onDataChange,
  viewportOffset,
  zoom,
  onViewportChange,
  onZoomChange,
  onAddNode,
  onSelectMultiple,
  onSelectArea,
  onAlign,
  onDistribute,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Position>({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    port: string;
    position: Position;
  } | null>(null);
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [searchMenuPosition, setSearchMenuPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [boxSelection, setBoxSelection] = useState<{
    start: Position;
    current: Position;
  } | null>(null);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = zoom * delta;
      onZoomChange(Math.max(0.1, Math.min(3, newZoom)));
    },
    [zoom, onZoomChange]
  );

  // Handle canvas panning
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
        // Middle mouse button or Shift+Left click for panning
        event.preventDefault();
        setIsPanning(true);
        setLastPanPoint({ x: event.clientX, y: event.clientY });
      } else if (event.button === 0 && event.target === canvasRef.current) {
        // Left click on empty canvas - start box selection
        if (!event.ctrlKey && !event.metaKey) {
          onNodeSelect("");
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const startPos = {
            x: (event.clientX - rect.left - viewportOffset.x) / zoom,
            y: (event.clientY - rect.top - viewportOffset.y) / zoom,
          };
          setBoxSelection({ start: startPos, current: startPos });
        }
      }
    },
    [onNodeSelect, viewportOffset, zoom]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: (event.clientX - rect.left - viewportOffset.x) / zoom,
          y: (event.clientY - rect.top - viewportOffset.y) / zoom,
        });
      }

      if (isPanning) {
        const deltaX = event.clientX - lastPanPoint.x;
        const deltaY = event.clientY - lastPanPoint.y;

        onViewportChange({
          x: viewportOffset.x + deltaX,
          y: viewportOffset.y + deltaY,
        });

        setLastPanPoint({ x: event.clientX, y: event.clientY });
      } else if (draggedNode) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const newPosition = {
            x:
              (event.clientX - rect.left - viewportOffset.x) / zoom -
              dragOffset.x,
            y:
              (event.clientY - rect.top - viewportOffset.y) / zoom -
              dragOffset.y,
          };
          onNodeMove(draggedNode, newPosition);
        }
      } else if (boxSelection) {
        // Update box selection
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const currentPos = {
            x: (event.clientX - rect.left - viewportOffset.x) / zoom,
            y: (event.clientY - rect.top - viewportOffset.y) / zoom,
          };
          setBoxSelection({ ...boxSelection, current: currentPos });
        }
      }
    },
    [
      isPanning,
      lastPanPoint,
      draggedNode,
      dragOffset,
      viewportOffset,
      zoom,
      onViewportChange,
      onNodeMove,
      boxSelection,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedNode(null);
    setConnectionStart(null);

    // Complete box selection
    if (boxSelection && onSelectArea) {
      const { start, current } = boxSelection;
      onSelectArea({
        x1: start.x,
        y1: start.y,
        x2: current.x,
        y2: current.y,
      });
    }
    setBoxSelection(null);
  }, [boxSelection, onSelectArea]);

  // Node drag handlers
  const handleNodeMouseDown = useCallback(
    (nodeId: string, event: React.MouseEvent, nodePosition: Position) => {
      event.stopPropagation();

      if (event.button === 0) {
        onNodeSelect(nodeId);
        setDraggedNode(nodeId);

        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const clickPosition = {
            x: (event.clientX - rect.left - viewportOffset.x) / zoom,
            y: (event.clientY - rect.top - viewportOffset.y) / zoom,
          };

          setDragOffset({
            x: clickPosition.x - nodePosition.x,
            y: clickPosition.y - nodePosition.y,
          });
        }
      }
    },
    [onNodeSelect, viewportOffset, zoom]
  );

  // Connection handlers
  const handlePortMouseDown = useCallback(
    (nodeId: string, port: string, event: React.MouseEvent) => {
      event.stopPropagation();

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const position = {
          x: (event.clientX - rect.left - viewportOffset.x) / zoom,
          y: (event.clientY - rect.top - viewportOffset.y) / zoom,
        };

        setConnectionStart({ nodeId, port, position });
      }
    },
    [viewportOffset, zoom]
  );

  const handlePortMouseUp = useCallback(
    (nodeId: string, port: string, event: React.MouseEvent) => {
      event.stopPropagation();

      if (connectionStart && connectionStart.nodeId !== nodeId) {
        onConnect(connectionStart.nodeId, nodeId, connectionStart.port, port);
      }

      setConnectionStart(null);
    },
    [connectionStart, onConnect]
  );

  // Grid rendering
  const renderGrid = () => {
    const gridSize = 30;
    const offsetX = viewportOffset.x % (gridSize * zoom);
    const offsetY = viewportOffset.y % (gridSize * zoom);

    const lines = [];
    const canvasWidth = canvasRef.current?.clientWidth || 1000;
    const canvasHeight = canvasRef.current?.clientHeight || 1000;

    // Major grid lines (every 5th line)
    const majorGridSize = gridSize * 5;
    const majorOffsetX = viewportOffset.x % (majorGridSize * zoom);
    const majorOffsetY = viewportOffset.y % (majorGridSize * zoom);

    // Minor vertical lines
    for (let x = offsetX; x < canvasWidth; x += gridSize * zoom) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="rgba(102, 126, 234, 0.04)"
          strokeWidth={0.5}
        />
      );
    }

    // Minor horizontal lines
    for (let y = offsetY; y < canvasHeight; y += gridSize * zoom) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="rgba(102, 126, 234, 0.04)"
          strokeWidth={0.5}
        />
      );
    }

    // Major vertical lines
    for (let x = majorOffsetX; x < canvasWidth; x += majorGridSize * zoom) {
      lines.push(
        <line
          key={`major-v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="rgba(102, 126, 234, 0.08)"
          strokeWidth={1}
        />
      );
    }

    // Major horizontal lines
    for (let y = majorOffsetY; y < canvasHeight; y += majorGridSize * zoom) {
      lines.push(
        <line
          key={`major-h-${y}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="rgba(102, 126, 234, 0.08)"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  // Add global event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      handleMouseMove(event as any);
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab or Shift+A to open search menu
      if (event.key === "Tab" || (event.shiftKey && event.key === "A")) {
        event.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setSearchMenuPosition({
            x: rect.width / 2 - 190,
            y: rect.height / 2 - 250,
          });
          setShowSearchMenu(true);
        }
      }
    };

    if (isPanning || draggedNode) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPanning, draggedNode, handleMouseMove, handleMouseUp]);

  return (
    <Box
      ref={canvasRef}
      sx={styles.canvas}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Canvas Toolbar */}
      {onAlign &&
        onDistribute &&
        onCopy &&
        onPaste &&
        onDuplicate &&
        onDelete && (
          <CanvasToolbar
            hasSelection={nodes.some((n) => n.selected)}
            zoom={zoom}
            onAlign={onAlign}
            onDistribute={onDistribute}
            onCopy={onCopy}
            onPaste={onPaste}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onZoomIn={() => onZoomChange(zoom * 1.2)}
            onZoomOut={() => onZoomChange(zoom * 0.8)}
            onZoomReset={() => onZoomChange(1)}
          />
        )}

      {/* Grid */}
      <svg style={styles.gridSvg}>{renderGrid()}</svg>

      {/* Connections SVG */}
      <svg ref={svgRef} style={styles.connectionSvg}>
        {connections.map((connection) => (
          <ConnectionComponent
            key={connection.id}
            connection={connection}
            nodes={nodes}
            viewportOffset={viewportOffset}
            zoom={zoom}
            onDisconnect={onDisconnect}
          />
        ))}

        {/* Temporary connection line while dragging */}
        {connectionStart && (
          <line
            x1={connectionStart.position.x * zoom + viewportOffset.x}
            y1={connectionStart.position.y * zoom + viewportOffset.y}
            x2={mousePosition.x * zoom + viewportOffset.x}
            y2={mousePosition.y * zoom + viewportOffset.y}
            stroke="url(#connectionGradient)"
            strokeWidth={3}
            strokeDasharray="8,4"
            strokeLinecap="round"
          />
        )}

        {/* Box selection rectangle */}
        {boxSelection && (
          <rect
            x={
              Math.min(boxSelection.start.x, boxSelection.current.x) * zoom +
              viewportOffset.x
            }
            y={
              Math.min(boxSelection.start.y, boxSelection.current.y) * zoom +
              viewportOffset.y
            }
            width={
              Math.abs(boxSelection.current.x - boxSelection.start.x) * zoom
            }
            height={
              Math.abs(boxSelection.current.y - boxSelection.start.y) * zoom
            }
            fill="rgba(102, 126, 234, 0.12)"
            stroke="rgba(102, 126, 234, 0.6)"
            strokeWidth={2}
            strokeDasharray="8,4"
          />
        )}

        {/* Gradient definition for connection lines */}
        <defs>
          <linearGradient
            id="connectionGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Nodes */}
      <Box
        sx={{
          ...styles.nodeContainer,
          transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${zoom})`,
        }}
      >
        {nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            selected={node.selected || selectedNodeId === node.id}
            connections={connections}
            onMouseDown={(event: React.MouseEvent) =>
              handleNodeMouseDown(node.id, event, node.position)
            }
            onPortMouseDown={(port: string, event: React.MouseEvent) =>
              handlePortMouseDown(node.id, port, event)
            }
            onPortMouseUp={(port: string, event: React.MouseEvent) =>
              handlePortMouseUp(node.id, port, event)
            }
            onNodeResize={onNodeResize}
            onDataChange={onDataChange}
          />
        ))}
      </Box>

      {/* Search Menu */}
      {showSearchMenu && onAddNode && (
        <SearchMenu
          position={searchMenuPosition}
          onNodeSelect={(nodeType) => {
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (canvasRect) {
              const position = {
                x: (searchMenuPosition.x + 190 - viewportOffset.x) / zoom,
                y: (searchMenuPosition.y + 250 - viewportOffset.y) / zoom,
              };
              onAddNode(nodeType, position);
            }
            setShowSearchMenu(false);
          }}
          onClose={() => setShowSearchMenu(false)}
        />
      )}

      {/* Minimap */}
      <Minimap
        nodes={nodes}
        viewportOffset={viewportOffset}
        zoom={zoom}
        canvasWidth={canvasRef.current?.clientWidth || 1000}
        canvasHeight={canvasRef.current?.clientHeight || 1000}
        onViewportChange={onViewportChange}
      />

      {/* Help Overlay */}
      <CanvasHelpOverlay show={nodes.length === 0} />
    </Box>
  );
};

const styles = {
  canvas: {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    cursor: "default",
    background: `
      radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.08) 0%, transparent 50%),
      linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)
    `,
    "&:active": {
      cursor: "grabbing",
    },
  },
  gridSvg: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
    zIndex: 0,
  },
  connectionSvg: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
    zIndex: 1,
  },
  nodeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    transformOrigin: "0 0",
    zIndex: 2,
  },
};

export default NodeCanvas;

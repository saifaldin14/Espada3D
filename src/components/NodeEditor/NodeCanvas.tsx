import React, { useRef, useCallback, useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Node, NodeConnection, Position } from "../../types/nodeTypes";
import NodeComponent from "./NodeComponent";
import ConnectionComponent from "./ConnectionComponent";

interface NodeCanvasProps {
  nodes: Node[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
  onConnect: (
    sourceId: string,
    targetId: string,
    sourcePort: string,
    targetPort: string
  ) => void;
  onDisconnect: (connectionId: string) => void;
  viewportOffset: Position;
  zoom: number;
  onViewportChange: (offset: Position) => void;
  onZoomChange: (zoom: number) => void;
}

const NodeCanvas: React.FC<NodeCanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onNodeSelect,
  onNodeMove,
  onConnect,
  onDisconnect,
  viewportOffset,
  zoom,
  onViewportChange,
  onZoomChange,
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
        // Left click on empty canvas - clear selection
        onNodeSelect("");
      }
    },
    [onNodeSelect]
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
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedNode(null);
    setConnectionStart(null);
  }, []);

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
          stroke="rgba(67, 233, 123, 0.05)"
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
          stroke="rgba(67, 233, 123, 0.05)"
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
          stroke="rgba(67, 233, 123, 0.1)"
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
          stroke="rgba(67, 233, 123, 0.1)"
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

    if (isPanning || draggedNode) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
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

        {/* Gradient definition for connection lines */}
        <defs>
          <linearGradient
            id="connectionGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#43e97b" />
            <stop offset="100%" stopColor="#38f9d7" />
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
            selected={selectedNodeId === node.id}
            onMouseDown={(event: React.MouseEvent) =>
              handleNodeMouseDown(node.id, event, node.position)
            }
            onPortMouseDown={(port: string, event: React.MouseEvent) =>
              handlePortMouseDown(node.id, port, event)
            }
            onPortMouseUp={(port: string, event: React.MouseEvent) =>
              handlePortMouseUp(node.id, port, event)
            }
          />
        ))}
      </Box>
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
      radial-gradient(circle at 25% 25%, rgba(67, 233, 123, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(56, 249, 215, 0.05) 0%, transparent 50%),
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

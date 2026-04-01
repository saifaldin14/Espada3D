import React, { useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import { Node, Position } from "../../types/nodeTypes";

interface MinimapProps {
  nodes: Node[];
  viewportOffset: Position;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onViewportChange: (offset: Position) => void;
}

const Minimap: React.FC<MinimapProps> = ({
  nodes,
  viewportOffset,
  zoom,
  canvasWidth,
  canvasHeight,
  onViewportChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const minimapWidth = 200;
  const minimapHeight = 150;

  // Calculate bounds of all nodes
  const getNodeBounds = useCallback(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 100;

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add padding
    const padding = 200;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [nodes]);

  // Draw minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, minimapWidth, minimapHeight);

    // Get bounds
    const bounds = getNodeBounds();
    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;

    // Calculate scale to fit all nodes
    const scaleX = minimapWidth / graphWidth;
    const scaleY = minimapHeight / graphHeight;
    const minimapScale = Math.min(scaleX, scaleY) * 0.9;

    // Draw background
    ctx.fillStyle = "rgba(20, 25, 35, 0.9)";
    ctx.fillRect(0, 0, minimapWidth, minimapHeight);

    // Draw grid
    ctx.strokeStyle = "rgba(102, 126, 234, 0.15)";
    ctx.lineWidth = 0.5;
    const gridSize = 100 * minimapScale;
    for (let x = 0; x < minimapWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, minimapHeight);
      ctx.stroke();
    }
    for (let y = 0; y < minimapHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(minimapWidth, y);
      ctx.stroke();
    }

    // Draw nodes
    nodes.forEach((node) => {
      const x = (node.position.x - bounds.minX) * minimapScale;
      const y = (node.position.y - bounds.minY) * minimapScale;
      const width = (node.width || 150) * minimapScale;
      const height = (node.height || 100) * minimapScale;

      // Node background
      ctx.fillStyle = node.selected
        ? "rgba(102, 126, 234, 0.6)"
        : "rgba(100, 150, 200, 0.4)";
      ctx.fillRect(x, y, width, height);

      // Node border
      ctx.strokeStyle = node.selected
        ? "rgba(102, 126, 234, 1)"
        : "rgba(100, 150, 200, 0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
    });

    // Draw viewport rectangle
    const viewportX = (-viewportOffset.x / zoom - bounds.minX) * minimapScale;
    const viewportY = (-viewportOffset.y / zoom - bounds.minY) * minimapScale;
    const viewportWidth = (canvasWidth / zoom) * minimapScale;
    const viewportHeight = (canvasHeight / zoom) * minimapScale;

    ctx.strokeStyle = "rgba(102, 126, 234, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

    // Viewport fill
    ctx.fillStyle = "rgba(102, 126, 234, 0.15)";
    ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
  }, [nodes, getNodeBounds, viewportOffset, zoom, canvasWidth, canvasHeight]);

  // Handle minimap click/drag
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    handleMinimapInteraction(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    handleMinimapInteraction(event);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMinimapInteraction = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const bounds = getNodeBounds();
    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;
    const scaleX = minimapWidth / graphWidth;
    const scaleY = minimapHeight / graphHeight;
    const minimapScale = Math.min(scaleX, scaleY) * 0.9;

    // Convert minimap coordinates to canvas coordinates
    const targetX = clickX / minimapScale + bounds.minX;
    const targetY = clickY / minimapScale + bounds.minY;

    // Center the viewport on the clicked position
    const newOffsetX = -(targetX - canvasWidth / zoom / 2) * zoom;
    const newOffsetY = -(targetY - canvasHeight / zoom / 2) * zoom;

    onViewportChange({ x: newOffsetX, y: newOffsetY });
  };

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 16,
        right: 16,
        width: minimapWidth,
        height: minimapHeight,
        borderRadius: "8px",
        overflow: "hidden",
        border: "2px solid rgba(102, 126, 234, 0.4)",
        boxShadow:
          "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(102, 126, 234, 0.2)",
        backdropFilter: "blur(5px)",
        zIndex: 100,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          border: "2px solid rgba(102, 126, 234, 0.6)",
          boxShadow:
            "0 6px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(102, 126, 234, 0.3)",
        },
      }}
    >
      <canvas
        ref={canvasRef}
        width={minimapWidth}
        height={minimapHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </Box>
  );
};

export default Minimap;

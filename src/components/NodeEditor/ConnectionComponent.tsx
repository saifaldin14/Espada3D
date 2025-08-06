import React from "react";
import { Node, NodeConnection, Position } from "../../types/nodeTypes";

interface ConnectionComponentProps {
  connection: NodeConnection;
  nodes: Node[];
  viewportOffset: Position;
  zoom: number;
  onDisconnect: (connectionId: string) => void;
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({
  connection,
  nodes,
  viewportOffset,
  zoom,
  onDisconnect,
}) => {
  const sourceNode = nodes.find((node) => node.id === connection.sourceNodeId);
  const targetNode = nodes.find((node) => node.id === connection.targetNodeId);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Calculate port positions
  const getPortPosition = (
    node: Node,
    port: string,
    isOutput: boolean
  ): Position => {
    const nodeWidth = node.width || 150;
    const nodeHeight = node.collapsed ? 40 : node.height || 100;

    // Base position at the node
    let x = node.position.x;
    let y = node.position.y;

    if (isOutput) {
      // Output ports are on the right side
      x += nodeWidth;

      if (!node.collapsed) {
        const outputIndex = node.outputs.indexOf(port);
        const totalOutputs = node.outputs.length;
        const portSpacing = Math.min(
          20,
          (nodeHeight - 60) / Math.max(1, totalOutputs - 1)
        );
        y += 50 + outputIndex * portSpacing;
      } else {
        y += 20; // Center of collapsed node
      }
    } else {
      // Input ports are on the left side
      if (!node.collapsed) {
        const inputIndex = node.inputs.indexOf(port);
        const totalInputs = node.inputs.length;
        const portSpacing = Math.min(
          20,
          (nodeHeight - 60) / Math.max(1, totalInputs - 1)
        );
        y += 50 + inputIndex * portSpacing;
      } else {
        y += 20; // Center of collapsed node
      }
    }

    return { x, y };
  };

  const sourcePos = getPortPosition(sourceNode, connection.sourcePort, true);
  const targetPos = getPortPosition(targetNode, connection.targetPort, false);

  // Transform positions to screen coordinates
  const screenSourcePos = {
    x: sourcePos.x * zoom + viewportOffset.x,
    y: sourcePos.y * zoom + viewportOffset.y,
  };

  const screenTargetPos = {
    x: targetPos.x * zoom + viewportOffset.x,
    y: targetPos.y * zoom + viewportOffset.y,
  };

  // Calculate bezier curve control points for smooth connections
  const getBezierPath = (start: Position, end: Position): string => {
    const dx = end.x - start.x;
    const controlOffset = Math.max(50, Math.abs(dx) * 0.3);

    const cp1x = start.x + controlOffset;
    const cp1y = start.y;
    const cp2x = end.x - controlOffset;
    const cp2y = end.y;

    return `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`;
  };

  const pathData = getBezierPath(screenSourcePos, screenTargetPos);

  // Handle connection click for selection/deletion
  const handleConnectionClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (event.detail === 2) {
      // Double click to delete
      onDisconnect(connection.id);
    }
  };

  return (
    <g>
      {/* Connection shadow for better visibility */}
      <path
        d={pathData}
        stroke="rgba(0, 0, 0, 0.3)"
        strokeWidth={6}
        fill="none"
        pointerEvents="none"
      />

      {/* Main connection line */}
      <path
        d={pathData}
        stroke={connection.selected ? "#00ccff" : "#666"}
        strokeWidth={connection.selected ? 3 : 2}
        fill="none"
        style={{ cursor: "pointer" }}
        onClick={handleConnectionClick}
        onDoubleClick={handleConnectionClick}
      />

      {/* Connection hover area (invisible but clickable) */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        style={{ cursor: "pointer" }}
        onClick={handleConnectionClick}
        onDoubleClick={handleConnectionClick}
      />

      {/* Arrowhead */}
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={connection.selected ? "#00ccff" : "#666"}
          />
        </marker>
      </defs>

      {/* Arrow line */}
      <path
        d={pathData}
        stroke={connection.selected ? "#00ccff" : "#666"}
        strokeWidth={connection.selected ? 3 : 2}
        fill="none"
        markerEnd={`url(#arrowhead-${connection.id})`}
        pointerEvents="none"
      />

      {/* Data flow animation */}
      {connection.selected && (
        <circle r="4" fill="#00ccff">
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href={`#connection-path-${connection.id}`} />
          </animateMotion>
        </circle>
      )}

      {/* Hidden path for animation reference */}
      <path
        id={`connection-path-${connection.id}`}
        d={pathData}
        stroke="none"
        fill="none"
        style={{ display: "none" }}
      />
    </g>
  );
};

export default ConnectionComponent;

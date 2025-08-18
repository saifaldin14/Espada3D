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
    // Single click to select, right click to delete
  };

  const handleConnectionRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDisconnect(connection.id);
  };

  const handleConnectionDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDisconnect(connection.id);
  };

  const getConnectionGradient = (selected: boolean) => {
    return selected
      ? "url(#selectedConnectionGradient)"
      : "url(#defaultConnectionGradient)";
  };

  return (
    <g>
      {/* Gradient definitions */}
      <defs>
        {/* Default connection gradient */}
        <linearGradient
          id="defaultConnectionGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="rgba(67, 233, 123, 0.8)" />
          <stop offset="50%" stopColor="rgba(83, 109, 254, 0.7)" />
          <stop offset="100%" stopColor="rgba(248, 113, 113, 0.8)" />
        </linearGradient>

        {/* Selected connection gradient */}
        <linearGradient
          id="selectedConnectionGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="rgba(67, 233, 123, 1)" />
          <stop offset="50%" stopColor="rgba(139, 92, 246, 1)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 1)" />
        </linearGradient>

        {/* Glow filter */}
        <filter id={`connectionGlow-${connection.id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Connection shadow/glow for better visibility */}
      <path
        d={pathData}
        stroke="rgba(67, 233, 123, 0.3)"
        strokeWidth={connection.selected ? 8 : 6}
        fill="none"
        pointerEvents="none"
        filter={
          connection.selected ? `url(#connectionGlow-${connection.id})` : "none"
        }
      />

      {/* Main connection line */}
      <path
        d={pathData}
        stroke={getConnectionGradient(!!connection.selected)}
        strokeWidth={connection.selected ? 4 : 3}
        fill="none"
        style={{
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
        }}
        onClick={handleConnectionClick}
        onDoubleClick={handleConnectionDoubleClick}
        onContextMenu={handleConnectionRightClick}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Connection hover area (invisible but clickable) */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        style={{ cursor: "pointer" }}
        onClick={handleConnectionClick}
        onDoubleClick={handleConnectionDoubleClick}
        onContextMenu={handleConnectionRightClick}
      />

      {/* Delete button for selected connections */}
      {connection.selected && (
        <g>
          {/* Delete button background */}
          <circle
            cx={
              screenSourcePos.x + (screenTargetPos.x - screenSourcePos.x) * 0.5
            }
            cy={
              screenSourcePos.y + (screenTargetPos.y - screenSourcePos.y) * 0.5
            }
            r="12"
            fill="rgba(220, 38, 38, 0.9)"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="2"
            style={{ cursor: "pointer" }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDisconnect(connection.id);
            }}
          />
          {/* Delete icon (X) */}
          <g
            transform={`translate(${screenSourcePos.x + (screenTargetPos.x - screenSourcePos.x) * 0.5 - 6}, ${screenSourcePos.y + (screenTargetPos.y - screenSourcePos.y) * 0.5 - 6})`}
            style={{ cursor: "pointer", pointerEvents: "none" }}
          >
            <path
              d="M2 2L10 10M10 2L2 10"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>
      )}

      {/* Data flow animation */}
      {connection.selected && (
        <>
          <circle
            r="5"
            fill="rgba(67, 233, 123, 0.9)"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1"
          >
            <animateMotion dur="1.5s" repeatCount="indefinite">
              <mpath href={`#connection-path-${connection.id}`} />
            </animateMotion>
          </circle>
          <circle r="3" fill="rgba(255, 255, 255, 0.8)">
            <animateMotion dur="1.5s" repeatCount="indefinite">
              <mpath href={`#connection-path-${connection.id}`} />
            </animateMotion>
          </circle>
        </>
      )}

      {/* Pulse animation for active connections */}
      {connection.selected && (
        <path
          d={pathData}
          stroke="rgba(67, 233, 123, 0.6)"
          strokeWidth="6"
          fill="none"
          pointerEvents="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-opacity"
            values="0.3;0.8;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
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

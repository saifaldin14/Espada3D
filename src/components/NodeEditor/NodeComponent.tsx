import React, { useRef, useCallback, useMemo } from "react";
import { Box, Typography, IconButton, Switch, Slider } from "@mui/material";
import {
  Input,
  Output,
  Functions,
  Transform,
  Palette,
  Category,
  FilterAlt,
  QuestionMark,
  ExpandMore,
  ExpandLess,
  Memory,
  Lightbulb,
  Videocam,
  Image,
  Code,
  CheckCircle,
  Warning,
  LinearScale,
  ToggleOn,
  Place,
  List,
  Visibility,
  FormatListNumbered,
  Colorize,
} from "@mui/icons-material";
import {
  Node,
  NodeConnection,
  NodeData,
  NODE_REGISTRY,
  PORT_COLORS,
  NodePortDefinition,
  PortDataType,
} from "../../types/nodeTypes";
import { useAppSelector } from "../../hooks/useRedux";

interface NodeComponentProps {
  node: Node;
  selected: boolean;
  connections: NodeConnection[];
  onMouseDown: (event: React.MouseEvent) => void;
  onPortMouseDown: (port: string, event: React.MouseEvent) => void;
  onPortMouseUp: (port: string, event: React.MouseEvent) => void;
  onNodeResize?: (nodeId: string, width: number, height: number) => void;
  onDataChange?: (nodeId: string, data: Partial<NodeData>) => void;
}

const getNodeIcon = (type: string) => {
  const iconSx = { fontSize: 18 };
  switch (type) {
    case "input": return <Input sx={iconSx} />;
    case "color": return <Colorize sx={iconSx} />;
    case "output": return <Output sx={iconSx} />;
    case "math": return <Functions sx={iconSx} />;
    case "transform": return <Transform sx={iconSx} />;
    case "material": return <Palette sx={iconSx} />;
    case "geometry": return <Category sx={iconSx} />;
    case "mesh": return <Memory sx={iconSx} />;
    case "light": return <Lightbulb sx={iconSx} />;
    case "camera": return <Videocam sx={iconSx} />;
    case "texture": return <Image sx={iconSx} />;
    case "script": return <Code sx={iconSx} />;
    case "filter": return <FilterAlt sx={iconSx} />;
    case "numberSlider": return <LinearScale sx={iconSx} />;
    case "booleanToggle": return <ToggleOn sx={iconSx} />;
    case "point": return <Place sx={iconSx} />;
    case "list": return <List sx={iconSx} />;
    case "watch": return <Visibility sx={iconSx} />;
    case "sequence": return <FormatListNumbered sx={iconSx} />;
    default: return <QuestionMark sx={iconSx} />;
  }
};

const isPortConnected = (
  nodeId: string,
  portName: string,
  connections: NodeConnection[]
): boolean => {
  return connections.some(
    (c) =>
      (c.sourceNodeId === nodeId && c.sourcePort === portName) ||
      (c.targetNodeId === nodeId && c.targetPort === portName)
  );
};

const getPortDefinition = (
  nodeType: string,
  portName: string,
  portSide: "input" | "output"
): NodePortDefinition | undefined => {
  const reg = NODE_REGISTRY[nodeType as keyof typeof NODE_REGISTRY];
  if (!reg) return undefined;
  const defs = portSide === "input" ? reg.inputs : reg.outputs;
  return defs.find((d) => d.name === portName);
};

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  selected,
  connections,
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
  onNodeResize,
  onDataChange,
}) => {
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const executionResult = useAppSelector(
    (state) => state.nodes.executionResults[node.id]
  );

  const registryEntry = NODE_REGISTRY[node.type];
  const headerColor = registryEntry?.color || "#636e72";

  const connectedPorts = useMemo(() => {
    const set = new Set<string>();
    connections.forEach((c) => {
      if (c.sourceNodeId === node.id) set.add(c.sourcePort);
      if (c.targetNodeId === node.id) set.add(c.targetPort);
    });
    return set;
  }, [connections, node.id]);

  const handleResizeStart = useCallback(
    (direction: string, event: React.MouseEvent) => {
      event.stopPropagation();
      resizeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        width: node.width || 170,
        height: node.height || 120,
      };

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;
        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        if (direction.includes("right")) newWidth = Math.max(150, resizeStartRef.current.width + deltaX);
        if (direction.includes("left")) newWidth = Math.max(150, resizeStartRef.current.width - deltaX);
        if (direction.includes("bottom")) newHeight = Math.max(100, resizeStartRef.current.height + deltaY);
        if (direction.includes("top")) newHeight = Math.max(100, resizeStartRef.current.height - deltaY);
        if (onNodeResize) onNodeResize(node.id, newWidth, newHeight);
      };
      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [node.id, node.width, node.height, onNodeResize]
  );

  const handleDataChange = useCallback(
    (data: Partial<NodeData>) => {
      if (onDataChange) onDataChange(node.id, data);
    },
    [node.id, onDataChange]
  );

  const renderPortCircle = (
    portName: string,
    side: "input" | "output",
    onDown: (e: React.MouseEvent) => void,
    onUp: (e: React.MouseEvent) => void
  ) => {
    const def = getPortDefinition(node.type, portName, side);
    const dataType: PortDataType = def?.dataType || "any";
    const color = PORT_COLORS[dataType] || PORT_COLORS.any;
    const connected = connectedPorts.has(portName);
    const tooltip = `${portName} (${dataType})`;

    return (
      <Box
        title={tooltip}
        sx={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: connected ? color : "transparent",
          border: `2px solid ${color}`,
          cursor: "crosshair",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: connected
            ? `0 0 6px ${color}80`
            : "none",
          flexShrink: 0,
          "&:hover": {
            transform: "scale(1.3)",
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}99`,
          },
        }}
        onMouseDown={onDown}
        onMouseUp={onUp}
      />
    );
  };

  const renderNodeContent = () => {
    switch (node.type) {
      case "input":
        return (
          <Box sx={contentStyles.container}>
            <input
              type="number"
              value={Number(node.data.value ?? 0)}
              onChange={(e) => handleDataChange({ value: parseFloat(e.target.value) || 0 })}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: "80%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
                color: "#fff",
                padding: "4px 6px",
                fontSize: 11,
                textAlign: "center",
                outline: "none",
              }}
            />
          </Box>
        );

      case "numberSlider": {
        const val = Number(node.data.value ?? 50);
        const min = Number(node.data.min ?? 0);
        const max = Number(node.data.max ?? 100);
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", px: "4px" }}>
              <Typography variant="caption" sx={contentStyles.label}>{min}</Typography>
              <Typography variant="caption" sx={contentStyles.value}>{val}</Typography>
              <Typography variant="caption" sx={contentStyles.label}>{max}</Typography>
            </Box>
            <Slider
              size="small"
              value={val}
              min={min}
              max={max}
              onChange={(_, v) => handleDataChange({ value: v as number })}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              sx={{
                width: "90%",
                color: headerColor,
                "& .MuiSlider-thumb": { width: 12, height: 12 },
                "& .MuiSlider-rail": { opacity: 0.3 },
              }}
            />
          </Box>
        );
      }

      case "booleanToggle":
        return (
          <Box sx={{ ...contentStyles.container, flexDirection: "row", justifyContent: "center" }}>
            <Typography variant="caption" sx={contentStyles.label}>
              {node.data.value ? "ON" : "OFF"}
            </Typography>
            <Switch
              size="small"
              checked={Boolean(node.data.value)}
              onChange={(e) => handleDataChange({ value: e.target.checked })}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: headerColor } }}
            />
          </Box>
        );

      case "color":
        return (
          <Box sx={contentStyles.container}>
            <Box
              sx={{
                width: 40,
                height: 24,
                backgroundColor: String(node.data.value || node.data.color || "#ffffff"),
                borderRadius: "6px",
                border: "2px solid rgba(255,255,255,0.3)",
                cursor: "pointer",
              }}
            />
            <Typography variant="caption" sx={contentStyles.value}>
              {String(node.data.value || node.data.color || "#ffffff").toUpperCase()}
            </Typography>
          </Box>
        );

      case "math":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.operation?.toUpperCase() || "ADD"}
              </Typography>
            </Box>
          </Box>
        );

      case "geometry":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.geometryType?.toUpperCase() || "BOX"}
              </Typography>
            </Box>
          </Box>
        );

      case "watch": {
        const watchVal = executionResult?.outputValues?.input;
        return (
          <Box sx={contentStyles.container}>
            <Box
              sx={{
                width: "100%",
                padding: "4px 6px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.1)",
                minHeight: 20,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#aaa", fontFamily: "monospace", fontSize: 10, wordBreak: "break-all" }}
              >
                {watchVal !== undefined ? JSON.stringify(watchVal) : "—"}
              </Typography>
            </Box>
          </Box>
        );
      }

      case "point":
        return (
          <Box sx={{ ...contentStyles.container, gap: "4px" }}>
            {["x", "y", "z"].map((axis) => (
              <Box key={axis} sx={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                <Typography variant="caption" sx={{ ...contentStyles.label, width: 12 }}>
                  {axis.toUpperCase()}
                </Typography>
                <input
                  type="number"
                  value={Number(node.data[axis] ?? 0)}
                  onChange={(e) => handleDataChange({ [axis]: parseFloat(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    width: "100%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 3,
                    color: "#fff",
                    padding: "2px 4px",
                    fontSize: 10,
                    textAlign: "center",
                    outline: "none",
                  }}
                />
              </Box>
            ))}
          </Box>
        );

      case "sequence":
        return (
          <Box sx={{ ...contentStyles.container, gap: "2px" }}>
            {[
              { key: "start", label: "Start" },
              { key: "end", label: "End" },
              { key: "step", label: "Step" },
            ].map(({ key, label }) => (
              <Box key={key} sx={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                <Typography variant="caption" sx={{ ...contentStyles.label, width: 28, fontSize: 8 }}>
                  {label}
                </Typography>
                <input
                  type="number"
                  value={Number(node.data[key] ?? (key === "step" ? 1 : 0))}
                  onChange={(e) => handleDataChange({ [key]: parseFloat(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    width: "100%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 3,
                    color: "#fff",
                    padding: "2px 4px",
                    fontSize: 10,
                    textAlign: "center",
                    outline: "none",
                  }}
                />
              </Box>
            ))}
          </Box>
        );

      case "list": {
        const connCount = connections.filter(
          (c) => c.targetNodeId === node.id
        ).length;
        return (
          <Box sx={contentStyles.container}>
            <Typography variant="caption" sx={contentStyles.value}>
              {connCount} item{connCount !== 1 ? "s" : ""} connected
            </Typography>
          </Box>
        );
      }

      case "output":
        return (
          <Box sx={contentStyles.container}>
            <Typography variant="caption" sx={contentStyles.text}>Output Node</Typography>
          </Box>
        );

      case "transform":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.transformType?.toUpperCase() || "TRANSLATE"}
              </Typography>
            </Box>
          </Box>
        );

      case "material":
        return (
          <Box sx={contentStyles.container}>
            <Box
              sx={{
                width: 32, height: 20,
                backgroundColor: node.data.color || "#ffffff",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
            <Typography variant="caption" sx={{ ...contentStyles.label, fontSize: 9 }}>
              {node.data.materialType?.toUpperCase() || "STANDARD"}
            </Typography>
          </Box>
        );

      case "mesh":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.meshSource?.toUpperCase() || "GEOMETRY"}
              </Typography>
            </Box>
          </Box>
        );

      case "light":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.lightType?.toUpperCase() || "DIRECTIONAL"}
              </Typography>
            </Box>
          </Box>
        );

      case "camera":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.cameraType?.toUpperCase() || "PERSPECTIVE"}
              </Typography>
            </Box>
          </Box>
        );

      case "texture":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.textureType?.toUpperCase() || "DIFFUSE"}
              </Typography>
            </Box>
          </Box>
        );

      case "script":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.scriptLanguage?.toUpperCase() || "JAVASCRIPT"}
              </Typography>
            </Box>
          </Box>
        );

      case "filter":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.filterType?.toUpperCase() || "BLUR"}
              </Typography>
            </Box>
          </Box>
        );

      case "condition":
        return (
          <Box sx={contentStyles.container}>
            <Box sx={{ ...contentStyles.chip, background: `${headerColor}30` }}>
              <Typography variant="caption" sx={contentStyles.value}>
                {node.data.condition?.toUpperCase() || "EQUALS"}
              </Typography>
            </Box>
          </Box>
        );

      default:
        return (
          <Box sx={contentStyles.container}>
            <Typography variant="caption" sx={contentStyles.text}>
              {String(node.type).toUpperCase()}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box
      ref={nodeRef}
      sx={{
        ...styles.node,
        left: node.position.x,
        top: node.position.y,
        width: node.width || 170,
        height: node.collapsed ? 50 : node.height || 120,
        background: selected
          ? `linear-gradient(135deg, ${headerColor}20 0%, ${headerColor}10 100%)`
          : "linear-gradient(135deg, rgba(30, 35, 45, 0.95) 0%, rgba(25, 30, 40, 0.95) 100%)",
        borderColor: selected ? headerColor : "rgba(255, 255, 255, 0.1)",
        boxShadow: selected
          ? `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${headerColor}40, 0 2px 8px rgba(0,0,0,0.4)`
          : "0 4px 20px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)",
        transform: selected ? "translateY(-2px)" : "translateY(0)",
        overflow: selected ? "visible" : "hidden",
      }}
      onMouseDown={onMouseDown}
    >
      {/* Resize Handles */}
      {selected && !node.collapsed && (
        <>
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleTopLeft }} onMouseDown={(e) => handleResizeStart("top-left", e)} />
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleTopRight }} onMouseDown={(e) => handleResizeStart("top-right", e)} />
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleBottomLeft }} onMouseDown={(e) => handleResizeStart("bottom-left", e)} />
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleBottomRight }} onMouseDown={(e) => handleResizeStart("bottom-right", e)} />
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleTop }} onMouseDown={(e) => handleResizeStart("top", e)} />
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleRight }} onMouseDown={(e) => handleResizeStart("right", e)} />
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleBottom }} onMouseDown={(e) => handleResizeStart("bottom", e)} />
          <Box sx={{ ...styles.resizeHandle, ...styles.resizeHandleLeft }} onMouseDown={(e) => handleResizeStart("left", e)} />
        </>
      )}

      {/* Header */}
      <Box
        sx={{
          ...styles.header,
          background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}CC 100%)`,
          borderBottom: `1px solid ${headerColor}40`,
        }}
      >
        <Box sx={styles.headerContent}>
          <Box sx={styles.iconContainer}>{getNodeIcon(node.type)}</Box>
          <Typography variant="caption" sx={styles.title}>
            {node.data.name || registryEntry?.name || node.type.toUpperCase()}
          </Typography>
          {/* Execution result indicator */}
          {executionResult && !executionResult.error && (
            <CheckCircle sx={{ fontSize: 14, color: "#4CAF50" }} />
          )}
          {executionResult?.error && (
            <Warning sx={{ fontSize: 14, color: "#f44336" }} />
          )}
          <IconButton
            size="small"
            sx={styles.collapseButton}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
          >
            {node.collapsed ? <ExpandMore /> : <ExpandLess />}
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      {!node.collapsed && (
        <Box sx={styles.body}>
          {/* Input Ports */}
          {node.inputs.length > 0 && (
            <Box sx={styles.portsContainer}>
              {node.inputs.map((input) => (
                <Box key={input} sx={styles.inputPort}>
                  {renderPortCircle(
                    input,
                    "input",
                    (e) => onPortMouseDown(input, e),
                    (e) => onPortMouseUp(input, e)
                  )}
                  <Typography variant="caption" sx={styles.portLabel}>
                    {input}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Node Content */}
          <Box sx={styles.content}>{renderNodeContent()}</Box>

          {/* Output Ports */}
          {node.outputs.length > 0 && (
            <Box sx={styles.portsContainer}>
              {node.outputs.map((output) => (
                <Box key={output} sx={styles.outputPort}>
                  <Typography variant="caption" sx={styles.portLabel}>
                    {output}
                  </Typography>
                  {renderPortCircle(
                    output,
                    "output",
                    (e) => onPortMouseDown(output, e),
                    (e) => onPortMouseUp(output, e)
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const contentStyles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "6px",
    width: "100%",
  },
  label: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "9px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  value: {
    color: "#fff",
    fontSize: "10px",
    fontWeight: 700,
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
  },
  text: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "11px",
    fontWeight: 500,
    textAlign: "center" as const,
  },
  chip: {
    padding: "3px 8px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    textAlign: "center" as const,
    boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.1)",
  },
};

const styles = {
  node: {
    position: "absolute" as const,
    backgroundColor: "rgba(30, 35, 45, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    cursor: "move",
    userSelect: "none" as const,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
    "&:hover": {
      borderColor: "rgba(255, 255, 255, 0.2)",
      transform: "translateY(-1px)",
    },
  },
  resizeHandle: {
    position: "absolute" as const,
    backgroundColor: "rgba(0, 204, 255, 0.9)",
    border: "2px solid rgba(255, 255, 255, 0.8)",
    borderRadius: "3px",
    transition: "all 0.2s ease",
    zIndex: 1000,
    "&:hover": {
      backgroundColor: "rgba(0, 204, 255, 1)",
      transform: "scale(1.3)",
      boxShadow: "0 2px 8px rgba(0, 204, 255, 0.4)",
    },
  },
  resizeHandleTopLeft: { top: "-6px", left: "-6px", width: "12px", height: "12px", cursor: "nw-resize" },
  resizeHandleTopRight: { top: "-6px", right: "-6px", width: "12px", height: "12px", cursor: "ne-resize" },
  resizeHandleBottomLeft: { bottom: "-6px", left: "-6px", width: "12px", height: "12px", cursor: "sw-resize" },
  resizeHandleBottomRight: { bottom: "-6px", right: "-6px", width: "12px", height: "12px", cursor: "se-resize" },
  resizeHandleTop: { top: "-6px", left: "50%", transform: "translateX(-50%)", width: "12px", height: "8px", cursor: "n-resize" },
  resizeHandleRight: { right: "-6px", top: "50%", transform: "translateY(-50%)", width: "8px", height: "12px", cursor: "e-resize" },
  resizeHandleBottom: { bottom: "-6px", left: "50%", transform: "translateX(-50%)", width: "12px", height: "8px", cursor: "s-resize" },
  resizeHandleLeft: { left: "-6px", top: "50%", transform: "translateY(-50%)", width: "8px", height: "12px", cursor: "w-resize" },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "12px 12px 0 0",
    minHeight: "40px",
    position: "relative" as const,
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "12px 12px 0 0",
    },
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: "8px",
    position: "relative" as const,
    zIndex: 1,
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#fff",
    backdropFilter: "blur(5px)",
    "& svg": { fontSize: "18px", filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))" },
  },
  title: {
    flex: 1,
    color: "#fff",
    fontWeight: 700,
    fontSize: "11px",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
  },
  collapseButton: {
    color: "rgba(255, 255, 255, 0.8)",
    padding: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#fff" },
    "& svg": { fontSize: "16px" },
  },
  body: {
    padding: "12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    background: "rgba(0, 0, 0, 0.1)",
  },
  portsContainer: { display: "flex", flexDirection: "column" as const, gap: "6px" },
  inputPort: { display: "flex", alignItems: "center", gap: "8px" },
  outputPort: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" },
  portLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  content: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "4px 0",
    minHeight: "24px",
  },
};

export default React.memo(NodeComponent);

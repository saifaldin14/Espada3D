import React, { useRef, useCallback } from "react";
import { Box, Typography, IconButton } from "@mui/material";
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
} from "@mui/icons-material";
import { Node } from "../../types/nodeTypes";

interface NodeComponentProps {
  node: Node;
  selected: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  onPortMouseDown: (port: string, event: React.MouseEvent) => void;
  onPortMouseUp: (port: string, event: React.MouseEvent) => void;
  onNodeResize?: (nodeId: string, width: number, height: number) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  selected,
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
  onNodeResize,
}) => {
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback(
    (direction: string, event: React.MouseEvent) => {
      event.stopPropagation();

      const rect = nodeRef.current?.getBoundingClientRect();
      if (rect) {
        resizeStartRef.current = {
          x: event.clientX,
          y: event.clientY,
          width: node.width || 170,
          height: node.height || 120,
        };
      }

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;

        if (direction.includes("right")) {
          newWidth = Math.max(150, resizeStartRef.current.width + deltaX);
        }
        if (direction.includes("left")) {
          newWidth = Math.max(150, resizeStartRef.current.width - deltaX);
        }
        if (direction.includes("bottom")) {
          newHeight = Math.max(100, resizeStartRef.current.height + deltaY);
        }
        if (direction.includes("top")) {
          newHeight = Math.max(100, resizeStartRef.current.height - deltaY);
        }

        if (onNodeResize) {
          onNodeResize(node.id, newWidth, newHeight);
        }
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
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "input":
        return <Input sx={{ fontSize: 18 }} />;
      case "color":
        return <Palette sx={{ fontSize: 18 }} />;
      case "output":
        return <Output sx={{ fontSize: 18 }} />;
      case "math":
        return <Functions sx={{ fontSize: 18 }} />;
      case "transform":
        return <Transform sx={{ fontSize: 18 }} />;
      case "material":
        return <Palette sx={{ fontSize: 18 }} />;
      case "geometry":
        return <Category sx={{ fontSize: 18 }} />;
      case "mesh":
        return <Memory sx={{ fontSize: 18 }} />;
      case "light":
        return <Lightbulb sx={{ fontSize: 18 }} />;
      case "camera":
        return <Videocam sx={{ fontSize: 18 }} />;
      case "texture":
        return <Image sx={{ fontSize: 18 }} />;
      case "script":
        return <Code sx={{ fontSize: 18 }} />;
      case "filter":
        return <FilterAlt sx={{ fontSize: 18 }} />;
      default:
        return <QuestionMark sx={{ fontSize: 18 }} />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "input":
        return {
          primary: "#43e97b",
          secondary: "#38f9d7",
          accent: "#2dd4bf",
        };
      case "color":
        return {
          primary: "#E91E63",
          secondary: "#F06292",
          accent: "#EC407A",
        };
      case "output":
        return {
          primary: "#fa709a",
          secondary: "#fee140",
          accent: "#f093fb",
        };
      case "math":
        return {
          primary: "#667eea",
          secondary: "#764ba2",
          accent: "#4f46e5",
        };
      case "transform":
        return {
          primary: "#f093fb",
          secondary: "#f5576c",
          accent: "#ec4899",
        };
      case "material":
        return {
          primary: "#4facfe",
          secondary: "#00f2fe",
          accent: "#06b6d4",
        };
      case "geometry":
        return {
          primary: "#96fbc4",
          secondary: "#f9f047",
          accent: "#84cc16",
        };
      case "mesh":
        return {
          primary: "#ffecd2",
          secondary: "#fcb69f",
          accent: "#f97316",
        };
      case "light":
        return {
          primary: "#ffeaa7",
          secondary: "#fab1a0",
          accent: "#fdcb6e",
        };
      case "camera":
        return {
          primary: "#fd79a8",
          secondary: "#6c5ce7",
          accent: "#a29bfe",
        };
      case "texture":
        return {
          primary: "#74b9ff",
          secondary: "#0984e3",
          accent: "#3b82f6",
        };
      case "script":
        return {
          primary: "#a29bfe",
          secondary: "#6c5ce7",
          accent: "#8b5cf6",
        };
      case "filter":
        return {
          primary: "#fd79a8",
          secondary: "#fdcb6e",
          accent: "#e17055",
        };
      case "condition":
        return {
          primary: "#81ecec",
          secondary: "#74b9ff",
          accent: "#00b894",
        };
      default:
        return {
          primary: "#636e72",
          secondary: "#2d3436",
          accent: "#6b7280",
        };
    }
  };

  const nodeColors = getNodeColor(node.type);

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
          ? `linear-gradient(135deg, ${nodeColors.primary}20 0%, ${nodeColors.secondary}20 100%)`
          : "linear-gradient(135deg, rgba(30, 35, 45, 0.95) 0%, rgba(25, 30, 40, 0.95) 100%)",
        borderColor: selected ? nodeColors.accent : "rgba(255, 255, 255, 0.1)",
        boxShadow: selected
          ? `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${nodeColors.accent}40`
          : "0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.2)",
        transform: selected ? "translateY(-2px)" : "translateY(0)",
        overflow: selected ? "visible" : "hidden", // Allow resize handles to show when selected
      }}
      onMouseDown={onMouseDown}
    >
      {/* Resize Handles */}
      {selected && !node.collapsed && (
        <>
          {/* Corner handles */}
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleTopLeft }}
            onMouseDown={(e: React.MouseEvent) =>
              handleResizeStart("top-left", e)
            }
          />
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleTopRight }}
            onMouseDown={(e: React.MouseEvent) =>
              handleResizeStart("top-right", e)
            }
          />
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleBottomLeft }}
            onMouseDown={(e: React.MouseEvent) =>
              handleResizeStart("bottom-left", e)
            }
          />
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleBottomRight }}
            onMouseDown={(e: React.MouseEvent) =>
              handleResizeStart("bottom-right", e)
            }
          />

          {/* Edge handles */}
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleTop }}
            onMouseDown={(e: React.MouseEvent) => handleResizeStart("top", e)}
          />
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleRight }}
            onMouseDown={(e: React.MouseEvent) => handleResizeStart("right", e)}
          />
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleBottom }}
            onMouseDown={(e: React.MouseEvent) =>
              handleResizeStart("bottom", e)
            }
          />
          <Box
            sx={{ ...styles.resizeHandle, ...styles.resizeHandleLeft }}
            onMouseDown={(e: React.MouseEvent) => handleResizeStart("left", e)}
          />
        </>
      )}
      {/* Header */}
      <Box
        sx={{
          ...styles.header,
          background: `linear-gradient(135deg, ${nodeColors.primary} 0%, ${nodeColors.secondary} 100%)`,
          borderBottom: `1px solid ${nodeColors.accent}40`,
        }}
      >
        <Box sx={styles.headerContent}>
          <Box sx={styles.iconContainer}>{getNodeIcon(node.type)}</Box>
          <Typography variant="caption" sx={styles.title}>
            {node.data.name || node.type.toUpperCase()}
          </Typography>
          <IconButton
            size="small"
            sx={styles.collapseButton}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              // Handle collapse toggle
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
              {node.inputs.map((input, index) => (
                <Box key={input} sx={styles.inputPort}>
                  <Box
                    sx={styles.portCircle}
                    onMouseDown={(e: React.MouseEvent) =>
                      onPortMouseDown(input, e)
                    }
                    onMouseUp={(e: React.MouseEvent) => onPortMouseUp(input, e)}
                  />
                  <Typography variant="caption" sx={styles.portLabel}>
                    {input}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Node Content */}
          <Box sx={styles.content}>{renderNodeContent(node)}</Box>

          {/* Output Ports */}
          {node.outputs.length > 0 && (
            <Box sx={styles.portsContainer}>
              {node.outputs.map((output, index) => (
                <Box key={output} sx={styles.outputPort}>
                  <Typography variant="caption" sx={styles.portLabel}>
                    {output}
                  </Typography>
                  <Box
                    sx={styles.portCircle}
                    onMouseDown={(e: React.MouseEvent) =>
                      onPortMouseDown(output, e)
                    }
                    onMouseUp={(e: React.MouseEvent) =>
                      onPortMouseUp(output, e)
                    }
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const renderNodeContent = (node: Node) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case "input":
        return {
          primary: "#43e97b",
          secondary: "#38f9d7",
          accent: "#2dd4bf",
        };
      case "color":
        return {
          primary: "#E91E63",
          secondary: "#F06292",
          accent: "#EC407A",
        };
      case "output":
        return {
          primary: "#fa709a",
          secondary: "#fee140",
          accent: "#f093fb",
        };
      case "math":
        return {
          primary: "#667eea",
          secondary: "#764ba2",
          accent: "#4f46e5",
        };
      case "transform":
        return {
          primary: "#f093fb",
          secondary: "#f5576c",
          accent: "#ec4899",
        };
      case "material":
        return {
          primary: "#4facfe",
          secondary: "#00f2fe",
          accent: "#06b6d4",
        };
      case "geometry":
        return {
          primary: "#96fbc4",
          secondary: "#f9f047",
          accent: "#84cc16",
        };
      case "mesh":
        return {
          primary: "#ffecd2",
          secondary: "#fcb69f",
          accent: "#f97316",
        };
      case "light":
        return {
          primary: "#ffeaa7",
          secondary: "#fab1a0",
          accent: "#fdcb6e",
        };
      case "camera":
        return {
          primary: "#fd79a8",
          secondary: "#6c5ce7",
          accent: "#a29bfe",
        };
      case "texture":
        return {
          primary: "#74b9ff",
          secondary: "#0984e3",
          accent: "#3b82f6",
        };
      case "script":
        return {
          primary: "#a29bfe",
          secondary: "#6c5ce7",
          accent: "#8b5cf6",
        };
      case "filter":
        return {
          primary: "#fd79a8",
          secondary: "#fdcb6e",
          accent: "#e17055",
        };
      case "condition":
        return {
          primary: "#81ecec",
          secondary: "#74b9ff",
          accent: "#00b894",
        };
      default:
        return {
          primary: "#636e72",
          secondary: "#2d3436",
          accent: "#6b7280",
        };
    }
  };

  const nodeColors = getNodeColor(node.type);

  switch (node.type) {
    case "input":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Value
          </Typography>
          <Box
            sx={{
              ...styles.valueDisplay,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.value || 0}
            </Typography>
          </Box>
        </Box>
      );
    case "color":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Color
          </Typography>
          <Box sx={styles.colorPreview}>
            <Box
              sx={{
                width: 40,
                height: 24,
                backgroundColor: String(node.data.value || "#ffffff"),
                borderRadius: "6px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
              }}
            />
            <Typography variant="caption" sx={styles.contentValue}>
              {String(node.data.value || "#ffffff").toUpperCase()}
            </Typography>
          </Box>
        </Box>
      );
    case "output":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentText}>
            Output Node
          </Typography>
        </Box>
      );
    case "math":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Operation
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.operation?.toUpperCase() || "ADD"}
            </Typography>
          </Box>
        </Box>
      );
    case "transform":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Transform
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.transformType?.toUpperCase() || "TRANSLATE"}
            </Typography>
          </Box>
        </Box>
      );
    case "material":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Material
          </Typography>
          <Box sx={styles.materialPreview}>
            <Box
              sx={{
                width: 32,
                height: 20,
                backgroundColor: node.data.color || "#ffffff",
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
              }}
            />
            <Typography variant="caption" sx={styles.materialType}>
              {node.data.materialType?.toUpperCase() || "STANDARD"}
            </Typography>
          </Box>
        </Box>
      );
    case "geometry":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Geometry
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.geometryType?.toUpperCase() || "BOX"}
            </Typography>
          </Box>
        </Box>
      );
    case "mesh":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Mesh Source
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.meshSource?.toUpperCase() || "GEOMETRY"}
            </Typography>
          </Box>
        </Box>
      );
    case "light":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Light Type
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.lightType?.toUpperCase() || "DIRECTIONAL"}
            </Typography>
          </Box>
        </Box>
      );
    case "camera":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Camera
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.cameraType?.toUpperCase() || "PERSPECTIVE"}
            </Typography>
          </Box>
        </Box>
      );
    case "texture":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Texture
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.textureType?.toUpperCase() || "DIFFUSE"}
            </Typography>
          </Box>
        </Box>
      );
    case "script":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Script
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.scriptLanguage?.toUpperCase() || "JAVASCRIPT"}
            </Typography>
          </Box>
        </Box>
      );
    case "filter":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Filter
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.filterType?.toUpperCase() || "BLUR"}
            </Typography>
          </Box>
        </Box>
      );
    case "condition":
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentLabel}>
            Condition
          </Typography>
          <Box
            sx={{
              ...styles.operationChip,
              background: `linear-gradient(90deg, ${nodeColors.primary}30, ${nodeColors.secondary}30)`,
            }}
          >
            <Typography variant="caption" sx={styles.contentValue}>
              {node.data.condition?.toUpperCase() || "EQUALS"}
            </Typography>
          </Box>
        </Box>
      );
    default:
      return (
        <Box sx={styles.contentContainer}>
          <Typography variant="caption" sx={styles.contentText}>
            {String(node.type).toUpperCase()}
          </Typography>
        </Box>
      );
  }
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
  // Resize handles
  resizeHandle: {
    position: "absolute" as const,
    backgroundColor: "rgba(0, 204, 255, 0.9)", // More visible blue color
    border: "2px solid rgba(255, 255, 255, 0.8)",
    borderRadius: "3px",
    transition: "all 0.2s ease",
    zIndex: 1000, // Ensure handles are on top
    "&:hover": {
      backgroundColor: "rgba(0, 204, 255, 1)",
      transform: "scale(1.3)",
      boxShadow: "0 2px 8px rgba(0, 204, 255, 0.4)",
    },
  },
  resizeHandleTopLeft: {
    top: "-6px",
    left: "-6px",
    width: "12px",
    height: "12px",
    cursor: "nw-resize",
  },
  resizeHandleTopRight: {
    top: "-6px",
    right: "-6px",
    width: "12px",
    height: "12px",
    cursor: "ne-resize",
  },
  resizeHandleBottomLeft: {
    bottom: "-6px",
    left: "-6px",
    width: "12px",
    height: "12px",
    cursor: "sw-resize",
  },
  resizeHandleBottomRight: {
    bottom: "-6px",
    right: "-6px",
    width: "12px",
    height: "12px",
    cursor: "se-resize",
  },
  resizeHandleTop: {
    top: "-6px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "12px",
    height: "8px",
    cursor: "n-resize",
  },
  resizeHandleRight: {
    right: "-6px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "8px",
    height: "12px",
    cursor: "e-resize",
  },
  resizeHandleBottom: {
    bottom: "-6px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "12px",
    height: "8px",
    cursor: "s-resize",
  },
  resizeHandleLeft: {
    left: "-6px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "8px",
    height: "12px",
    cursor: "w-resize",
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "12px 12px 0 0",
    minHeight: "40px",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "12px 12px 0 0",
    },
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: "10px",
    position: "relative",
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
    "& svg": {
      fontSize: "18px",
      filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
    },
  },
  title: {
    flex: 1,
    color: "#fff",
    fontWeight: 700,
    fontSize: "11px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
  },
  collapseButton: {
    color: "rgba(255, 255, 255, 0.8)",
    padding: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "4px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "#fff",
    },
    "& svg": {
      fontSize: "16px",
    },
  },
  body: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "rgba(0, 0, 0, 0.1)",
  },
  portsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  inputPort: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  outputPort: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
  },
  portCircle: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    border: "2px solid rgba(255, 255, 255, 0.8)",
    cursor: "crosshair",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2), 0 0 8px rgba(67, 233, 123, 0.3)",
    "&:hover": {
      transform: "scale(1.3)",
      boxShadow:
        "0 4px 8px rgba(0, 0, 0, 0.3), 0 0 12px rgba(67, 233, 123, 0.5)",
    },
  },
  portLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px 0",
    minHeight: "24px",
  },
  contentText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "11px",
    fontWeight: 500,
    textAlign: "center",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    width: "100%",
  },
  contentLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "9px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  contentValue: {
    color: "#fff",
    fontSize: "10px",
    fontWeight: 700,
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
  },
  valueDisplay: {
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(5px)",
    minWidth: "40px",
    textAlign: "center",
  },
  operationChip: {
    padding: "3px 8px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(5px)",
    textAlign: "center",
    boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.1)",
  },
  materialPreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  colorPreview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  materialType: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "9px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
};

export default NodeComponent;

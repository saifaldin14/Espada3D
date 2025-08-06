import React from "react";
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
} from "@mui/icons-material";
import { Node } from "../../types/nodeTypes";

interface NodeComponentProps {
  node: Node;
  selected: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  onPortMouseDown: (port: string, event: React.MouseEvent) => void;
  onPortMouseUp: (port: string, event: React.MouseEvent) => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  selected,
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "input":
        return <Input />;
      case "output":
        return <Output />;
      case "math":
        return <Functions />;
      case "transform":
        return <Transform />;
      case "material":
        return <Palette />;
      case "geometry":
        return <Category />;
      case "filter":
        return <FilterAlt />;
      default:
        return <QuestionMark />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "input":
        return "#4CAF50";
      case "output":
        return "#F44336";
      case "math":
        return "#2196F3";
      case "transform":
        return "#FF9800";
      case "material":
        return "#9C27B0";
      case "geometry":
        return "#00BCD4";
      case "filter":
        return "#795548";
      case "condition":
        return "#607D8B";
      default:
        return "#757575";
    }
  };

  const nodeColor = getNodeColor(node.type);

  return (
    <Box
      sx={{
        ...styles.node,
        left: node.position.x,
        top: node.position.y,
        width: node.width || 150,
        height: node.collapsed ? 40 : node.height || 100,
        borderColor: selected ? "#00ccff" : "#444",
        boxShadow: selected
          ? "0 0 10px rgba(0, 204, 255, 0.3)"
          : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
      onMouseDown={onMouseDown}
    >
      {/* Header */}
      <Box sx={{ ...styles.header, backgroundColor: nodeColor }}>
        <Box sx={styles.headerContent}>
          <Box sx={styles.iconContainer}>{getNodeIcon(node.type)}</Box>
          <Typography variant="caption" sx={styles.title}>
            {node.data.name || node.type}
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
  switch (node.type) {
    case "input":
      return (
        <Typography variant="caption" sx={styles.contentText}>
          Value: {node.data.value || 0}
        </Typography>
      );
    case "output":
      return (
        <Typography variant="caption" sx={styles.contentText}>
          Output
        </Typography>
      );
    case "math":
      return (
        <Typography variant="caption" sx={styles.contentText}>
          {node.data.operation || "add"}
        </Typography>
      );
    case "transform":
      return (
        <Typography variant="caption" sx={styles.contentText}>
          {node.data.transformType || "translate"}
        </Typography>
      );
    case "material":
      return (
        <Box>
          <Typography variant="caption" sx={styles.contentText}>
            {node.data.materialType || "standard"}
          </Typography>
          {node.data.color && (
            <Box
              sx={{
                width: 20,
                height: 20,
                backgroundColor: node.data.color,
                border: "1px solid #666",
                borderRadius: "4px",
                margin: "4px auto",
              }}
            />
          )}
        </Box>
      );
    case "geometry":
      return (
        <Typography variant="caption" sx={styles.contentText}>
          {node.data.geometryType || "box"}
        </Typography>
      );
    case "filter":
      return (
        <Typography variant="caption" sx={styles.contentText}>
          {node.data.filterType || "blur"}
        </Typography>
      );
    case "condition":
      return (
        <Typography variant="caption" sx={styles.contentText}>
          {node.data.condition || "equals"}
        </Typography>
      );
    default:
      return (
        <Typography variant="caption" sx={styles.contentText}>
          {node.type}
        </Typography>
      );
  }
};

const styles = {
  node: {
    position: "absolute" as const,
    backgroundColor: "#2a2a2a",
    border: "2px solid #444",
    borderRadius: "8px",
    cursor: "move",
    userSelect: "none" as const,
    transition: "box-shadow 0.2s ease",
    "&:hover": {
      borderColor: "#666",
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "6px 6px 0 0",
    minHeight: "32px",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: "8px",
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    color: "#fff",
    "& svg": {
      fontSize: "16px",
    },
  },
  title: {
    flex: 1,
    color: "#fff",
    fontWeight: 600,
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  collapseButton: {
    color: "#fff",
    padding: "2px",
    "& svg": {
      fontSize: "14px",
    },
  },
  body: {
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  portsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  inputPort: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  outputPort: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "6px",
  },
  portCircle: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#00ccff",
    border: "2px solid #fff",
    cursor: "crosshair",
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "scale(1.2)",
      backgroundColor: "#0099cc",
    },
  },
  portLabel: {
    color: "#ccc",
    fontSize: "10px",
    fontWeight: 500,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4px 0",
    minHeight: "20px",
  },
  contentText: {
    color: "#fff",
    fontSize: "11px",
    fontWeight: 500,
    textAlign: "center",
  },
};

export default NodeComponent;

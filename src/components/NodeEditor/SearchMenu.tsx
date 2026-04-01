import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
} from "@mui/material";
import {
  Input,
  Output,
  Functions,
  Transform,
  Palette,
  Category,
  FilterAlt,
  Memory,
  Lightbulb,
  Videocam,
  Image,
  Code,
  LinearScale,
  ToggleOn,
  Place,
  Visibility,
  FormatListNumbered,
  Colorize,
  ViewList,
} from "@mui/icons-material";
import { NodeType } from "../../types/nodeTypes";

interface SearchMenuProps {
  position: { x: number; y: number };
  onNodeSelect: (nodeType: NodeType) => void;
  onClose: () => void;
}

interface NodeDefinition {
  type: NodeType;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  keywords: string[];
  color: string;
}

const nodeDefinitions: NodeDefinition[] = [
  {
    type: "input",
    name: "Input",
    description: "Numeric or vector input value",
    category: "Input/Output",
    icon: <Input sx={{ fontSize: 20 }} />,
    keywords: ["input", "value", "number", "parameter"],
    color: "#43e97b",
  },
  {
    type: "color",
    name: "Color",
    description: "Color picker input",
    category: "Input/Output",
    icon: <Colorize sx={{ fontSize: 20 }} />,
    keywords: ["color", "rgb", "picker", "paint"],
    color: "#E91E63",
  },
  {
    type: "numberSlider",
    name: "Number Slider",
    description: "Slider input for numbers with min/max range",
    category: "Input/Output",
    icon: <LinearScale sx={{ fontSize: 20 }} />,
    keywords: ["slider", "range", "number", "float", "parameter"],
    color: "#66BB6A",
  },
  {
    type: "booleanToggle",
    name: "Boolean Toggle",
    description: "Toggle switch for true/false values",
    category: "Input/Output",
    icon: <ToggleOn sx={{ fontSize: 20 }} />,
    keywords: ["boolean", "toggle", "switch", "true", "false", "flag"],
    color: "#FFA726",
  },
  {
    type: "point",
    name: "Point",
    description: "Creates a 3D point / vector3",
    category: "Input/Output",
    icon: <Place sx={{ fontSize: 20 }} />,
    keywords: ["point", "vector", "xyz", "position", "coordinate", "3d"],
    color: "#AB47BC",
  },
  {
    type: "output",
    name: "Output",
    description: "Output result node",
    category: "Input/Output",
    icon: <Output sx={{ fontSize: 20 }} />,
    keywords: ["output", "result", "final"],
    color: "#fa709a",
  },
  {
    type: "watch",
    name: "Watch",
    description: "Preview a value for debugging",
    category: "Input/Output",
    icon: <Visibility sx={{ fontSize: 20 }} />,
    keywords: ["watch", "preview", "debug", "inspect", "display", "monitor"],
    color: "#42A5F5",
  },
  {
    type: "math",
    name: "Math",
    description: "Mathematical operations (add, multiply, etc.)",
    category: "Math",
    icon: <Functions sx={{ fontSize: 20 }} />,
    keywords: ["math", "add", "subtract", "multiply", "divide", "operation"],
    color: "#667eea",
  },
  {
    type: "geometry",
    name: "Geometry",
    description: "Create geometric primitives",
    category: "Geometry",
    icon: <Category sx={{ fontSize: 20 }} />,
    keywords: ["geometry", "shape", "primitive", "cube", "sphere"],
    color: "#96fbc4",
  },
  {
    type: "mesh",
    name: "Mesh",
    description: "Create or modify mesh objects",
    category: "Geometry",
    icon: <Memory sx={{ fontSize: 20 }} />,
    keywords: ["mesh", "model", "vertices", "faces"],
    color: "#ffecd2",
  },
  {
    type: "transform",
    name: "Transform",
    description: "Transform position, rotation, scale",
    category: "Geometry",
    icon: <Transform sx={{ fontSize: 20 }} />,
    keywords: ["transform", "move", "rotate", "scale", "position"],
    color: "#f093fb",
  },
  {
    type: "material",
    name: "Material",
    description: "Material properties and shading",
    category: "Material",
    icon: <Palette sx={{ fontSize: 20 }} />,
    keywords: ["material", "shader", "surface", "pbr"],
    color: "#4facfe",
  },
  {
    type: "texture",
    name: "Texture",
    description: "Texture mapping and generation",
    category: "Material",
    icon: <Image sx={{ fontSize: 20 }} />,
    keywords: ["texture", "image", "uv", "map"],
    color: "#74b9ff",
  },
  {
    type: "light",
    name: "Light",
    description: "Scene lighting",
    category: "Lighting",
    icon: <Lightbulb sx={{ fontSize: 20 }} />,
    keywords: ["light", "illumination", "shadow"],
    color: "#ffeaa7",
  },
  {
    type: "camera",
    name: "Camera",
    description: "Camera controls and settings",
    category: "Lighting",
    icon: <Videocam sx={{ fontSize: 20 }} />,
    keywords: ["camera", "view", "perspective"],
    color: "#fd79a8",
  },
  {
    type: "filter",
    name: "Filter",
    description: "Apply filters and effects",
    category: "Utility",
    icon: <FilterAlt sx={{ fontSize: 20 }} />,
    keywords: ["filter", "effect", "blur", "sharpen"],
    color: "#fd79a8",
  },
  {
    type: "script",
    name: "Script",
    description: "Custom scripting node",
    category: "Utility",
    icon: <Code sx={{ fontSize: 20 }} />,
    keywords: ["script", "code", "custom", "javascript"],
    color: "#a29bfe",
  },
  {
    type: "list",
    name: "List",
    description: "Creates a list from connected items",
    category: "Utility",
    icon: <ViewList sx={{ fontSize: 20 }} />,
    keywords: ["list", "array", "collection", "items", "aggregate"],
    color: "#CE93D8",
  },
  {
    type: "sequence",
    name: "Sequence",
    description: "Generates a number sequence/range",
    category: "Utility",
    icon: <FormatListNumbered sx={{ fontSize: 20 }} />,
    keywords: ["sequence", "range", "series", "numbers", "iterate", "loop"],
    color: "#26A69A",
  },
  {
    type: "condition",
    name: "Condition",
    description: "Conditional logic and branching",
    category: "Logic",
    icon: <Functions sx={{ fontSize: 20 }} />,
    keywords: ["condition", "if", "logic", "branch"],
    color: "#81ecec",
  },
];

const SearchMenu: React.FC<SearchMenuProps> = ({
  position,
  onNodeSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter nodes based on search term
  const filteredNodes = nodeDefinitions.filter((node) => {
    const search = searchTerm.toLowerCase();
    return (
      node.name.toLowerCase().includes(search) ||
      node.description.toLowerCase().includes(search) ||
      node.category.toLowerCase().includes(search) ||
      node.keywords.some((keyword) => keyword.includes(search))
    );
  });

  // Group filtered nodes by category
  const groupedNodes = filteredNodes.reduce(
    (acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    },
    {} as Record<string, NodeDefinition[]>
  );

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredNodes.length - 1)
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (filteredNodes[selectedIndex]) {
          onNodeSelect(filteredNodes[selectedIndex].type);
        }
      }
    },
    [filteredNodes, selectedIndex, onNodeSelect, onClose]
  );

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  return (
    <Paper
      ref={menuRef}
      sx={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: 380,
        maxHeight: 500,
        zIndex: 1000,
        background:
          "linear-gradient(135deg, rgba(20, 25, 35, 0.98) 0%, rgba(25, 30, 40, 0.98) 100%)",
        border: "1px solid rgba(102, 126, 234, 0.3)",
        borderRadius: "12px",
        boxShadow:
          "0 12px 48px rgba(0, 0, 0, 0.6), 0 0 20px rgba(102, 126, 234, 0.15)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search Input */}
      <Box sx={{ p: 2, borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <TextField
          ref={searchInputRef}
          fullWidth
          variant="outlined"
          placeholder="Search nodes... (Tab/Shift+A)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              "& fieldset": {
                borderColor: "rgba(102, 126, 234, 0.3)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(102, 126, 234, 0.5)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#667eea",
                boxShadow: "0 0 8px rgba(102, 126, 234, 0.3)",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(255, 255, 255, 0.4)",
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Results */}
      <Box sx={{ maxHeight: 400, overflow: "auto" }}>
        {filteredNodes.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
              No nodes found
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedNodes).map(([category, nodes]) => (
            <Box key={category}>
              <Typography
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "rgba(102, 126, 234, 0.9)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                  borderLeft: "3px solid rgba(102, 126, 234, 0.5)",
                }}
              >
                {category}
              </Typography>
              <List sx={{ py: 0 }}>
                {nodes.map((node, index) => {
                  const globalIndex = filteredNodes.indexOf(node);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <ListItem
                      key={node.type}
                      component="div"
                      onClick={() => onNodeSelect(node.type)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backgroundColor: isSelected
                          ? "rgba(102, 126, 234, 0.2)"
                          : "transparent",
                        borderLeft: isSelected
                          ? "3px solid #667eea"
                          : "3px solid transparent",
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.15)",
                          borderLeft: "3px solid #667eea",
                          transform: "translateX(2px)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: node.color,
                        }}
                      >
                        {node.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              fontSize: "0.9rem",
                              fontWeight: 500,
                              color: "#fff",
                            }}
                          >
                            {node.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              color: "rgba(255, 255, 255, 0.5)",
                              mt: 0.5,
                            }}
                          >
                            {node.description}
                          </Typography>
                        }
                      />
                      <Chip
                        label={node.category}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          backgroundColor: `${node.color}20`,
                          color: node.color,
                          border: `1px solid ${node.color}40`,
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))
        )}
      </Box>

      {/* Footer hint */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <Typography
          sx={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.4)" }}
        >
          ↑↓ Navigate • Enter Select • Esc Close
        </Typography>
      </Box>
    </Paper>
  );
};

export default SearchMenu;

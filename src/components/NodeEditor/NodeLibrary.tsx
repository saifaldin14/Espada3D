import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { NodeType, NodeLibraryItem } from "../../types/nodeTypes";

interface NodeLibraryProps {
  onNodeDragStart: (nodeType: NodeType) => void;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ onNodeDragStart }) => {
  const nodeLibraryItems: NodeLibraryItem[] = [
    // Input/Output
    {
      type: "input",
      name: "Input",
      description: "Input value node",
      category: "input",
      icon: "📥",
      color: "#4CAF50",
    },
    {
      type: "color",
      name: "Color",
      description: "Color picker input",
      category: "input",
      icon: "🎨",
      color: "#E91E63",
    },
    {
      type: "output",
      name: "Output",
      description: "Output result node",
      category: "output",
      icon: "📤",
      color: "#F44336",
    },

    // Math
    {
      type: "math",
      name: "Math",
      description: "Mathematical operations",
      category: "math",
      icon: "🧮",
      color: "#2196F3",
    },

    // Geometry
    {
      type: "geometry",
      name: "Geometry",
      description: "Create geometric shapes",
      category: "geometry",
      icon: "📐",
      color: "#00BCD4",
    },
    {
      type: "mesh",
      name: "Mesh",
      description: "Create or modify mesh objects",
      category: "geometry",
      icon: "🔷",
      color: "#00BCD4",
    },
    {
      type: "transform",
      name: "Transform",
      description: "Transform geometry",
      category: "geometry",
      icon: "🔄",
      color: "#FF9800",
    },

    // Material
    {
      type: "material",
      name: "Material",
      description: "Material properties",
      category: "material",
      icon: "🎨",
      color: "#9C27B0",
    },
    {
      type: "texture",
      name: "Texture",
      description: "Texture mapping and generation",
      category: "material",
      icon: "🖼️",
      color: "#9C27B0",
    },

    // Lighting
    {
      type: "light",
      name: "Light",
      description: "Scene lighting",
      category: "lighting",
      icon: "💡",
      color: "#FFEB3B",
    },
    {
      type: "camera",
      name: "Camera",
      description: "Camera controls",
      category: "lighting",
      icon: "📷",
      color: "#FFEB3B",
    },

    // Utility
    {
      type: "filter",
      name: "Filter",
      description: "Apply filters and effects",
      category: "utility",
      icon: "🔍",
      color: "#795548",
    },
    {
      type: "script",
      name: "Script",
      description: "Custom scripting node",
      category: "utility",
      icon: "📜",
      color: "#795548",
    },

    // Logic
    {
      type: "condition",
      name: "Condition",
      description: "Conditional logic",
      category: "logic",
      icon: "❓",
      color: "#607D8B",
    },
  ];

  const categories = [
    { name: "input", title: "Input/Output", expanded: true },
    { name: "math", title: "Mathematics", expanded: true },
    { name: "geometry", title: "Geometry", expanded: true },
    { name: "material", title: "Materials", expanded: false },
    { name: "lighting", title: "Lighting", expanded: false },
    { name: "utility", title: "Utilities", expanded: false },
    { name: "logic", title: "Logic", expanded: false },
  ];

  const handleDragStart = (nodeType: NodeType) => {
    onNodeDragStart(nodeType);
  };

  const getNodesByCategory = (category: string) => {
    return nodeLibraryItems.filter((item) => item.category === category);
  };

  return (
    <Box sx={styles.container}>
      <Typography variant="h6" sx={styles.header}>
        Node Library
      </Typography>

      <Box sx={styles.categoriesContainer}>
        {categories.map((category) => {
          const nodes = getNodesByCategory(category.name);

          if (nodes.length === 0) return null;

          return (
            <Accordion
              key={category.name}
              defaultExpanded={category.expanded}
              sx={styles.accordion}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: "#ccc" }} />}
                sx={styles.accordionSummary}
              >
                <Typography sx={styles.categoryTitle}>
                  {category.title}
                </Typography>
              </AccordionSummary>

              <AccordionDetails sx={styles.accordionDetails}>
                {nodes.map((item) => (
                  <Box
                    key={item.type}
                    sx={styles.nodeItem}
                    draggable
                    onDragStart={() => handleDragStart(item.type)}
                    title={item.description}
                  >
                    <Box sx={styles.nodeIcon}>{item.icon}</Box>
                    <Typography sx={styles.nodeName}>{item.name}</Typography>
                    <Box
                      sx={{
                        ...styles.nodeColorIndicator,
                        backgroundColor: item.color,
                      }}
                    />
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>

      {/* Instructions */}
      <Box sx={styles.instructions}>
        <Typography variant="caption" sx={styles.instructionText}>
          💡 Drag nodes to canvas
        </Typography>
        <Typography variant="caption" sx={styles.instructionText}>
          🔗 Connect output to input ports
        </Typography>
        <Typography variant="caption" sx={styles.instructionText}>
          ⌫ Right-click or double-click to delete connections
        </Typography>
        <Typography variant="caption" sx={styles.instructionText}>
          🎯 Click connections to select and show delete button
        </Typography>
      </Box>
    </Box>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  header: {
    color: "#fff",
    padding: "16px 12px 8px",
    fontSize: "14px",
    fontWeight: 600,
    borderBottom: "1px solid #333",
    flexShrink: 0,
  },
  categoriesContainer: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "8px 0",
    scrollBehavior: "smooth",
    minHeight: 0, // This is crucial for flex children to be scrollable
    // Custom scrollbar styling
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.05)",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.2)",
      borderRadius: "3px",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.3)",
      },
    },
    // Firefox scrollbar styling
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
  },
  accordion: {
    backgroundColor: "transparent",
    boxShadow: "none",
    "&:before": {
      display: "none",
    },
    "& .MuiAccordionSummary-root": {
      minHeight: "40px",
      padding: "0 12px",
    },
    "& .MuiAccordionDetails-root": {
      padding: "0 8px 8px",
    },
  },
  accordionSummary: {
    backgroundColor: "#333",
    borderRadius: "4px",
    margin: "4px 8px",
    "&:hover": {
      backgroundColor: "#3a3a3a",
    },
  },
  categoryTitle: {
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
  },
  accordionDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  nodeItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "#333",
    borderRadius: "6px",
    cursor: "grab",
    transition: "all 0.2s ease",
    border: "1px solid transparent",
    "&:hover": {
      backgroundColor: "#3a3a3a",
      borderColor: "#555",
      transform: "translateY(-1px)",
    },
    "&:active": {
      cursor: "grabbing",
      transform: "translateY(0)",
    },
  },
  nodeIcon: {
    fontSize: "16px",
    width: "20px",
    textAlign: "center",
  },
  nodeName: {
    flex: 1,
    color: "#fff",
    fontSize: "11px",
    fontWeight: 500,
  },
  nodeColorIndicator: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  instructions: {
    padding: "12px",
    borderTop: "1px solid #333",
    backgroundColor: "#252525",
    flexShrink: 0,
  },
  instructionText: {
    display: "block",
    color: "#999",
    fontSize: "10px",
    lineHeight: 1.4,
    marginBottom: "4px",
    "&:last-child": {
      marginBottom: 0,
    },
  },
};

export default NodeLibrary;

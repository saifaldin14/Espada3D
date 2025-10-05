import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore,
  Input,
  Output,
  Palette,
  Calculate,
  Category,
  Interests,
  Transform,
  Texture,
  Lightbulb,
  Videocam,
  FilterList,
  Code,
  Help,
} from "@mui/icons-material";
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
      icon: "Input",
      color: "#43e97b",
    },
    {
      type: "color",
      name: "Color",
      description: "Color picker input",
      category: "input",
      icon: "Palette",
      color: "#fa709a",
    },
    {
      type: "output",
      name: "Output",
      description: "Output result node",
      category: "output",
      icon: "Output",
      color: "#fa709a",
    },

    // Math
    {
      type: "math",
      name: "Math",
      description: "Mathematical operations",
      category: "math",
      icon: "Calculate",
      color: "#667eea",
    },

    // Geometry
    {
      type: "geometry",
      name: "Geometry",
      description: "Create geometric shapes",
      category: "geometry",
      icon: "Category",
      color: "#00c9ff",
    },
    {
      type: "mesh",
      name: "Mesh",
      description: "Create or modify mesh objects",
      category: "geometry",
      icon: "Interests",
      color: "#00c9ff",
    },
    {
      type: "transform",
      name: "Transform",
      description: "Transform geometry",
      category: "geometry",
      icon: "Transform",
      color: "#fa709a",
    },

    // Material
    {
      type: "material",
      name: "Material",
      description: "Material properties",
      category: "material",
      icon: "Palette",
      color: "#764ba2",
    },
    {
      type: "texture",
      name: "Texture",
      description: "Texture mapping and generation",
      category: "material",
      icon: "Texture",
      color: "#764ba2",
    },

    // Lighting
    {
      type: "light",
      name: "Light",
      description: "Scene lighting",
      category: "lighting",
      icon: "Lightbulb",
      color: "#f6d365",
    },
    {
      type: "camera",
      name: "Camera",
      description: "Camera controls",
      category: "lighting",
      icon: "Videocam",
      color: "#f6d365",
    },

    // Utility
    {
      type: "filter",
      name: "Filter",
      description: "Apply filters and effects",
      category: "utility",
      icon: "FilterList",
      color: "#667eea",
    },
    {
      type: "script",
      name: "Script",
      description: "Custom scripting node",
      category: "utility",
      icon: "Code",
      color: "#667eea",
    },

    // Logic
    {
      type: "condition",
      name: "Condition",
      description: "Conditional logic",
      category: "logic",
      icon: "Help",
      color: "#00c9ff",
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

  const getIconComponent = (iconName: string) => {
    const iconProps = { sx: { fontSize: 16 } };
    switch (iconName) {
      case "Input":
        return <Input {...iconProps} />;
      case "Output":
        return <Output {...iconProps} />;
      case "Palette":
        return <Palette {...iconProps} />;
      case "Calculate":
        return <Calculate {...iconProps} />;
      case "Category":
        return <Category {...iconProps} />;
      case "Interests":
        return <Interests {...iconProps} />;
      case "Transform":
        return <Transform {...iconProps} />;
      case "Texture":
        return <Texture {...iconProps} />;
      case "Lightbulb":
        return <Lightbulb {...iconProps} />;
      case "Videocam":
        return <Videocam {...iconProps} />;
      case "FilterList":
        return <FilterList {...iconProps} />;
      case "Code":
        return <Code {...iconProps} />;
      case "Help":
        return <Help {...iconProps} />;
      default:
        return <Category {...iconProps} />;
    }
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
                expandIcon={
                  <ExpandMore sx={{ color: "rgba(255, 255, 255, 0.6)" }} />
                }
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
                    <Box sx={styles.nodeIcon}>
                      {getIconComponent(item.icon)}
                    </Box>
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
          Drag nodes to canvas
        </Typography>
        <Typography variant="caption" sx={styles.instructionText}>
          Connect output to input ports
        </Typography>
        <Typography variant="caption" sx={styles.instructionText}>
          Right-click or double-click to delete connections
        </Typography>
        <Typography variant="caption" sx={styles.instructionText}>
          Click connections to select and show delete button
        </Typography>
      </Box>
    </Box>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(20, 25, 35, 0.95)",
    backdropFilter: "blur(10px)",
  },
  header: {
    color: "#ffffff",
    padding: "16px 16px 12px",
    fontSize: "15px",
    fontWeight: 600,
    borderBottom: "1px solid rgba(102, 126, 234, 0.2)",
    flexShrink: 0,
    background:
      "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
  },
  categoriesContainer: {
    flex: 1,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    padding: "8px 0",
    scrollBehavior: "smooth" as const,
    minHeight: 0,
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(102, 126, 234, 0.3)",
      borderRadius: "3px",
      "&:hover": {
        background: "rgba(102, 126, 234, 0.5)",
      },
    },
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(102, 126, 234, 0.3) rgba(255, 255, 255, 0.03)",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "6px",
    margin: "4px 8px",
    border: "1px solid rgba(102, 126, 234, 0.15)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(102, 126, 234, 0.3)",
    },
  },
  categoryTitle: {
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.5px",
  },
  accordionDetails: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  nodeItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "8px",
    cursor: "grab",
    transition: "all 0.2s ease",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    "&:hover": {
      backgroundColor: "rgba(102, 126, 234, 0.15)",
      borderColor: "rgba(102, 126, 234, 0.4)",
      transform: "translateX(4px)",
      boxShadow: "0 2px 8px rgba(102, 126, 234, 0.2)",
    },
    "&:active": {
      cursor: "grabbing",
      transform: "translateX(2px)",
    },
  },
  nodeIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    color: "rgba(255, 255, 255, 0.9)",
    flexShrink: 0,
  },
  nodeName: {
    flex: 1,
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 500,
    letterSpacing: "0.3px",
  },
  nodeColorIndicator: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    flexShrink: 0,
    boxShadow: "0 0 4px rgba(0, 0, 0, 0.3)",
  },
  instructions: {
    padding: "14px 16px",
    borderTop: "1px solid rgba(102, 126, 234, 0.2)",
    backgroundColor: "rgba(10, 15, 25, 0.8)",
    flexShrink: 0,
  },
  instructionText: {
    display: "block",
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "11px",
    lineHeight: 1.6,
    marginBottom: "6px",
    "&:last-child": {
      marginBottom: 0,
    },
    "&:before": {
      content: '"• "',
      color: "rgba(102, 126, 234, 0.6)",
      fontWeight: 600,
    },
  },
};

export default NodeLibrary;

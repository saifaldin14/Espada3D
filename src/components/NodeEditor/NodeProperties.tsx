import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Divider,
} from "@mui/material";
import { SketchPicker } from "react-color";
import { Node, NodeData } from "../../types/nodeTypes";

interface NodePropertiesProps {
  node: Node;
  onUpdateData: (data: Partial<NodeData>) => void;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({
  node,
  onUpdateData,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleValueChange = (key: string, value: any) => {
    onUpdateData({ [key]: value });
  };

  const renderInputControls = () => {
    switch (node.type) {
      case "input":
        return (
          <>
            <TextField
              label="Name"
              value={node.data.name || ""}
              onChange={(e) => handleValueChange("name", e.target.value)}
              size="small"
              fullWidth
              sx={styles.textField}
            />
            <TextField
              label="Value"
              type="number"
              value={node.data.value || 0}
              onChange={(e) =>
                handleValueChange("value", parseFloat(e.target.value) || 0)
              }
              size="small"
              fullWidth
              sx={styles.textField}
            />
          </>
        );

      case "output":
        return (
          <TextField
            label="Name"
            value={node.data.name || ""}
            onChange={(e) => handleValueChange("name", e.target.value)}
            size="small"
            fullWidth
            sx={styles.textField}
          />
        );

      case "math":
        return (
          <>
            <FormControl fullWidth size="small" sx={styles.formControl}>
              <InputLabel sx={styles.inputLabel}>Operation</InputLabel>
              <Select
                value={node.data.operation || "add"}
                onChange={(e) => handleValueChange("operation", e.target.value)}
                sx={styles.select}
              >
                <MenuItem value="add">Add (+)</MenuItem>
                <MenuItem value="subtract">Subtract (-)</MenuItem>
                <MenuItem value="multiply">Multiply (×)</MenuItem>
                <MenuItem value="divide">Divide (÷)</MenuItem>
                <MenuItem value="power">Power (^)</MenuItem>
                <MenuItem value="sin">Sine</MenuItem>
                <MenuItem value="cos">Cosine</MenuItem>
                <MenuItem value="tan">Tangent</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Value A"
              type="number"
              value={node.data.valueA || 0}
              onChange={(e) =>
                handleValueChange("valueA", parseFloat(e.target.value) || 0)
              }
              size="small"
              fullWidth
              sx={styles.textField}
            />
            <TextField
              label="Value B"
              type="number"
              value={node.data.valueB || 0}
              onChange={(e) =>
                handleValueChange("valueB", parseFloat(e.target.value) || 0)
              }
              size="small"
              fullWidth
              sx={styles.textField}
            />
          </>
        );

      case "transform":
        return (
          <>
            <FormControl fullWidth size="small" sx={styles.formControl}>
              <InputLabel sx={styles.inputLabel}>Transform Type</InputLabel>
              <Select
                value={node.data.transformType || "translate"}
                onChange={(e) =>
                  handleValueChange("transformType", e.target.value)
                }
                sx={styles.select}
              >
                <MenuItem value="translate">Translate</MenuItem>
                <MenuItem value="rotate">Rotate</MenuItem>
                <MenuItem value="scale">Scale</MenuItem>
              </Select>
            </FormControl>
            <Box sx={styles.vectorInput}>
              <Typography variant="caption" sx={styles.label}>
                {node.data.transformType === "rotate"
                  ? "Rotation (deg)"
                  : node.data.transformType === "scale"
                    ? "Scale Factor"
                    : "Translation"}
              </Typography>
              <Box sx={styles.vectorRow}>
                <TextField
                  label="X"
                  type="number"
                  value={
                    (Array.isArray(node.data.value) ? node.data.value[0] : 0) ||
                    0
                  }
                  onChange={(e) => {
                    const currentValue = Array.isArray(node.data.value)
                      ? node.data.value
                      : [0, 0, 0];
                    const newValue = [...currentValue];
                    newValue[0] = parseFloat(e.target.value) || 0;
                    handleValueChange("value", newValue);
                  }}
                  size="small"
                  sx={styles.vectorField}
                />
                <TextField
                  label="Y"
                  type="number"
                  value={
                    (Array.isArray(node.data.value) ? node.data.value[1] : 0) ||
                    0
                  }
                  onChange={(e) => {
                    const currentValue = Array.isArray(node.data.value)
                      ? node.data.value
                      : [0, 0, 0];
                    const newValue = [...currentValue];
                    newValue[1] = parseFloat(e.target.value) || 0;
                    handleValueChange("value", newValue);
                  }}
                  size="small"
                  sx={styles.vectorField}
                />
                <TextField
                  label="Z"
                  type="number"
                  value={
                    (Array.isArray(node.data.value) ? node.data.value[2] : 0) ||
                    0
                  }
                  onChange={(e) => {
                    const currentValue = Array.isArray(node.data.value)
                      ? node.data.value
                      : [0, 0, 0];
                    const newValue = [...currentValue];
                    newValue[2] = parseFloat(e.target.value) || 0;
                    handleValueChange("value", newValue);
                  }}
                  size="small"
                  sx={styles.vectorField}
                />
              </Box>
            </Box>
          </>
        );

      case "material":
        return (
          <>
            <FormControl fullWidth size="small" sx={styles.formControl}>
              <InputLabel sx={styles.inputLabel}>Material Type</InputLabel>
              <Select
                value={node.data.materialType || "standard"}
                onChange={(e) =>
                  handleValueChange("materialType", e.target.value)
                }
                sx={styles.select}
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="phong">Phong</MenuItem>
                <MenuItem value="lambert">Lambert</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="physical">Physical</MenuItem>
                <MenuItem value="toon">Toon</MenuItem>
              </Select>
            </FormControl>

            <Box sx={styles.colorControl}>
              <Typography variant="caption" sx={styles.label}>
                Color
              </Typography>
              <Box sx={styles.colorPreview}>
                <Box
                  sx={{
                    ...styles.colorSwatch,
                    backgroundColor: node.data.color || "#ffffff",
                  }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <Typography variant="caption" sx={styles.colorValue}>
                  {node.data.color || "#ffffff"}
                </Typography>
              </Box>
              {showColorPicker && (
                <Box sx={styles.colorPickerContainer}>
                  <SketchPicker
                    color={node.data.color || "#ffffff"}
                    onChange={(color: any) =>
                      handleValueChange("color", color.hex)
                    }
                  />
                </Box>
              )}
            </Box>

            <Box sx={styles.sliderControl}>
              <Typography variant="caption" sx={styles.label}>
                Roughness: {(node.data.roughness || 0.5).toFixed(2)}
              </Typography>
              <Slider
                value={node.data.roughness || 0.5}
                onChange={(_: any, value: any) =>
                  handleValueChange("roughness", value)
                }
                min={0}
                max={1}
                step={0.01}
                sx={styles.slider}
              />
            </Box>

            <Box sx={styles.sliderControl}>
              <Typography variant="caption" sx={styles.label}>
                Metalness: {(node.data.metalness || 0).toFixed(2)}
              </Typography>
              <Slider
                value={node.data.metalness || 0}
                onChange={(_: any, value: any) =>
                  handleValueChange("metalness", value)
                }
                min={0}
                max={1}
                step={0.01}
                sx={styles.slider}
              />
            </Box>
          </>
        );

      case "geometry":
        return (
          <>
            <FormControl fullWidth size="small" sx={styles.formControl}>
              <InputLabel sx={styles.inputLabel}>Geometry Type</InputLabel>
              <Select
                value={node.data.geometryType || "box"}
                onChange={(e) =>
                  handleValueChange("geometryType", e.target.value)
                }
                sx={styles.select}
              >
                <MenuItem value="box">Box</MenuItem>
                <MenuItem value="sphere">Sphere</MenuItem>
                <MenuItem value="cylinder">Cylinder</MenuItem>
                <MenuItem value="plane">Plane</MenuItem>
                <MenuItem value="cone">Cone</MenuItem>
                <MenuItem value="torus">Torus</MenuItem>
              </Select>
            </FormControl>

            <Box sx={styles.vectorInput}>
              <Typography variant="caption" sx={styles.label}>
                Dimensions
              </Typography>
              <Box sx={styles.vectorRow}>
                <TextField
                  label="Width"
                  type="number"
                  value={node.data.dimensions?.[0] || 1}
                  onChange={(e) => {
                    const newDimensions = [
                      ...(node.data.dimensions || [1, 1, 1]),
                    ];
                    newDimensions[0] = parseFloat(e.target.value) || 1;
                    handleValueChange("dimensions", newDimensions);
                  }}
                  size="small"
                  sx={styles.vectorField}
                />
                <TextField
                  label="Height"
                  type="number"
                  value={node.data.dimensions?.[1] || 1}
                  onChange={(e) => {
                    const newDimensions = [
                      ...(node.data.dimensions || [1, 1, 1]),
                    ];
                    newDimensions[1] = parseFloat(e.target.value) || 1;
                    handleValueChange("dimensions", newDimensions);
                  }}
                  size="small"
                  sx={styles.vectorField}
                />
                <TextField
                  label="Depth"
                  type="number"
                  value={node.data.dimensions?.[2] || 1}
                  onChange={(e) => {
                    const newDimensions = [
                      ...(node.data.dimensions || [1, 1, 1]),
                    ];
                    newDimensions[2] = parseFloat(e.target.value) || 1;
                    handleValueChange("dimensions", newDimensions);
                  }}
                  size="small"
                  sx={styles.vectorField}
                />
              </Box>
            </Box>
          </>
        );

      case "filter":
        return (
          <>
            <FormControl fullWidth size="small" sx={styles.formControl}>
              <InputLabel sx={styles.inputLabel}>Filter Type</InputLabel>
              <Select
                value={node.data.filterType || "blur"}
                onChange={(e) =>
                  handleValueChange("filterType", e.target.value)
                }
                sx={styles.select}
              >
                <MenuItem value="blur">Blur</MenuItem>
                <MenuItem value="sharpen">Sharpen</MenuItem>
                <MenuItem value="noise">Noise</MenuItem>
                <MenuItem value="brightness">Brightness</MenuItem>
                <MenuItem value="contrast">Contrast</MenuItem>
              </Select>
            </FormControl>

            <Box sx={styles.sliderControl}>
              <Typography variant="caption" sx={styles.label}>
                Strength: {(node.data.strength || 1).toFixed(2)}
              </Typography>
              <Slider
                value={node.data.strength || 1}
                onChange={(_: any, value: any) =>
                  handleValueChange("strength", value)
                }
                min={0}
                max={5}
                step={0.1}
                sx={styles.slider}
              />
            </Box>
          </>
        );

      case "condition":
        return (
          <>
            <FormControl fullWidth size="small" sx={styles.formControl}>
              <InputLabel sx={styles.inputLabel}>Condition</InputLabel>
              <Select
                value={node.data.condition || "equals"}
                onChange={(e) => handleValueChange("condition", e.target.value)}
                sx={styles.select}
              >
                <MenuItem value="equals">Equals (==)</MenuItem>
                <MenuItem value="greater">Greater (&gt;)</MenuItem>
                <MenuItem value="less">Less (&lt;)</MenuItem>
                <MenuItem value="not">Not (!)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Compare Value"
              type="number"
              value={node.data.value || 0}
              onChange={(e) =>
                handleValueChange("value", parseFloat(e.target.value) || 0)
              }
              size="small"
              fullWidth
              sx={styles.textField}
            />
          </>
        );

      default:
        return (
          <Typography variant="body2" sx={styles.noProperties}>
            No properties available for this node type.
          </Typography>
        );
    }
  };

  return (
    <Box sx={styles.container}>
      <Typography variant="h6" sx={styles.header}>
        Node Properties
      </Typography>

      <Box sx={styles.nodeInfo}>
        <Typography variant="caption" sx={styles.infoLabel}>
          Type: {node.type}
        </Typography>
        <Typography variant="caption" sx={styles.infoLabel}>
          ID: {node.id.substring(0, 8)}...
        </Typography>
      </Box>

      <Divider sx={{ backgroundColor: "#333", margin: "8px 0" }} />

      <Box sx={styles.propertiesContainer}>{renderInputControls()}</Box>

      <Box sx={styles.actions}>
        <Button
          variant="outlined"
          size="small"
          sx={styles.actionButton}
          onClick={() => {
            // Reset to default values
            onUpdateData({});
          }}
        >
          Reset
        </Button>
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
  },
  header: {
    color: "#fff",
    padding: "16px 12px 8px",
    fontSize: "14px",
    fontWeight: 600,
    borderBottom: "1px solid #333",
  },
  nodeInfo: {
    padding: "8px 12px",
    backgroundColor: "#333",
    margin: "8px",
    borderRadius: "4px",
  },
  infoLabel: {
    display: "block",
    color: "#ccc",
    fontSize: "11px",
    marginBottom: "2px",
  },
  propertiesContainer: {
    flex: 1,
    overflow: "auto",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  textField: {
    "& .MuiInputLabel-root": {
      color: "#ccc",
    },
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      "& fieldset": {
        borderColor: "#555",
      },
      "&:hover fieldset": {
        borderColor: "#777",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#00ccff",
      },
    },
  },
  formControl: {
    "& .MuiInputLabel-root": {
      color: "#ccc",
    },
  },
  inputLabel: {
    color: "#ccc",
  },
  select: {
    color: "#fff",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#555",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#777",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#00ccff",
    },
    "& .MuiSvgIcon-root": {
      color: "#ccc",
    },
  },
  vectorInput: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  vectorRow: {
    display: "flex",
    gap: "4px",
  },
  vectorField: {
    flex: 1,
    "& .MuiInputLabel-root": {
      color: "#ccc",
    },
    "& .MuiOutlinedInput-root": {
      color: "#fff",
      "& fieldset": {
        borderColor: "#555",
      },
      "&:hover fieldset": {
        borderColor: "#777",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#00ccff",
      },
    },
  },
  label: {
    color: "#ccc",
    fontSize: "12px",
    fontWeight: 500,
  },
  colorControl: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  colorPreview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  colorSwatch: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "2px solid #555",
    cursor: "pointer",
    "&:hover": {
      borderColor: "#777",
    },
  },
  colorValue: {
    color: "#ccc",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  colorPickerContainer: {
    position: "relative",
    zIndex: 1000,
  },
  sliderControl: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  slider: {
    color: "#00ccff",
    "& .MuiSlider-track": {
      backgroundColor: "#00ccff",
    },
    "& .MuiSlider-thumb": {
      backgroundColor: "#00ccff",
    },
  },
  actions: {
    padding: "12px",
    borderTop: "1px solid #333",
  },
  actionButton: {
    color: "#00ccff",
    borderColor: "#00ccff",
    fontSize: "11px",
    "&:hover": {
      borderColor: "#0099cc",
      backgroundColor: "rgba(0, 204, 255, 0.1)",
    },
  },
  noProperties: {
    color: "#999",
    textAlign: "center",
    padding: "24px 0",
    fontStyle: "italic",
  },
};

export default NodeProperties;

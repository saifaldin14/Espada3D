import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  ButtonGroup,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Paper,
  Divider,
} from "@mui/material";
import {
  Delete,
  OpenInFull,
  ZoomOut,
  SelectAll,
  DeselectOutlined,
  CallSplit,
  Add,
  Remove,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setSubObjectSelectionMode } from "../../store/slices/uiSlice";
import { SelectionMode } from "../../types";
import { useMeshEditor } from "../../hooks/useMeshEditor";

interface FaceEditorProps {
  modelId: string;
}

const FaceEditor: React.FC<FaceEditorProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  // Use the mesh editor hook
  const {
    meshData,
    extrudeFaces,
    insetFaces,
    subdivideFaces,
    deleteSelectedElements,
    selectAll,
    deselectAll,
    growSelection,
    shrinkSelection,
  } = useMeshEditor(modelId);

  // Operation parameters
  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [extrudeDirection, setExtrudeDirection] = useState<"normal" | "custom">(
    "normal"
  );
  const [customDirection, setCustomDirection] = useState<
    [number, number, number]
  >([0, 0, 1]);
  const [individualFaces, setIndividualFaces] = useState(false);

  const [insetDistance, setInsetDistance] = useState(0.1);
  const [insetDepth, setInsetDepth] = useState(0.0);

  const [subdivisionCuts, setSubdivisionCuts] = useState(1);
  const [subdivisionSmooth, setSubdivisionSmooth] = useState(0.0);

  if (!meshData) {
    return (
      <Card>
        <CardContent>
          <Typography>No mesh data available for editing</Typography>
        </CardContent>
      </Card>
    );
  }

  const selectedFaces = meshData.faces.filter((f) => f.selected);
  const totalFaces = meshData.faces.length;

  const handleSelectionModeChange = (mode: SelectionMode) => {
    dispatch(setSubObjectSelectionMode(mode));
  };

  const handleSelectAll = () => {
    selectAll("face");
  };

  const handleDeselectAll = () => {
    deselectAll("face");
  };

  const handleGrowSelection = () => {
    growSelection("face");
  };

  const handleShrinkSelection = () => {
    shrinkSelection("face");
  };

  const handleExtrudeFaces = () => {
    if (selectedFaces.length === 0) return;
    const direction =
      extrudeDirection === "custom" ? customDirection : undefined;
    extrudeFaces(extrudeDistance, direction, individualFaces);
  };

  const handleInsetFaces = () => {
    if (selectedFaces.length === 0) return;
    insetFaces(insetDistance, insetDepth, individualFaces);
  };

  const handleSubdivideFaces = () => {
    if (selectedFaces.length === 0) return;
    subdivideFaces(subdivisionCuts, subdivisionSmooth);
  };

  const handleDeleteFaces = () => {
    if (selectedFaces.length === 0) return;
    deleteSelectedElements();
  };

  const styles = {
    card: {
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "16px",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#e0e0e0",
      marginBottom: "12px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "8px",
      marginBottom: "16px",
    },
    statCard: {
      background: "rgba(255, 255, 255, 0.05)",
      padding: "8px 12px",
      borderRadius: "6px",
      textAlign: "center" as const,
    },
    operationButton: {
      borderRadius: "8px",
      textTransform: "none" as const,
      padding: "8px 16px",
      fontSize: "13px",
    },
  };

  return (
    <Box>
      {/* Face Statistics */}
      <Paper sx={styles.card} elevation={0}>
        <Typography sx={styles.sectionTitle}>Face Statistics</Typography>
        <Box sx={styles.statsGrid}>
          <Box sx={styles.statCard}>
            <Typography variant="caption" color="textSecondary">
              Total Faces
            </Typography>
            <Typography variant="h6" color="primary">
              {totalFaces}
            </Typography>
          </Box>
          <Box sx={styles.statCard}>
            <Typography variant="caption" color="textSecondary">
              Selected
            </Typography>
            <Typography variant="h6" color="secondary">
              {selectedFaces.length}
            </Typography>
          </Box>
        </Box>

        {/* Selection Mode */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={styles.sectionTitle}>Selection Mode</Typography>
          <ButtonGroup size="small" fullWidth>
            <Button
              variant={selectionMode === "single" ? "contained" : "outlined"}
              onClick={() => handleSelectionModeChange("single")}
              sx={styles.operationButton}
            >
              Single
            </Button>
            <Button
              variant={selectionMode === "multiple" ? "contained" : "outlined"}
              onClick={() => handleSelectionModeChange("multiple")}
              sx={styles.operationButton}
            >
              Multiple
            </Button>
            <Button
              variant={selectionMode === "box" ? "contained" : "outlined"}
              onClick={() => handleSelectionModeChange("box")}
              sx={styles.operationButton}
            >
              Box
            </Button>
          </ButtonGroup>
        </Box>

        {/* Selection Operations */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={styles.sectionTitle}>Selection Operations</Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<SelectAll />}
                onClick={handleSelectAll}
                sx={styles.operationButton}
              >
                Select All
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DeselectOutlined />}
                onClick={handleDeselectAll}
                sx={styles.operationButton}
              >
                Deselect
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Add />}
                onClick={handleGrowSelection}
                disabled={selectedFaces.length === 0}
                sx={styles.operationButton}
              >
                Grow
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Remove />}
                onClick={handleShrinkSelection}
                disabled={selectedFaces.length === 0}
                sx={styles.operationButton}
              >
                Shrink
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Selected Faces Info */}
      {selectedFaces.length > 0 && (
        <Paper sx={styles.card} elevation={0}>
          <Typography sx={styles.sectionTitle}>Selected Faces</Typography>
          <List dense>
            {selectedFaces.slice(0, 5).map((face: any) => (
              <ListItem key={face.index}>
                <ListItemText
                  primary={`Face ${face.index}`}
                  secondary={`Vertices: ${face.vertices.length} | Normal: ${face.normal
                    .map((v: number) => v.toFixed(2))
                    .join(", ")}`}
                />
              </ListItem>
            ))}
            {selectedFaces.length > 5 && (
              <ListItem>
                <ListItemText
                  primary={`... and ${selectedFaces.length - 5} more`}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {/* Face Operations */}
      <Paper sx={styles.card} elevation={0}>
        <Typography sx={styles.sectionTitle}>Face Operations</Typography>

        {/* Extrude Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#e0e0e0" }}>
            Extrude
          </Typography>

          <TextField
            label="Distance"
            type="number"
            size="small"
            fullWidth
            value={extrudeDistance}
            onChange={(e) =>
              setExtrudeDistance(parseFloat(e.target.value) || 0)
            }
            inputProps={{ step: 0.1 }}
            sx={{ mb: 1 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={extrudeDirection}
              label="Direction"
              onChange={(e) =>
                setExtrudeDirection(e.target.value as "normal" | "custom")
              }
            >
              <MenuItem value="normal">Face Normal</MenuItem>
              <MenuItem value="custom">Custom Direction</MenuItem>
            </Select>
          </FormControl>

          {extrudeDirection === "custom" && (
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <TextField
                  label="X"
                  type="number"
                  size="small"
                  value={customDirection[0]}
                  onChange={(e) =>
                    setCustomDirection([
                      parseFloat(e.target.value) || 0,
                      customDirection[1],
                      customDirection[2],
                    ])
                  }
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Y"
                  type="number"
                  size="small"
                  value={customDirection[1]}
                  onChange={(e) =>
                    setCustomDirection([
                      customDirection[0],
                      parseFloat(e.target.value) || 0,
                      customDirection[2],
                    ])
                  }
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Z"
                  type="number"
                  size="small"
                  value={customDirection[2]}
                  onChange={(e) =>
                    setCustomDirection([
                      customDirection[0],
                      customDirection[1],
                      parseFloat(e.target.value) || 0,
                    ])
                  }
                  inputProps={{ step: 0.1 }}
                />
              </Grid>
            </Grid>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={individualFaces}
                onChange={(e) => setIndividualFaces(e.target.checked)}
              />
            }
            label="Individual Faces"
            sx={{ mb: 1 }}
          />

          <Button
            variant="contained"
            fullWidth
            startIcon={<OpenInFull />}
            onClick={handleExtrudeFaces}
            disabled={selectedFaces.length === 0}
            sx={styles.operationButton}
          >
            Extrude Selected (E)
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Inset Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#e0e0e0" }}>
            Inset
          </Typography>

          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Distance"
                type="number"
                size="small"
                value={insetDistance}
                onChange={(e) =>
                  setInsetDistance(parseFloat(e.target.value) || 0)
                }
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Depth"
                type="number"
                size="small"
                value={insetDepth}
                onChange={(e) => setInsetDepth(parseFloat(e.target.value) || 0)}
                inputProps={{ step: 0.01 }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            fullWidth
            startIcon={<ZoomOut />}
            onClick={handleInsetFaces}
            disabled={selectedFaces.length === 0}
            sx={styles.operationButton}
          >
            Inset Selected (I)
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Subdivide Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#e0e0e0" }}>
            Subdivide
          </Typography>

          <Typography variant="caption" color="textSecondary">
            Cuts: {subdivisionCuts}
          </Typography>
          <Slider
            value={subdivisionCuts}
            onChange={(event: Event, value: number | number[]) =>
              setSubdivisionCuts(Array.isArray(value) ? value[0] : value)
            }
            min={1}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            sx={{ mb: 1 }}
          />

          <Typography variant="caption" color="textSecondary">
            Smoothness: {subdivisionSmooth.toFixed(2)}
          </Typography>
          <Slider
            value={subdivisionSmooth}
            onChange={(event: Event, value: number | number[]) =>
              setSubdivisionSmooth(Array.isArray(value) ? value[0] : value)
            }
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            fullWidth
            startIcon={<CallSplit />}
            onClick={handleSubdivideFaces}
            disabled={selectedFaces.length === 0}
            sx={styles.operationButton}
          >
            Subdivide Selected
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Delete Section */}
        <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<Delete />}
          onClick={handleDeleteFaces}
          disabled={selectedFaces.length === 0}
          sx={styles.operationButton}
        >
          Delete Selected (X)
        </Button>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={styles.card} elevation={0}>
        <Typography sx={styles.sectionTitle}>Quick Actions</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Keyboard shortcuts for faster workflow
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip label="E - Extrude" size="small" variant="outlined" />
          <Chip label="I - Inset" size="small" variant="outlined" />
          <Chip label="X - Delete" size="small" variant="outlined" />
          <Chip label="Ctrl+A - Select All" size="small" variant="outlined" />
          <Chip label="Alt+A - Deselect" size="small" variant="outlined" />
        </Box>
      </Paper>
    </Box>
  );
};

export default FaceEditor;

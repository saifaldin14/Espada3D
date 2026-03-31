import React, { useState, useMemo } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Paper,
} from "@mui/material";
import {
  Delete,
  SelectAll,
  DeselectOutlined,
  OpenWith,
  RotateRight,
  ZoomOutMap,
  CallMerge,
  Add,
  Remove,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setSubObjectSelectionMode } from "../../store/slices/uiSlice";
import {
  Vector3Tuple,
  SelectionMode,
  TransformConstraint,
  MergeType,
} from "../../types";
import { useMeshEditor } from "../../hooks/useMeshEditor";
import { EditModes } from "../../Enums";

interface VertexEditorProps {
  modelId: string;
}

const VertexEditor: React.FC<VertexEditorProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  // Use the mesh editor hook
  const {
    meshData,
    moveVertices,
    scaleVertices,
    rotateVertices,
    mergeVertices,
    deleteSelectedElements,
    selectAll,
    deselectAll,
    growSelection,
    shrinkSelection,
  } = useMeshEditor(modelId);

  // Transform states
  const [moveVector, setMoveVector] = useState<Vector3Tuple>([0, 0, 0]);
  const [scaleVector, setScaleVector] = useState<Vector3Tuple>([1, 1, 1]);
  const [rotationVector, setRotationVector] = useState<Vector3Tuple>([0, 0, 0]);
  const [constraint, setConstraint] = useState<TransformConstraint | "">("");
  const [mergeType, setMergeType] = useState<MergeType>("center");
  const [useCustomPivot, setUseCustomPivot] = useState(false);
  const [customPivot, setCustomPivot] = useState<Vector3Tuple>([0, 0, 0]);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [proportionalEdit, setProportionalEdit] = useState(false);
  const [proportionalSize, setProportionalSize] = useState(1.0);

  // Memoize selected vertices calculation (must be before early return)
  const selectedVertices = useMemo(() => {
    return meshData ? meshData.vertices.filter((v) => v.selected) : [];
  }, [meshData]);

  if (!meshData) {
    return (
      <Card>
        <CardContent>
          <Typography>No mesh data available for editing</Typography>
        </CardContent>
      </Card>
    );
  }
  const totalVertices = meshData.vertices.length;

  const handleSelectionModeChange = (mode: SelectionMode) => {
    dispatch(setSubObjectSelectionMode(mode));
  };

  const handleSelectAll = () => {
    selectAll(EditModes.vertex);
  };

  const handleDeselectAll = () => {
    deselectAll(EditModes.vertex);
  };

  const handleGrowSelection = () => {
    growSelection(EditModes.vertex);
  };

  const handleShrinkSelection = () => {
    shrinkSelection(EditModes.vertex);
  };

  const handleMoveVertices = () => {
    if (selectedVertices.length === 0) return;
    moveVertices(moveVector, constraint || undefined);
  };

  const handleScaleVertices = () => {
    if (selectedVertices.length === 0) return;
    scaleVertices(scaleVector, constraint || undefined);
  };

  const handleRotateVertices = () => {
    if (selectedVertices.length === 0) return;
    const rotationAxis =
      constraint === "x" || constraint === "y" || constraint === "z"
        ? constraint
        : undefined;
    rotateVertices(
      rotationVector,
      useCustomPivot ? customPivot : undefined,
      rotationAxis
    );
  };

  const handleMergeVertices = () => {
    if (selectedVertices.length < 2) return;
    mergeVertices(mergeType);
  };

  const handleDeleteVertices = () => {
    if (selectedVertices.length === 0) return;
    deleteSelectedElements();
  };

  const selectionCenter =
    selectedVertices.length > 0
      ? (selectedVertices
          .reduce(
            (acc: Vector3Tuple, v: any): Vector3Tuple => [
              acc[0] + v.position[0],
              acc[1] + v.position[1],
              acc[2] + v.position[2],
            ],
            [0, 0, 0] as Vector3Tuple
          )
          .map((sum: number) => sum / selectedVertices.length) as Vector3Tuple)
      : ([0, 0, 0] as Vector3Tuple);

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
      {/* Vertex Statistics */}
      <Paper sx={styles.card} elevation={0}>
        <Typography sx={styles.sectionTitle}>Vertex Statistics</Typography>
        <Box sx={styles.statsGrid}>
          <Box sx={styles.statCard}>
            <Typography variant="caption" color="textSecondary">
              Total Vertices
            </Typography>
            <Typography variant="h6" color="primary">
              {totalVertices}
            </Typography>
          </Box>
          <Box sx={styles.statCard}>
            <Typography variant="caption" color="textSecondary">
              Selected
            </Typography>
            <Typography variant="h6" color="secondary">
              {selectedVertices.length}
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
                disabled={selectedVertices.length === 0}
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
                disabled={selectedVertices.length === 0}
                sx={styles.operationButton}
              >
                Shrink
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Selected Vertices Info */}
      {selectedVertices.length > 0 && (
        <Paper sx={styles.card} elevation={0}>
          <Typography sx={styles.sectionTitle}>Selected Vertices</Typography>
          <List dense>
            {selectedVertices.slice(0, 5).map((vertex: any) => (
              <ListItem key={vertex.index}>
                <ListItemText
                  primary={`Vertex ${vertex.index}`}
                  secondary={`Position: ${vertex.position
                    .map((v: number) => v.toFixed(3))
                    .join(", ")}`}
                />
              </ListItem>
            ))}
            {selectedVertices.length > 5 && (
              <ListItem>
                <ListItemText
                  primary={`... and ${selectedVertices.length - 5} more`}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {/* Transform Operations */}
      <Paper sx={styles.card} elevation={0}>
        <Typography sx={styles.sectionTitle}>Transform Operations</Typography>

        {/* Constraint Selection */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Constraint Axis</InputLabel>
          <Select
            value={constraint}
            label="Constraint Axis"
            onChange={(e) =>
              setConstraint(e.target.value as TransformConstraint | "")
            }
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="x">X-Axis</MenuItem>
            <MenuItem value="y">Y-Axis</MenuItem>
            <MenuItem value="z">Z-Axis</MenuItem>
            <MenuItem value="xy">XY-Plane</MenuItem>
            <MenuItem value="xz">XZ-Plane</MenuItem>
            <MenuItem value="yz">YZ-Plane</MenuItem>
          </Select>
        </FormControl>

        {/* Move Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#e0e0e0" }}>
            Move Delta
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <TextField
                label="X"
                type="number"
                size="small"
                value={moveVector[0]}
                onChange={(e) =>
                  setMoveVector([
                    parseFloat(e.target.value) || 0,
                    moveVector[1],
                    moveVector[2],
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
                value={moveVector[1]}
                onChange={(e) =>
                  setMoveVector([
                    moveVector[0],
                    parseFloat(e.target.value) || 0,
                    moveVector[2],
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
                value={moveVector[2]}
                onChange={(e) =>
                  setMoveVector([
                    moveVector[0],
                    moveVector[1],
                    parseFloat(e.target.value) || 0,
                  ])
                }
                inputProps={{ step: 0.1 }}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            fullWidth
            startIcon={<OpenWith />}
            onClick={handleMoveVertices}
            disabled={selectedVertices.length === 0}
            sx={{ ...styles.operationButton, mt: 1 }}
          >
            Move Selected
          </Button>
        </Box>

        {/* Scale Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#e0e0e0" }}>
            Scale Factor
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <TextField
                label="X"
                type="number"
                size="small"
                value={scaleVector[0]}
                onChange={(e) =>
                  setScaleVector([
                    parseFloat(e.target.value) || 1,
                    scaleVector[1],
                    scaleVector[2],
                  ])
                }
                inputProps={{ step: 0.1, min: 0.01 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Y"
                type="number"
                size="small"
                value={scaleVector[1]}
                onChange={(e) =>
                  setScaleVector([
                    scaleVector[0],
                    parseFloat(e.target.value) || 1,
                    scaleVector[2],
                  ])
                }
                inputProps={{ step: 0.1, min: 0.01 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Z"
                type="number"
                size="small"
                value={scaleVector[2]}
                onChange={(e) =>
                  setScaleVector([
                    scaleVector[0],
                    scaleVector[1],
                    parseFloat(e.target.value) || 1,
                  ])
                }
                inputProps={{ step: 0.1, min: 0.01 }}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            fullWidth
            startIcon={<ZoomOutMap />}
            onClick={handleScaleVertices}
            disabled={selectedVertices.length === 0}
            sx={{ ...styles.operationButton, mt: 1 }}
          >
            Scale Selected
          </Button>
        </Box>

        {/* Rotation Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#e0e0e0" }}>
            Rotation (Degrees)
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <TextField
                label="X"
                type="number"
                size="small"
                value={(rotationVector[0] * 180) / Math.PI}
                onChange={(e) =>
                  setRotationVector([
                    (parseFloat(e.target.value) || 0) * (Math.PI / 180),
                    rotationVector[1],
                    rotationVector[2],
                  ])
                }
                inputProps={{ step: 15 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Y"
                type="number"
                size="small"
                value={(rotationVector[1] * 180) / Math.PI}
                onChange={(e) =>
                  setRotationVector([
                    rotationVector[0],
                    (parseFloat(e.target.value) || 0) * (Math.PI / 180),
                    rotationVector[2],
                  ])
                }
                inputProps={{ step: 15 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Z"
                type="number"
                size="small"
                value={(rotationVector[2] * 180) / Math.PI}
                onChange={(e) =>
                  setRotationVector([
                    rotationVector[0],
                    rotationVector[1],
                    (parseFloat(e.target.value) || 0) * (Math.PI / 180),
                  ])
                }
                inputProps={{ step: 15 }}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            fullWidth
            startIcon={<RotateRight />}
            onClick={handleRotateVertices}
            disabled={selectedVertices.length === 0}
            sx={{ ...styles.operationButton, mt: 1 }}
          >
            Rotate Selected
          </Button>
        </Box>

        {/* Custom Pivot */}
        <FormControlLabel
          control={
            <Switch
              checked={useCustomPivot}
              onChange={(e) => setUseCustomPivot(e.target.checked)}
            />
          }
          label="Use Custom Pivot"
          sx={{ mb: 1 }}
        />

        {useCustomPivot && (
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField
                label="Pivot X"
                type="number"
                size="small"
                value={customPivot[0]}
                onChange={(e) =>
                  setCustomPivot([
                    parseFloat(e.target.value) || 0,
                    customPivot[1],
                    customPivot[2],
                  ])
                }
                inputProps={{ step: 0.1 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pivot Y"
                type="number"
                size="small"
                value={customPivot[1]}
                onChange={(e) =>
                  setCustomPivot([
                    customPivot[0],
                    parseFloat(e.target.value) || 0,
                    customPivot[2],
                  ])
                }
                inputProps={{ step: 0.1 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Pivot Z"
                type="number"
                size="small"
                value={customPivot[2]}
                onChange={(e) =>
                  setCustomPivot([
                    customPivot[0],
                    customPivot[1],
                    parseFloat(e.target.value) || 0,
                  ])
                }
                inputProps={{ step: 0.1 }}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Merge and Delete Operations */}
      <Paper sx={styles.card} elevation={0}>
        <Typography sx={styles.sectionTitle}>Vertex Operations</Typography>

        {/* Merge Section */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Merge Type</InputLabel>
            <Select
              value={mergeType}
              label="Merge Type"
              onChange={(e) => setMergeType(e.target.value as MergeType)}
            >
              <MenuItem value="center">At Center</MenuItem>
              <MenuItem value="first">At First</MenuItem>
              <MenuItem value="last">At Last</MenuItem>
              <MenuItem value="cursor">At Cursor</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            fullWidth
            startIcon={<CallMerge />}
            onClick={handleMergeVertices}
            disabled={selectedVertices.length < 2}
            sx={styles.operationButton}
          >
            Merge Selected ({selectedVertices.length})
          </Button>
        </Box>

        {/* Delete Section */}
        <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<Delete />}
          onClick={handleDeleteVertices}
          disabled={selectedVertices.length === 0}
          sx={styles.operationButton}
        >
          Delete Selected
        </Button>
      </Paper>

      {/* Additional Options */}
      <Paper sx={styles.card} elevation={0}>
        <Typography sx={styles.sectionTitle}>Additional Options</Typography>

        <FormControlLabel
          control={
            <Switch
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
            />
          }
          label="Snap to Grid"
          sx={{ mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={proportionalEdit}
              onChange={(e) => setProportionalEdit(e.target.checked)}
            />
          }
          label="Proportional Editing"
          sx={{ mb: 1 }}
        />

        {proportionalEdit && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Proportional Size: {proportionalSize.toFixed(2)}
            </Typography>
            <Slider
              value={proportionalSize}
              onChange={(_: any, newValue: number | number[]) =>
                setProportionalSize(
                  Array.isArray(newValue) ? newValue[0] : newValue
                )
              }
              min={0.1}
              max={5.0}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Box>
        )}
      </Paper>

      {/* Selection Center Info */}
      {selectedVertices.length > 0 && (
        <Paper sx={styles.card} elevation={0}>
          <Typography sx={styles.sectionTitle}>Selection Info</Typography>
          <Typography variant="body2" color="textSecondary">
            Selection Center: (
            {selectionCenter.map((v) => v.toFixed(3)).join(", ")})
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default VertexEditor;

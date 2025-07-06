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
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  ControlPoint,
  LinearScale,
  Transform,
  SelectAll,
  DeselectOutlined,
  OpenWith,
  RotateRight,
  ZoomOutMap,
  CallMerge,
  Add,
  Remove,
  Loop,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setSubObjectSelectionMode,
  selectSubObjects,
} from "../../store/slices/uiSlice";
import {
  moveVertices,
  scaleVertices,
  rotateVertices,
  mergeVertices,
  growSelection,
  deleteSelectedElements,
} from "../../store/slices/modelSlice";
import {
  Vector3Tuple,
  SelectionMode,
  VertexData,
  TransformConstraint,
  MergeType,
} from "../../types";
import { MeshEditor } from "../../utils/meshEditor";

interface VertexEditorProps {
  modelId: string;
}

const VertexEditor: React.FC<VertexEditorProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const meshEditData = useSelector(
    (state: RootState) => state.ui.meshEditData[modelId]
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

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

  if (!meshEditData) {
    return (
      <Card>
        <CardContent>
          <Typography>No mesh data available for editing</Typography>
        </CardContent>
      </Card>
    );
  }

  const selectedVertices = MeshEditor.getSelectedVertices(meshEditData);
  const totalVertices = meshEditData.vertices.length;

  const handleSelectionModeChange = (mode: SelectionMode) => {
    dispatch(setSubObjectSelectionMode(mode));
  };

  const handleSelectAll = () => {
    const allIndices = meshEditData.vertices.map((_, index) => index);
    dispatch(
      selectSubObjects({
        modelId,
        type: "vertex",
        indices: allIndices,
        mode: "set",
      })
    );
  };

  const handleDeselectAll = () => {
    dispatch(
      selectSubObjects({
        modelId,
        type: "vertex",
        indices: [],
        mode: "set",
      })
    );
  };

  const handleGrowSelection = () => {
    dispatch(growSelection({ modelId, operation: "grow" }));
  };

  const handleShrinkSelection = () => {
    dispatch(growSelection({ modelId, operation: "shrink" }));
  };

  const handleMoveVertices = () => {
    if (selectedVertices.length === 0) return;

    const pivot = useCustomPivot ? customPivot : undefined;
    dispatch(
      moveVertices({
        modelId,
        delta: moveVector,
        constraint: constraint || undefined,
        pivot,
      })
    );
  };

  const handleScaleVertices = () => {
    if (selectedVertices.length === 0) return;

    const pivot = useCustomPivot ? customPivot : undefined;
    dispatch(
      scaleVertices({
        modelId,
        scale: scaleVector,
        constraint: constraint || undefined,
        pivot,
      })
    );
  };

  const handleRotateVertices = () => {
    if (selectedVertices.length === 0) return;

    const pivot = useCustomPivot ? customPivot : undefined;
    const rotationAxis =
      constraint === "x" || constraint === "y" || constraint === "z"
        ? constraint
        : undefined;

    dispatch(
      rotateVertices({
        modelId,
        rotation: rotationVector,
        axis: rotationAxis,
        pivot,
      })
    );
  };

  const handleMergeVertices = () => {
    if (selectedVertices.length < 2) return;

    dispatch(
      mergeVertices({
        modelId,
        mergeType,
      })
    );
  };

  const handleDeleteVertices = () => {
    if (selectedVertices.length === 0) return;
    dispatch(deleteSelectedElements({ modelId }));
  };

  const getPivotPoint = (): Vector3Tuple => {
    if (useCustomPivot) return customPivot;
    if (selectedVertices.length === 0) return [0, 0, 0];

    // Calculate center of selection
    const sum = selectedVertices.reduce(
      (acc, v) =>
        [
          acc[0] + v.position[0],
          acc[1] + v.position[1],
          acc[2] + v.position[2],
        ] as Vector3Tuple,
      [0, 0, 0] as Vector3Tuple
    );
    return [
      sum[0] / selectedVertices.length,
      sum[1] / selectedVertices.length,
      sum[2] / selectedVertices.length,
    ];
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Vertex Editor
        </Typography>

        {/* Selection Info */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {selectedVertices.length} of {totalVertices} vertices selected
          </Typography>
          {selectedVertices.length > 0 && (
            <Box mt={1}>
              {selectedVertices.slice(0, 8).map((vertex) => (
                <Chip
                  key={vertex.index}
                  label={`V${vertex.index}`}
                  size="small"
                  color="primary"
                  style={{ margin: 2 }}
                />
              ))}
              {selectedVertices.length > 8 && (
                <Chip
                  label={`+${selectedVertices.length - 8} more`}
                  size="small"
                  variant="outlined"
                  style={{ margin: 2 }}
                />
              )}
            </Box>
          )}
        </Paper>

        {/* Selection Mode */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selection Mode
          </Typography>
          <ButtonGroup size="small" sx={{ mb: 2 }}>
            {(["single", "multiple", "box", "lasso"] as SelectionMode[]).map(
              (mode) => (
                <Button
                  key={mode}
                  variant={selectionMode === mode ? "contained" : "outlined"}
                  onClick={() => handleSelectionModeChange(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              )
            )}
          </ButtonGroup>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Tooltip title="Select All (A)">
              <Button
                startIcon={<SelectAll />}
                onClick={handleSelectAll}
                size="small"
              >
                All
              </Button>
            </Tooltip>
            <Tooltip title="Deselect All (Alt+A)">
              <Button
                startIcon={<DeselectOutlined />}
                onClick={handleDeselectAll}
                size="small"
              >
                None
              </Button>
            </Tooltip>
            <Tooltip title="Grow Selection (Ctrl+NumPad+)">
              <Button
                startIcon={<Add />}
                onClick={handleGrowSelection}
                size="small"
                disabled={selectedVertices.length === 0}
              >
                Grow
              </Button>
            </Tooltip>
            <Tooltip title="Shrink Selection (Ctrl+NumPad-)">
              <Button
                startIcon={<Remove />}
                onClick={handleShrinkSelection}
                size="small"
                disabled={selectedVertices.length === 0}
              >
                Shrink
              </Button>
            </Tooltip>
          </Box>
        </Paper>

        {/* Transform Constraint */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Transform Constraint
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120, mb: 2 }}>
            <InputLabel>Constraint</InputLabel>
            <Select
              value={constraint}
              label="Constraint"
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

          <Box display="flex" flexDirection="column" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={useCustomPivot}
                  onChange={(e) => setUseCustomPivot(e.target.checked)}
                />
              }
              label="Custom Pivot"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                />
              }
              label="Snap to Grid"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={proportionalEdit}
                  onChange={(e) => setProportionalEdit(e.target.checked)}
                />
              }
              label="Proportional Editing"
            />
          </Box>

          {useCustomPivot && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Custom Pivot Point
              </Typography>
              <Grid container spacing={1}>
                {(["X", "Y", "Z"] as const).map((axis, index) => (
                  <Grid item xs={4} key={axis}>
                    <TextField
                      label={axis}
                      type="number"
                      size="small"
                      value={customPivot[index]}
                      onChange={(e) => {
                        const newPivot = [...customPivot] as Vector3Tuple;
                        newPivot[index] = parseFloat(e.target.value) || 0;
                        setCustomPivot(newPivot);
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {proportionalEdit && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Proportional Size: {proportionalSize.toFixed(2)}
              </Typography>
              <Slider
                value={proportionalSize}
                onChange={(event: Event, value: number | number[]) =>
                  setProportionalSize(value as number)
                }
                min={0.1}
                max={5.0}
                step={0.1}
                size="small"
              />
            </Box>
          )}
        </Paper>

        {/* Transform Operations */}
        {selectedVertices.length > 0 && (
          <>
            {/* Move */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Move Vertices (G)
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {(["X", "Y", "Z"] as const).map((axis, index) => (
                  <Grid item xs={4} key={axis}>
                    <TextField
                      label={axis}
                      type="number"
                      size="small"
                      value={moveVector[index]}
                      onChange={(e) => {
                        const newVector = [...moveVector] as Vector3Tuple;
                        newVector[index] = parseFloat(e.target.value) || 0;
                        setMoveVector(newVector);
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              <Button
                startIcon={<OpenWith />}
                onClick={handleMoveVertices}
                variant="contained"
                size="small"
                disabled={selectedVertices.length === 0}
              >
                Move
              </Button>
            </Paper>

            {/* Scale */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Scale Vertices (S)
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {(["X", "Y", "Z"] as const).map((axis, index) => (
                  <Grid item xs={4} key={axis}>
                    <TextField
                      label={axis}
                      type="number"
                      size="small"
                      value={scaleVector[index]}
                      onChange={(e) => {
                        const newVector = [...scaleVector] as Vector3Tuple;
                        newVector[index] = parseFloat(e.target.value) || 1;
                        setScaleVector(newVector);
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              <Button
                startIcon={<ZoomOutMap />}
                onClick={handleScaleVertices}
                variant="contained"
                size="small"
                disabled={selectedVertices.length === 0}
              >
                Scale
              </Button>
            </Paper>

            {/* Rotate */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Rotate Vertices (R)
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {(["X", "Y", "Z"] as const).map((axis, index) => (
                  <Grid item xs={4} key={axis}>
                    <TextField
                      label={`${axis} (deg)`}
                      type="number"
                      size="small"
                      value={(rotationVector[index] * 180) / Math.PI}
                      onChange={(e) => {
                        const newVector = [...rotationVector] as Vector3Tuple;
                        newVector[index] =
                          ((parseFloat(e.target.value) || 0) * Math.PI) / 180;
                        setRotationVector(newVector);
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              <Button
                startIcon={<RotateRight />}
                onClick={handleRotateVertices}
                variant="contained"
                size="small"
                disabled={selectedVertices.length === 0}
              >
                Rotate
              </Button>
            </Paper>
          </>
        )}

        {/* Vertex Operations */}
        {selectedVertices.length >= 2 && (
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Merge Vertices (Alt+M)
            </Typography>
            <FormControl size="small" sx={{ mb: 2, minWidth: 120 }}>
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
            <Box>
              <Button
                startIcon={<CallMerge />}
                onClick={handleMergeVertices}
                variant="contained"
                size="small"
                color="secondary"
              >
                Merge ({selectedVertices.length} vertices)
              </Button>
            </Box>
          </Paper>
        )}

        {/* Current Selection Info */}
        {selectedVertices.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selection Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Pivot Point:{" "}
              {getPivotPoint()
                .map((v) => v.toFixed(3))
                .join(", ")}
            </Typography>
            <List dense>
              {selectedVertices.slice(0, 5).map((vertex) => (
                <ListItem key={vertex.index} divider>
                  <ListItemText
                    primary={`Vertex ${vertex.index}`}
                    secondary={`Position: (${vertex.position
                      .map((v) => v.toFixed(3))
                      .join(", ")})`}
                  />
                </ListItem>
              ))}
              {selectedVertices.length > 5 && (
                <ListItem>
                  <ListItemText
                    primary={`... and ${
                      selectedVertices.length - 5
                    } more vertices`}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        )}

        {/* Danger Zone */}
        {selectedVertices.length > 0 && (
          <Paper
            elevation={1}
            sx={{ p: 2, bgcolor: "error.light", color: "error.contrastText" }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Danger Zone
            </Typography>
            <Button
              startIcon={<Delete />}
              onClick={handleDeleteVertices}
              variant="contained"
              color="error"
              size="small"
            >
              Delete Selected Vertices ({selectedVertices.length})
            </Button>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default VertexEditor;

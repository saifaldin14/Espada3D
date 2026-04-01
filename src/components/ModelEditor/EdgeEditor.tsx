import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  ButtonGroup,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  SelectAll,
  DeselectOutlined,
  Add,
  Remove,
  Loop,
  ContentCut,
  BlurOn,
  LinearScale,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setSubObjectSelectionMode } from "../../store/slices/uiSlice";
import { selectSubObjects } from "../../store/slices/meshSlice";
import { SelectionMode, BevelProfile } from "../../types";
import { MeshEditor } from "../../utils/meshEditor";
import { useMeshEditor } from "../../hooks/useMeshEditor";
import { EditModes, SelectModes } from "../../Enums";

interface EdgeEditorProps {
  modelId: string;
}

const EdgeEditor: React.FC<EdgeEditorProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const meshEditData = useSelector(
    (state: RootState) => state.mesh.meshData[modelId]
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  // Use mesh editor hook for operations
  const {
    moveEdges,
    bevelEdges,
    splitEdges,
    loopCut,
    deleteSelectedElements,
    growSelection,
    shrinkSelection,
    selectEdgeLoop,
  } = useMeshEditor(modelId);

  // Bevel parameters
  const [bevelDistance, setBevelDistance] = useState(0.1);
  const [bevelSegments, setBevelSegments] = useState(1);
  const [bevelProfile, setBevelProfile] = useState<BevelProfile>(0.5);

  // Split parameters
  const [splitCount, setSplitCount] = useState(1);

  // Loop cut parameters
  const [loopCuts, setLoopCuts] = useState(1);
  const [loopSmoothness, setLoopSmoothness] = useState(0.0);

  // Move parameters
  const [moveDistance, setMoveDistance] = useState(0.1);
  const [moveConstraint, setMoveConstraint] = useState<
    "x" | "y" | "z" | "xy" | "xz" | "yz" | ""
  >("");

  // Memoize selected edges calculation (must be before early return)
  const selectedEdges = useMemo(() => {
    return meshEditData ? MeshEditor.getSelectedEdges(meshEditData) : [];
  }, [meshEditData]);

  // Memoize total length calculation
  const totalLength = useMemo(() => {
    return selectedEdges.reduce((total, edge) => {
      if (!meshEditData) return total;
      const [v1Index, v2Index] = edge.vertices;
      const v1 = meshEditData.vertices[v1Index];
      const v2 = meshEditData.vertices[v2Index];

      if (!v1 || !v2) return total;

      const dx = v2.position[0] - v1.position[0];
      const dy = v2.position[1] - v1.position[1];
      const dz = v2.position[2] - v1.position[2];

      return total + Math.sqrt(dx * dx + dy * dy + dz * dz);
    }, 0);
  }, [selectedEdges, meshEditData]);

  if (!meshEditData) {
    return (
      <Card>
        <CardContent>
          <Typography>No mesh data available for editing</Typography>
        </CardContent>
      </Card>
    );
  }

  const totalEdges = meshEditData?.edges.length || 0;

  const handleSelectionModeChange = (mode: SelectionMode) => {
    dispatch(setSubObjectSelectionMode(mode));
  };

  const handleSelectAll = () => {
    const allIndices = meshEditData.edges.map((_, index) => index);
    dispatch(
      selectSubObjects({
        modelId,
        type: EditModes.edge,
        indices: allIndices,
        mode: SelectModes.set,
      })
    );
  };

  const handleDeselectAll = () => {
    dispatch(
      selectSubObjects({
        modelId,
        type: EditModes.edge,
        indices: [],
        mode: SelectModes.set,
      })
    );
  };

  const handleGrowSelection = () => {
    growSelection(EditModes.edge);
  };

  const handleShrinkSelection = () => {
    shrinkSelection(EditModes.edge);
  };

  const handleSelectEdgeLoop = () => {
    if (selectedEdges.length === 0) return;
    selectEdgeLoop(selectedEdges[0].index);
  };

  const handleBevelEdges = () => {
    if (selectedEdges.length === 0) return;
    bevelEdges(bevelDistance, bevelSegments, bevelProfile);
  };

  const handleSplitEdges = () => {
    if (selectedEdges.length === 0) return;
    splitEdges(splitCount);
  };

  const handleLoopCut = () => {
    if (selectedEdges.length === 0) return;
    loopCut(selectedEdges[0].index, loopCuts, loopSmoothness);
  };

  const handleDeleteEdges = () => {
    if (selectedEdges.length === 0) return;
    deleteSelectedElements();
  };

  const calculateTotalLength = (): number => {
    return totalLength;
  };

  const getBevelProfileName = (profile: number): string => {
    if (profile < 0.4) return "Concave";
    if (profile > 0.6) return "Convex";
    return "Linear";
  };

  const handleMoveEdges = (direction: "x" | "y" | "z" | "-x" | "-y" | "-z") => {
    if (selectedEdges.length === 0) return;

    const delta: [number, number, number] = [0, 0, 0];
    const distance = moveDistance;

    switch (direction) {
      case "x":
        delta[0] = distance;
        break;
      case "-x":
        delta[0] = -distance;
        break;
      case "y":
        delta[1] = distance;
        break;
      case "-y":
        delta[1] = -distance;
        break;
      case "z":
        delta[2] = distance;
        break;
      case "-z":
        delta[2] = -distance;
        break;
    }

    const constraint = moveConstraint || undefined;
    moveEdges(delta, constraint);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Edge Editor
        </Typography>

        {/* Selection Info */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {selectedEdges.length} of {totalEdges} edges selected
          </Typography>
          {selectedEdges.length > 0 && (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Total Length: {calculateTotalLength().toFixed(3)} units
              </Typography>
              <Box mt={1}>
                {selectedEdges.slice(0, 8).map((edge) => (
                  <Chip
                    key={edge.index}
                    label={`E${edge.index}`}
                    size="small"
                    color="primary"
                    style={{ margin: 2 }}
                  />
                ))}
                {selectedEdges.length > 8 && (
                  <Chip
                    label={`+${selectedEdges.length - 8} more`}
                    size="small"
                    variant="outlined"
                    style={{ margin: 2 }}
                  />
                )}
              </Box>
            </>
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
              <span>
                <Button
                  startIcon={<Add />}
                  onClick={handleGrowSelection}
                  size="small"
                  disabled={selectedEdges.length === 0}
                >
                  Grow
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Shrink Selection (Ctrl+NumPad-)">
              <span>
                <Button
                  startIcon={<Remove />}
                  onClick={handleShrinkSelection}
                  size="small"
                  disabled={selectedEdges.length === 0}
                >
                  Shrink
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Select Edge Loop (Alt+Click)">
              <span>
                <Button
                  startIcon={<Loop />}
                  onClick={handleSelectEdgeLoop}
                  size="small"
                  disabled={selectedEdges.length === 0}
                >
                  Edge Loop
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Paper>

        {/* Edge Operations */}
        {selectedEdges.length > 0 && (
          <>
            {/* Bevel */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Bevel Edges (Ctrl+B)
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Distance: {bevelDistance.toFixed(3)}
                </Typography>
                <Slider
                  value={bevelDistance}
                  onChange={(event: Event, value: number | number[]) =>
                    setBevelDistance(value as number)
                  }
                  min={0.0}
                  max={1.0}
                  step={0.001}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Segments: {bevelSegments}
                </Typography>
                <Slider
                  value={bevelSegments}
                  onChange={(event: Event, value: number | number[]) =>
                    setBevelSegments(value as number)
                  }
                  min={1}
                  max={10}
                  step={1}
                  marks
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Profile: {bevelProfile.toFixed(2)} (
                  {getBevelProfileName(bevelProfile)})
                </Typography>
                <Slider
                  value={bevelProfile}
                  onChange={(event: Event, value: number | number[]) =>
                    setBevelProfile(value as number)
                  }
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  size="small"
                />
              </Box>

              <Button
                startIcon={<BlurOn />}
                onClick={handleBevelEdges}
                variant="contained"
                size="small"
                color="primary"
              >
                Bevel ({selectedEdges.length} edges)
              </Button>
            </Paper>

            {/* Split */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Split Edges (Knife Tool)
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Splits per Edge: {splitCount}
                </Typography>
                <Slider
                  value={splitCount}
                  onChange={(event: Event, value: number | number[]) =>
                    setSplitCount(value as number)
                  }
                  min={1}
                  max={5}
                  step={1}
                  marks
                  size="small"
                />
              </Box>

              <Button
                startIcon={<ContentCut />}
                onClick={handleSplitEdges}
                variant="contained"
                size="small"
                color="secondary"
              >
                Split ({selectedEdges.length} edges)
              </Button>
            </Paper>

            {/* Loop Cut */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Loop Cut (Ctrl+R)
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Number of Cuts: {loopCuts}
                </Typography>
                <Slider
                  value={loopCuts}
                  onChange={(event: Event, value: number | number[]) =>
                    setLoopCuts(value as number)
                  }
                  min={1}
                  max={10}
                  step={1}
                  marks
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Smoothness: {loopSmoothness.toFixed(2)}
                </Typography>
                <Slider
                  value={loopSmoothness}
                  onChange={(event: Event, value: number | number[]) =>
                    setLoopSmoothness(value as number)
                  }
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  size="small"
                />
              </Box>

              <Button
                startIcon={<LinearScale />}
                onClick={handleLoopCut}
                variant="contained"
                size="small"
                color="info"
                disabled={selectedEdges.length === 0}
              >
                Loop Cut (from first edge)
              </Button>
            </Paper>

            {/* Move Edges */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Move Edges (G)
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Distance: {moveDistance.toFixed(3)}
                </Typography>
                <Slider
                  value={moveDistance}
                  onChange={(event: Event, value: number | number[]) =>
                    setMoveDistance(value as number)
                  }
                  min={0.01}
                  max={2.0}
                  step={0.01}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Constraint</InputLabel>
                  <Select
                    value={moveConstraint}
                    onChange={(e) => setMoveConstraint(e.target.value as any)}
                    label="Constraint"
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
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleMoveEdges("x")}
                  >
                    +X
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleMoveEdges("y")}
                  >
                    +Y
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleMoveEdges("z")}
                  >
                    +Z
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleMoveEdges("-x")}
                  >
                    -X
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleMoveEdges("-y")}
                  >
                    -Y
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleMoveEdges("-z")}
                  >
                    -Z
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Selection Details */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selection Details
              </Typography>
              <List dense>
                {selectedEdges.slice(0, 5).map((edge) => {
                  const v1 = meshEditData?.vertices[edge.vertices[0]];
                  const v2 = meshEditData?.vertices[edge.vertices[1]];
                  const length =
                    v1 && v2
                      ? Math.sqrt(
                          Math.pow(v2.position[0] - v1.position[0], 2) +
                            Math.pow(v2.position[1] - v1.position[1], 2) +
                            Math.pow(v2.position[2] - v1.position[2], 2)
                        )
                      : 0;

                  return (
                    <ListItem key={edge.index} divider>
                      <ListItemText
                        primary={`Edge ${edge.index}`}
                        secondary={`Vertices: ${edge.vertices[0]} → ${
                          edge.vertices[1]
                        }, Length: ${length.toFixed(3)}`}
                      />
                    </ListItem>
                  );
                })}
                {selectedEdges.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${selectedEdges.length - 5} more edges`}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </>
        )}

        {/* Danger Zone */}
        {selectedEdges.length > 0 && (
          <Paper
            elevation={1}
            sx={{ p: 2, bgcolor: "error.light", color: "error.contrastText" }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Danger Zone
            </Typography>
            <Button
              startIcon={<Delete />}
              onClick={handleDeleteEdges}
              variant="contained"
              color="error"
              size="small"
            >
              Delete Selected Edges ({selectedEdges.length})
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Warning: Deleting edges will dissolve them and may merge adjacent
              faces
            </Typography>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default EdgeEditor;

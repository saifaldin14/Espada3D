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
} from "@mui/material";
import {
  Delete,
  ControlPoint,
  LinearScale,
  Transform,
  SelectAll,
  DeselectOutlined,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setSubObjectSelectionMode,
  selectSubObjects,
} from "../../store/slices/uiSlice";
import { updateVertex } from "../../store/slices/modelSlice";
import { Vector3Tuple, SelectionMode, VertexData } from "../../types";
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

  const [moveVector, setMoveVector] = useState<Vector3Tuple>([0, 0, 0]);
  const [snapDistance, setSnapDistance] = useState(0.1);

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

  const handleMoveVertices = () => {
    if (selectedVertices.length === 0) return;

    selectedVertices.forEach((vertex) => {
      const newPosition: Vector3Tuple = [
        vertex.position[0] + moveVector[0],
        vertex.position[1] + moveVector[1],
        vertex.position[2] + moveVector[2],
      ];

      dispatch(
        updateVertex({
          modelId,
          vertexIndex: vertex.index,
          position: newPosition,
        })
      );
    });

    // Reset move vector
    setMoveVector([0, 0, 0]);
  };

  const handleDeleteVertices = () => {
    if (selectedVertices.length === 0) return;

    // This would trigger a model update in a real implementation
    console.log(
      "Deleting vertices:",
      selectedVertices.map((v) => v.index)
    );
  };

  const handleSnapToGrid = () => {
    if (selectedVertices.length === 0) return;

    console.log("Snapping vertices to grid with distance:", snapDistance);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Vertex Editor
        </Typography>

        {/* Selection Info */}
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            {selectedVertices.length} of {totalVertices} vertices selected
          </Typography>
          {selectedVertices.length > 0 && (
            <Box mt={1}>
              {selectedVertices.slice(0, 5).map((vertex) => (
                <Chip
                  key={vertex.index}
                  label={`V${vertex.index}`}
                  size="small"
                  color="primary"
                  style={{ margin: 2 }}
                />
              ))}
              {selectedVertices.length > 5 && (
                <Chip
                  label={`+${selectedVertices.length - 5} more`}
                  size="small"
                  variant="outlined"
                  style={{ margin: 2 }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Selection Mode */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Selection Mode
          </Typography>
          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={selectionMode === "single" ? "contained" : "outlined"}
              onClick={() => handleSelectionModeChange("single")}
            >
              Single
            </Button>
            <Button
              variant={selectionMode === "multiple" ? "contained" : "outlined"}
              onClick={() => handleSelectionModeChange("multiple")}
            >
              Multiple
            </Button>
            <Button
              variant={selectionMode === "box" ? "contained" : "outlined"}
              onClick={() => handleSelectionModeChange("box")}
            >
              Box
            </Button>
          </ButtonGroup>
        </Box>

        {/* Selection Controls */}
        <Box mb={2}>
          <ButtonGroup size="small" variant="outlined" fullWidth>
            <Button startIcon={<SelectAll />} onClick={handleSelectAll}>
              Select All
            </Button>
            <Button
              startIcon={<DeselectOutlined />}
              onClick={handleDeselectAll}
            >
              Deselect All
            </Button>
          </ButtonGroup>
        </Box>

        {/* Transform Controls */}
        {selectedVertices.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Transform Selected Vertices
            </Typography>

            <Grid container spacing={2} mb={2}>
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

            <Box sx={{ mb: 2 }}>
              <ButtonGroup size="small" variant="outlined" fullWidth>
                <Button startIcon={<Transform />} onClick={handleMoveVertices}>
                  Move
                </Button>
                <Button
                  startIcon={<Delete />}
                  onClick={handleDeleteVertices}
                  color="error"
                >
                  Delete
                </Button>
              </ButtonGroup>
            </Box>
          </>
        )}

        {/* Snap to Grid */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Snap to Grid
          </Typography>
          <Box mb={1}>
            <Typography variant="body2" gutterBottom>
              Snap Distance: {snapDistance}
            </Typography>
            <Slider
              value={snapDistance}
              onChange={(_: Event, value: number | number[]) =>
                setSnapDistance(value as number)
              }
              min={0.01}
              max={1}
              step={0.01}
              valueLabelDisplay="auto"
            />
          </Box>
          <Button
            size="small"
            variant="outlined"
            fullWidth
            onClick={handleSnapToGrid}
            disabled={selectedVertices.length === 0}
          >
            Snap Selected to Grid
          </Button>
        </Box>

        {/* Vertex List */}
        {selectedVertices.length > 0 && selectedVertices.length <= 10 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Selected Vertices
            </Typography>
            <List dense>
              {selectedVertices.map((vertex) => (
                <ListItem key={vertex.index}>
                  <ListItemText
                    primary={`Vertex ${vertex.index}`}
                    secondary={`Position: (${vertex.position[0].toFixed(
                      2
                    )}, ${vertex.position[1].toFixed(
                      2
                    )}, ${vertex.position[2].toFixed(2)})`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VertexEditor;

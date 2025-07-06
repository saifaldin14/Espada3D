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
  Slider,
} from "@mui/material";
import {
  Delete,
  CallSplit,
  LinearScale,
  SelectAll,
  DeselectOutlined,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setSubObjectSelectionMode,
  selectSubObjects,
} from "../../store/slices/uiSlice";
import { bevelEdges } from "../../store/slices/modelSlice";
import { SelectionMode } from "../../types";
import { MeshEditor } from "../../utils/meshEditor";

interface EdgeEditorProps {
  modelId: string;
}

const EdgeEditor: React.FC<EdgeEditorProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const meshEditData = useSelector(
    (state: RootState) => state.ui.meshEditData[modelId]
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  const [bevelSegments, setBevelSegments] = useState(2);
  const [bevelDistance, setBevelDistance] = useState(0.1);

  if (!meshEditData) {
    return (
      <Card>
        <CardContent>
          <Typography>No mesh data available for editing</Typography>
        </CardContent>
      </Card>
    );
  }

  const selectedEdges = MeshEditor.getSelectedEdges(meshEditData);
  const totalEdges = meshEditData.edges.length;

  const handleSelectionModeChange = (mode: SelectionMode) => {
    dispatch(setSubObjectSelectionMode(mode));
  };

  const handleSelectAll = () => {
    const allIndices = meshEditData.edges.map((_, index) => index);
    dispatch(
      selectSubObjects({
        modelId,
        type: "edge",
        indices: allIndices,
        mode: "set",
      })
    );
  };

  const handleDeselectAll = () => {
    dispatch(
      selectSubObjects({
        modelId,
        type: "edge",
        indices: [],
        mode: "set",
      })
    );
  };

  const handleBevelEdges = () => {
    if (selectedEdges.length === 0) return;

    dispatch(
      bevelEdges({
        modelId,
        edgeIndices: selectedEdges.map((e) => e.index),
        segments: bevelSegments,
        distance: bevelDistance,
      })
    );
  };

  const handleSplitEdges = () => {
    if (selectedEdges.length === 0) return;

    console.log(
      "Splitting edges:",
      selectedEdges.map((e) => e.index)
    );
  };

  const handleDeleteEdges = () => {
    if (selectedEdges.length === 0) return;

    console.log(
      "Deleting edges:",
      selectedEdges.map((e) => e.index)
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Edge Editor
        </Typography>

        {/* Selection Info */}
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            {selectedEdges.length} of {totalEdges} edges selected
          </Typography>
          {selectedEdges.length > 0 && (
            <Box mt={1}>
              {selectedEdges.slice(0, 5).map((edge) => (
                <Chip
                  key={edge.index}
                  label={`E${edge.index}`}
                  size="small"
                  color="primary"
                  style={{ margin: 2 }}
                />
              ))}
              {selectedEdges.length > 5 && (
                <Chip
                  label={`+${selectedEdges.length - 5} more`}
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

        {/* Edge Operations */}
        {selectedEdges.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Edge Operations
            </Typography>

            {/* Bevel Settings */}
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Bevel Settings
              </Typography>
              <Grid container spacing={2} mb={1}>
                <Grid item xs={6}>
                  <TextField
                    label="Segments"
                    type="number"
                    size="small"
                    value={bevelSegments}
                    onChange={(e) =>
                      setBevelSegments(parseInt(e.target.value) || 2)
                    }
                    inputProps={{ min: 1, max: 10 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Distance"
                    type="number"
                    size="small"
                    value={bevelDistance}
                    onChange={(e) =>
                      setBevelDistance(parseFloat(e.target.value) || 0.1)
                    }
                    inputProps={{ step: 0.01, min: 0.01 }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                startIcon={<LinearScale />}
                onClick={handleBevelEdges}
                variant="outlined"
                size="small"
                fullWidth
              >
                Bevel Edges
              </Button>
              <Button
                startIcon={<CallSplit />}
                onClick={handleSplitEdges}
                variant="outlined"
                size="small"
                fullWidth
              >
                Split Edges
              </Button>
              <Button
                startIcon={<Delete />}
                onClick={handleDeleteEdges}
                color="error"
                variant="outlined"
                size="small"
                fullWidth
              >
                Delete Edges
              </Button>
            </Box>
          </>
        )}

        {/* Edge List */}
        {selectedEdges.length > 0 && selectedEdges.length <= 10 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Edges
            </Typography>
            <List dense>
              {selectedEdges.map((edge) => (
                <ListItem key={edge.index}>
                  <ListItemText
                    primary={`Edge ${edge.index}`}
                    secondary={`Vertices: ${edge.vertices[0]} - ${edge.vertices[1]}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Edge Loop Tools */}
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Edge Loop Tools
          </Typography>
          <ButtonGroup size="small" variant="outlined" fullWidth>
            <Button>Select Loop</Button>
            <Button>Select Ring</Button>
          </ButtonGroup>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EdgeEditor;

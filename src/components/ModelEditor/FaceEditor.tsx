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
} from "@mui/material";
import {
  Delete,
  OpenInFull,
  ZoomOut,
  Flip,
  SelectAll,
  DeselectOutlined,
  CallSplit,
  Merge,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setSubObjectSelectionMode,
  selectSubObjects,
} from "../../store/slices/uiSlice";
import { extrudeFaces, insetFaces } from "../../store/slices/modelSlice";
import { SelectionMode } from "../../types";
import { MeshEditor } from "../../utils/meshEditor";

interface FaceEditorProps {
  modelId: string;
}

const FaceEditor: React.FC<FaceEditorProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const meshEditData = useSelector(
    (state: RootState) => state.ui.meshEditData[modelId]
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [insetDistance, setInsetDistance] = useState(0.1);
  const [keepFaces, setKeepFaces] = useState(true);

  if (!meshEditData) {
    return (
      <Card>
        <CardContent>
          <Typography>No mesh data available for editing</Typography>
        </CardContent>
      </Card>
    );
  }

  const selectedFaces = MeshEditor.getSelectedFaces(meshEditData);
  const totalFaces = meshEditData.faces.length;

  const handleSelectionModeChange = (mode: SelectionMode) => {
    dispatch(setSubObjectSelectionMode(mode));
  };

  const handleSelectAll = () => {
    const allIndices = meshEditData.faces.map((_, index) => index);
    dispatch(
      selectSubObjects({
        modelId,
        type: "face",
        indices: allIndices,
        mode: "set",
      })
    );
  };

  const handleDeselectAll = () => {
    dispatch(
      selectSubObjects({
        modelId,
        type: "face",
        indices: [],
        mode: "set",
      })
    );
  };

  const handleExtrudeFaces = () => {
    if (selectedFaces.length === 0) return;

    dispatch(
      extrudeFaces({
        modelId,
        faceIndices: selectedFaces.map((f) => f.index),
        distance: extrudeDistance,
      })
    );
  };

  const handleInsetFaces = () => {
    if (selectedFaces.length === 0) return;

    dispatch(
      insetFaces({
        modelId,
        faceIndices: selectedFaces.map((f) => f.index),
        distance: insetDistance,
      })
    );
  };

  const handleSubdivideFaces = () => {
    if (selectedFaces.length === 0) return;

    console.log(
      "Subdividing faces:",
      selectedFaces.map((f) => f.index)
    );
  };

  const handleFlipNormals = () => {
    if (selectedFaces.length === 0) return;

    console.log(
      "Flipping normals of faces:",
      selectedFaces.map((f) => f.index)
    );
  };

  const handleDeleteFaces = () => {
    if (selectedFaces.length === 0) return;

    console.log(
      "Deleting faces:",
      selectedFaces.map((f) => f.index)
    );
  };

  const handleMergeFaces = () => {
    if (selectedFaces.length < 2) return;

    console.log(
      "Merging faces:",
      selectedFaces.map((f) => f.index)
    );
  };

  const handleSeparateFaces = () => {
    if (selectedFaces.length === 0) return;

    console.log(
      "Separating faces:",
      selectedFaces.map((f) => f.index)
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Face Editor
        </Typography>

        {/* Selection Info */}
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            {selectedFaces.length} of {totalFaces} faces selected
          </Typography>
          {selectedFaces.length > 0 && (
            <Box mt={1}>
              {selectedFaces.slice(0, 5).map((face) => (
                <Chip
                  key={face.index}
                  label={`F${face.index}`}
                  size="small"
                  color="primary"
                  style={{ margin: 2 }}
                />
              ))}
              {selectedFaces.length > 5 && (
                <Chip
                  label={`+${selectedFaces.length - 5} more`}
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

        {/* Face Operations */}
        {selectedFaces.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Face Operations
            </Typography>

            {/* Extrude Settings */}
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Extrude Settings
              </Typography>
              <Grid container spacing={2} mb={1}>
                <Grid item xs={8}>
                  <TextField
                    label="Distance"
                    type="number"
                    size="small"
                    value={extrudeDistance}
                    onChange={(e) =>
                      setExtrudeDistance(parseFloat(e.target.value) || 0.5)
                    }
                    inputProps={{ step: 0.1 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={keepFaces}
                        onChange={(e) => setKeepFaces(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Keep Faces"
                    labelPlacement="top"
                  />
                </Grid>
              </Grid>
              <Button
                startIcon={<OpenInFull />}
                onClick={handleExtrudeFaces}
                variant="outlined"
                size="small"
                fullWidth
              >
                Extrude
              </Button>
            </Box>

            {/* Inset Settings */}
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Inset Settings
              </Typography>
              <TextField
                label="Distance"
                type="number"
                size="small"
                value={insetDistance}
                onChange={(e) =>
                  setInsetDistance(parseFloat(e.target.value) || 0.1)
                }
                inputProps={{ step: 0.01, min: 0.01 }}
                fullWidth
                style={{ marginBottom: 8 }}
              />
              <Button
                startIcon={<ZoomOut />}
                onClick={handleInsetFaces}
                variant="outlined"
                size="small"
                fullWidth
              >
                Inset
              </Button>
            </Box>

            {/* Basic Operations */}
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Basic Operations
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  startIcon={<CallSplit />}
                  onClick={handleSubdivideFaces}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  Subdivide
                </Button>
                <Button
                  startIcon={<Flip />}
                  onClick={handleFlipNormals}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  Flip Normals
                </Button>
                {selectedFaces.length >= 2 && (
                  <Button
                    startIcon={<Merge />}
                    onClick={handleMergeFaces}
                    variant="outlined"
                    size="small"
                    fullWidth
                  >
                    Merge Faces
                  </Button>
                )}
                <Button
                  onClick={handleSeparateFaces}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  Separate
                </Button>
                <Button
                  startIcon={<Delete />}
                  onClick={handleDeleteFaces}
                  color="error"
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  Delete Faces
                </Button>
              </Box>
            </Box>
          </>
        )}

        {/* Face List */}
        {selectedFaces.length > 0 && selectedFaces.length <= 8 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Faces
            </Typography>
            <List dense>
              {selectedFaces.map((face) => (
                <ListItem key={face.index}>
                  <ListItemText
                    primary={`Face ${face.index}`}
                    secondary={`Vertices: ${face.vertices.join(", ")}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Advanced Selection */}
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Advanced Selection
          </Typography>
          <ButtonGroup size="small" variant="outlined" fullWidth>
            <Button>Select Similar</Button>
            <Button>Select Connected</Button>
          </ButtonGroup>
        </Box>

        {/* Material Assignment */}
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Material Assignment
          </Typography>
          <ButtonGroup size="small" variant="outlined" fullWidth>
            <Button disabled={selectedFaces.length === 0}>
              Assign Material
            </Button>
            <Button disabled={selectedFaces.length === 0}>
              Clear Material
            </Button>
          </ButtonGroup>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FaceEditor;

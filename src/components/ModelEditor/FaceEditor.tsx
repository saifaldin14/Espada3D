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
  Tooltip,
  Divider,
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
  Add,
  Remove,
  Loop,
  ContentCut,
  Architecture,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setSubObjectSelectionMode,
  selectSubObjects,
} from "../../store/slices/uiSlice";
import { 
  extrudeFaces, 
  insetFaces,
  subdivideFaces,
  flipNormals,
  selectFaceLoop,
  growSelection,
  deleteSelectedElements
} from "../../store/slices/modelSlice";
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

  // Operation parameters
  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [extrudeDirection, setExtrudeDirection] = useState<'normal' | 'custom'>('normal');
  const [customDirection, setCustomDirection] = useState<[number, number, number]>([0, 0, 1]);
  const [individualFaces, setIndividualFaces] = useState(false);
  
  const [insetDistance, setInsetDistance] = useState(0.1);
  const [insetDepth, setInsetDepth] = useState(0.0);
  
  const [subdivisionCuts, setSubdivisionCuts] = useState(1);
  const [subdivisionSmooth, setSubdivisionSmooth] = useState(0.0);

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

  const handleGrowSelection = () => {
    dispatch(growSelection({ modelId, operation: 'grow' }));
  };

  const handleShrinkSelection = () => {
    dispatch(growSelection({ modelId, operation: 'shrink' }));
  };

  const handleSelectFaceLoop = () => {
    if (selectedFaces.length === 0) return;
    dispatch(selectFaceLoop({ modelId, faceIndex: selectedFaces[0].index }));
  };

  const handleExtrudeFaces = () => {
    if (selectedFaces.length === 0) return;

    const direction = extrudeDirection === 'custom' ? customDirection : undefined;
    
    dispatch(
      extrudeFaces({
        modelId,
        faceIndices: selectedFaces.map((f) => f.index),
        distance: extrudeDistance,
        direction,
        individualFaces,
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
        depth: insetDepth,
        individualFaces,
      })
    );
  };

  const handleSubdivideFaces = () => {
    if (selectedFaces.length === 0) return;

    dispatch(
      subdivideFaces({
        modelId,
        faceIndices: selectedFaces.map((f) => f.index),
        cuts: subdivisionCuts,
        smoothness: subdivisionSmooth,
      })
    );
  };

  const handleFlipNormals = () => {
    if (selectedFaces.length === 0) return;
    dispatch(flipNormals({ modelId }));
  };

  const handleDeleteFaces = () => {
    if (selectedFaces.length === 0) return;
    dispatch(deleteSelectedElements({ modelId }));
  };

  const calculateTotalArea = (): number => {
    return selectedFaces.reduce((total, face) => {
      // Simplified area calculation - would need proper implementation
      return total + 1.0;
    }, 0);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Face Editor
        </Typography>

        {/* Selection Info */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {selectedFaces.length} of {totalFaces} faces selected
          </Typography>
          {selectedFaces.length > 0 && (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Total Area: {calculateTotalArea().toFixed(3)} units²
              </Typography>
              <Box mt={1}>
                {selectedFaces.slice(0, 8).map((face) => (
                  <Chip
                    key={face.index}
                    label={`F${face.index}`}
                    size="small"
                    color="primary"
                    style={{ margin: 2 }}
                  />
                ))}
                {selectedFaces.length > 8 && (
                  <Chip
                    label={`+${selectedFaces.length - 8} more`}
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
            {(['single', 'multiple', 'box', 'lasso'] as SelectionMode[]).map((mode) => (
              <Button
                key={mode}
                variant={selectionMode === mode ? 'contained' : 'outlined'}
                onClick={() => handleSelectionModeChange(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
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
                disabled={selectedFaces.length === 0}
              >
                Grow
              </Button>
            </Tooltip>
            <Tooltip title="Shrink Selection (Ctrl+NumPad-)">
              <Button
                startIcon={<Remove />}
                onClick={handleShrinkSelection}
                size="small"
                disabled={selectedFaces.length === 0}
              >
                Shrink
              </Button>
            </Tooltip>
            <Tooltip title="Select Face Loop (Alt+Click)">
              <Button
                startIcon={<Loop />}
                onClick={handleSelectFaceLoop}
                size="small"
                disabled={selectedFaces.length === 0}
              >
                Loop
              </Button>
            </Tooltip>
          </Box>
        </Paper>

        {/* Face Operations */}
        {selectedFaces.length > 0 && (
          <>
            {/* Extrude */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Extrude Faces (E)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Distance: {extrudeDistance.toFixed(3)}
                </Typography>
                <Slider
                  value={extrudeDistance}
                  onChange={(event: Event, value: number | number[]) => setExtrudeDistance(value as number)}
                  min={-2.0}
                  max={2.0}
                  step={0.01}
                  size="small"
                />
              </Box>

              <FormControl size="small" sx={{ mb: 2, minWidth: 120 }}>
                <InputLabel>Direction</InputLabel>
                <Select
                  value={extrudeDirection}
                  label="Direction"
                  onChange={(e) => setExtrudeDirection(e.target.value as 'normal' | 'custom')}
                >
                  <MenuItem value="normal">Face Normal</MenuItem>
                  <MenuItem value="custom">Custom Direction</MenuItem>
                </Select>
              </FormControl>

              {extrudeDirection === 'custom' && (
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  {(['X', 'Y', 'Z'] as const).map((axis, index) => (
                    <Grid item xs={4} key={axis}>
                      <TextField
                        label={axis}
                        type="number"
                        size="small"
                        value={customDirection[index]}
                        onChange={(e) => {
                          const newDir = [...customDirection] as [number, number, number];
                          newDir[index] = parseFloat(e.target.value) || 0;
                          setCustomDirection(newDir);
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={individualFaces}
                      onChange={(e) => setIndividualFaces(e.target.checked)}
                    />
                  }
                  label="Individual Faces"
                />
              </Box>

              <Button
                startIcon={<OpenInFull />}
                onClick={handleExtrudeFaces}
                variant="contained"
                size="small"
                color="primary"
              >
                Extrude ({selectedFaces.length} faces)
              </Button>
            </Paper>

            {/* Inset */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Inset Faces (I)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Inset Distance: {insetDistance.toFixed(3)}
                </Typography>
                <Slider
                  value={insetDistance}
                  onChange={(event: Event, value: number | number[]) => setInsetDistance(value as number)}
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Depth: {insetDepth.toFixed(3)}
                </Typography>
                <Slider
                  value={insetDepth}
                  onChange={(event: Event, value: number | number[]) => setInsetDepth(value as number)}
                  min={-1.0}
                  max={1.0}
                  step={0.01}
                  size="small"
                />
              </Box>

              <Button
                startIcon={<ZoomOut />}
                onClick={handleInsetFaces}
                variant="contained"
                size="small"
                color="primary"
              >
                Inset ({selectedFaces.length} faces)
              </Button>
            </Paper>

            {/* Subdivide */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Subdivide Faces (Ctrl+R)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Cuts: {subdivisionCuts}
                </Typography>
                <Slider
                  value={subdivisionCuts}
                  onChange={(event: Event, value: number | number[]) => setSubdivisionCuts(value as number)}
                  min={1}
                  max={5}
                  step={1}
                  marks
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Smoothness: {subdivisionSmooth.toFixed(2)}
                </Typography>
                <Slider
                  value={subdivisionSmooth}
                  onChange={(event: Event, value: number | number[]) => setSubdivisionSmooth(value as number)}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  size="small"
                />
              </Box>

              <Button
                startIcon={<CallSplit />}
                onClick={handleSubdivideFaces}
                variant="contained"
                size="small"
                color="secondary"
              >
                Subdivide ({selectedFaces.length} faces)
              </Button>
            </Paper>

            {/* Utilities */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Face Utilities
              </Typography>
              
              <Box display="flex" gap={1} flexWrap="wrap">
                <Tooltip title="Flip Normals (Ctrl+F)">
                  <Button
                    startIcon={<Flip />}
                    onClick={handleFlipNormals}
                    size="small"
                    variant="outlined"
                  >
                    Flip Normals
                  </Button>
                </Tooltip>
              </Box>
            </Paper>

            {/* Selection Details */}
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selection Details
              </Typography>
              <List dense>
                {selectedFaces.slice(0, 5).map((face) => (
                  <ListItem key={face.index} divider>
                    <ListItemText
                      primary={`Face ${face.index}`}
                      secondary={`Vertices: ${face.vertices.length}, Normal: (${face.normal.map(n => n.toFixed(2)).join(', ')})`}
                    />
                  </ListItem>
                ))}
                {selectedFaces.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${selectedFaces.length - 5} more faces`}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </>
        )}

        {/* Danger Zone */}
        {selectedFaces.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="subtitle2" gutterBottom>
              Danger Zone
            </Typography>
            <Button
              startIcon={<Delete />}
              onClick={handleDeleteFaces}
              variant="contained"
              color="error"
              size="small"
            >
              Delete Selected Faces ({selectedFaces.length})
            </Button>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default FaceEditor;

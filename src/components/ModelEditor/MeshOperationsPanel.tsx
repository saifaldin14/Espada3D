import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  ButtonGroup,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
} from "@mui/material";
import {
  ExpandMore,
  OpenWith,
  RotateRight,
  ZoomOutMap,
  OpenInFull,
  ZoomOut,
  CallSplit,
  CallMerge,
  ContentCut,
  Architecture,
  Delete,
  Undo,
  Redo,
  FlipToFront,
  Tune,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useMeshEditor } from "../../hooks/useMeshEditor";
import { Vector3Tuple, TransformConstraint, MergeType } from "../../types";
import { MeshEditModes } from "../../consts";
import { EditModes } from "../../Enums";

interface MeshOperationsPanelProps {
  modelId: string;
}

const MeshOperationsPanel: React.FC<MeshOperationsPanelProps> = ({
  modelId,
}) => {
  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const meshData = useSelector(
    (state: RootState) => state.mesh.meshData[modelId]
  );

  const {
    moveVertices,
    scaleVertices,
    rotateVertices,
    mergeVertices,
    extrudeFaces,
    insetFaces,
    subdivideFaces,
    bevelEdges,
    splitEdges,
    loopCut,
    deleteSelectedElements,
  } = useMeshEditor(modelId);

  // Transform parameters
  const [moveVector, setMoveVector] = useState<Vector3Tuple>([0, 0, 0]);
  const [scaleVector, setScaleVector] = useState<Vector3Tuple>([1, 1, 1]);
  const [rotationVector, setRotationVector] = useState<Vector3Tuple>([0, 0, 0]);
  const [constraint, setConstraint] = useState<TransformConstraint | "">("");
  const [useCustomPivot, setUseCustomPivot] = useState(false);
  const [customPivot, setCustomPivot] = useState<Vector3Tuple>([0, 0, 0]);

  // Operation parameters
  const [extrudeDistance, setExtrudeDistance] = useState(0.5);
  const [extrudeIndividual, setExtrudeIndividual] = useState(false);
  const [insetDistance, setInsetDistance] = useState(0.1);
  const [insetDepth, setInsetDepth] = useState(0.0);
  const [subdivisionCuts, setSubdivisionCuts] = useState(1);
  const [subdivisionSmooth, setSubdivisionSmooth] = useState(0.0);
  const [bevelDistance, setBevelDistance] = useState(0.1);
  const [bevelSegments, setBevelSegments] = useState(1);
  const [bevelProfile, setBevelProfile] = useState(0.5);
  const [splitCount, setSplitCount] = useState(1);
  const [loopCuts, setLoopCuts] = useState(1);
  const [mergeType, setMergeType] = useState<MergeType>("center");

  // Get selection info
  const getSelectionInfo = useCallback(() => {
    if (!meshData) return { count: 0, type: "none" };

    switch (currentSubObjectType) {
      case EditModes.vertex:
        return {
          count: meshData.vertices.filter((v) => v.selected).length,
          type: EditModes.vertex,
          total: meshData.vertices.length,
        };
      case EditModes.edge:
        return {
          count: meshData.edges.filter((e) => e.selected).length,
          type: EditModes.edge,
          total: meshData.edges.length,
        };
      case EditModes.face:
        return {
          count: meshData.faces.filter((f) => f.selected).length,
          type: EditModes.face,
          total: meshData.faces.length,
        };
      default:
        return { count: 0, type: "none", total: 0 };
    }
  }, [meshData, currentSubObjectType]);

  const selectionInfo = getSelectionInfo();

  // Transform operations
  const handleMove = useCallback(() => {
    const pivot = useCustomPivot ? customPivot : undefined;
    moveVertices(moveVector, constraint || undefined, pivot);
    setMoveVector([0, 0, 0]); // Reset after operation
  }, [moveVector, constraint, useCustomPivot, customPivot, moveVertices]);

  const handleScale = useCallback(() => {
    const pivot = useCustomPivot ? customPivot : undefined;
    scaleVertices(scaleVector, constraint || undefined, pivot);
    setScaleVector([1, 1, 1]); // Reset after operation
  }, [scaleVector, constraint, useCustomPivot, customPivot, scaleVertices]);

  const handleRotate = useCallback(() => {
    const pivot = useCustomPivot ? customPivot : undefined;
    rotateVertices(rotationVector, pivot);
    setRotationVector([0, 0, 0]); // Reset after operation
  }, [rotationVector, useCustomPivot, customPivot, rotateVertices]);

  // Mesh operations
  const handleExtrude = useCallback(() => {
    extrudeFaces(extrudeDistance, undefined, extrudeIndividual);
  }, [extrudeDistance, extrudeIndividual, extrudeFaces]);

  const handleInset = useCallback(() => {
    insetFaces(insetDistance, insetDepth, extrudeIndividual);
  }, [insetDistance, insetDepth, extrudeIndividual, insetFaces]);

  const handleSubdivide = useCallback(() => {
    subdivideFaces(subdivisionCuts, subdivisionSmooth);
  }, [subdivisionCuts, subdivisionSmooth, subdivideFaces]);

  const handleBevel = useCallback(() => {
    bevelEdges(bevelDistance, bevelSegments, bevelProfile);
  }, [bevelDistance, bevelSegments, bevelProfile, bevelEdges]);

  const handleSplitEdges = useCallback(() => {
    splitEdges(splitCount);
  }, [splitCount, splitEdges]);

  const handleLoopCut = useCallback(() => {
    if (meshData && meshData.edges.length > 0) {
      const firstSelectedEdge = meshData.edges.find((e) => e.selected);
      if (firstSelectedEdge) {
        loopCut(firstSelectedEdge.index, loopCuts, subdivisionSmooth);
      }
    }
  }, [meshData, loopCuts, subdivisionSmooth, loopCut]);

  const handleMerge = useCallback(() => {
    mergeVertices(mergeType);
  }, [mergeType, mergeVertices]);

  const handleDelete = useCallback(() => {
    deleteSelectedElements();
  }, [deleteSelectedElements]);

  if (!MeshEditModes.includes(editMode)) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            Switch to vertex, edge, or face edit mode to access mesh operations
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Selection Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="h6">
              {currentSubObjectType.charAt(0).toUpperCase() +
                currentSubObjectType.slice(1)}{" "}
              Mode
            </Typography>
            <Chip
              label={`${selectionInfo.count}/${selectionInfo.total}`}
              color={selectionInfo.count > 0 ? "primary" : "default"}
              size="small"
            />
          </Box>
          {selectionInfo.count === 0 && (
            <Alert severity="info">
              Select {currentSubObjectType}s to enable mesh operations
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transform Operations */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <OpenWith fontSize="small" />
            <Typography variant="subtitle1">Transform</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Constraint Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Constraint</InputLabel>
                <Select
                  value={constraint}
                  onChange={(e) =>
                    setConstraint(e.target.value as TransformConstraint | "")
                  }
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
            </Grid>

            {/* Move */}
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Move
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
                  />
                </Grid>
              </Grid>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleMove}
                disabled={selectionInfo.count === 0}
                sx={{ mt: 1 }}
                startIcon={<OpenWith />}
              >
                Apply Move
              </Button>
            </Grid>

            {/* Scale */}
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Scale
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
                  />
                </Grid>
              </Grid>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleScale}
                disabled={selectionInfo.count === 0}
                sx={{ mt: 1 }}
                startIcon={<ZoomOutMap />}
              >
                Apply Scale
              </Button>
            </Grid>

            {/* Rotate */}
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Rotate (degrees)
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
                        (parseFloat(e.target.value) * Math.PI) / 180 || 0,
                        rotationVector[1],
                        rotationVector[2],
                      ])
                    }
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
                        (parseFloat(e.target.value) * Math.PI) / 180 || 0,
                        rotationVector[2],
                      ])
                    }
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
                        (parseFloat(e.target.value) * Math.PI) / 180 || 0,
                      ])
                    }
                  />
                </Grid>
              </Grid>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleRotate}
                disabled={selectionInfo.count === 0}
                sx={{ mt: 1 }}
                startIcon={<RotateRight />}
              >
                Apply Rotation
              </Button>
            </Grid>

            {/* Custom Pivot */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useCustomPivot}
                    onChange={(e) => setUseCustomPivot(e.target.checked)}
                  />
                }
                label="Custom Pivot"
              />
              {useCustomPivot && (
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <TextField
                      label="X"
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
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Y"
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
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Z"
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
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Face Operations */}
      {currentSubObjectType === EditModes.face && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Architecture fontSize="small" />
              <Typography variant="subtitle1">Face Operations</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Extrude */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Extrude
                </Typography>
                <TextField
                  fullWidth
                  label="Distance"
                  type="number"
                  size="small"
                  value={extrudeDistance}
                  onChange={(e) =>
                    setExtrudeDistance(parseFloat(e.target.value) || 0)
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={extrudeIndividual}
                      onChange={(e) => setExtrudeIndividual(e.target.checked)}
                    />
                  }
                  label="Individual Faces"
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleExtrude}
                  disabled={selectionInfo.count === 0}
                  startIcon={<OpenInFull />}
                  sx={{ mt: 1 }}
                >
                  Extrude
                </Button>
              </Grid>

              {/* Inset */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Inset
                </Typography>
                <TextField
                  fullWidth
                  label="Distance"
                  type="number"
                  size="small"
                  value={insetDistance}
                  onChange={(e) =>
                    setInsetDistance(parseFloat(e.target.value) || 0)
                  }
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  label="Depth"
                  type="number"
                  size="small"
                  value={insetDepth}
                  onChange={(e) =>
                    setInsetDepth(parseFloat(e.target.value) || 0)
                  }
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleInset}
                  disabled={selectionInfo.count === 0}
                  startIcon={<ZoomOut />}
                >
                  Inset
                </Button>
              </Grid>

              {/* Subdivide */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Subdivide
                </Typography>
                <TextField
                  fullWidth
                  label="Cuts"
                  type="number"
                  size="small"
                  value={subdivisionCuts}
                  onChange={(e) =>
                    setSubdivisionCuts(parseInt(e.target.value) || 1)
                  }
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" gutterBottom>
                  Smoothness: {subdivisionSmooth.toFixed(2)}
                </Typography>
                <Slider
                  value={subdivisionSmooth}
                  onChange={(event: Event, value: number | number[]) =>
                    setSubdivisionSmooth(value as number)
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubdivide}
                  disabled={selectionInfo.count === 0}
                  startIcon={<CallSplit />}
                >
                  Subdivide
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Edge Operations */}
      {currentSubObjectType === EditModes.edge && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <ContentCut fontSize="small" />
              <Typography variant="subtitle1">Edge Operations</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Bevel */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Bevel
                </Typography>
                <TextField
                  fullWidth
                  label="Distance"
                  type="number"
                  size="small"
                  value={bevelDistance}
                  onChange={(e) =>
                    setBevelDistance(parseFloat(e.target.value) || 0)
                  }
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  label="Segments"
                  type="number"
                  size="small"
                  value={bevelSegments}
                  onChange={(e) =>
                    setBevelSegments(parseInt(e.target.value) || 1)
                  }
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" gutterBottom>
                  Profile: {bevelProfile.toFixed(2)}
                </Typography>
                <Slider
                  value={bevelProfile}
                  onChange={(event: Event, value: number | number[]) =>
                    setBevelProfile(value as number)
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleBevel}
                  disabled={selectionInfo.count === 0}
                  startIcon={<Architecture />}
                >
                  Bevel
                </Button>
              </Grid>

              {/* Split */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Split
                </Typography>
                <TextField
                  fullWidth
                  label="Splits"
                  type="number"
                  size="small"
                  value={splitCount}
                  onChange={(e) => setSplitCount(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSplitEdges}
                  disabled={selectionInfo.count === 0}
                  startIcon={<ContentCut />}
                >
                  Split Edges
                </Button>
              </Grid>

              {/* Loop Cut */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Loop Cut
                </Typography>
                <TextField
                  fullWidth
                  label="Cuts"
                  type="number"
                  size="small"
                  value={loopCuts}
                  onChange={(e) => setLoopCuts(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleLoopCut}
                  disabled={selectionInfo.count === 0}
                  startIcon={<CallSplit />}
                >
                  Loop Cut
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Vertex Operations */}
      {currentSubObjectType === EditModes.vertex && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Tune fontSize="small" />
              <Typography variant="subtitle1">Vertex Operations</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Merge */}
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Merge
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel>Merge Type</InputLabel>
                  <Select
                    value={mergeType}
                    onChange={(e) => setMergeType(e.target.value as MergeType)}
                    label="Merge Type"
                  >
                    <MenuItem value="center">At Center</MenuItem>
                    <MenuItem value="first">At First</MenuItem>
                    <MenuItem value="last">At Last</MenuItem>
                    <MenuItem value="cursor">At Cursor</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleMerge}
                  disabled={selectionInfo.count < 2}
                  startIcon={<CallMerge />}
                >
                  Merge Vertices
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* General Operations */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Delete fontSize="small" />
            <Typography variant="subtitle1">General Operations</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={handleDelete}
                disabled={selectionInfo.count === 0}
                startIcon={<Delete />}
              >
                Delete Selected
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default MeshOperationsPanel;

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateModelTransform,
  updateModelMaterial,
  updateModelMetadata,
  undo,
  redo,
  copyModels,
  pasteModels,
  removeModel,
  duplicateModel,
  saveToHistory,
} from "../../store/slices/modelSlice";
import { setEditMode, setActiveTool } from "../../store/slices/uiSlice";
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  IconButton,
  Slider,
  Tooltip,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  ButtonGroup,
  Collapse,
  Paper,
  Fade,
  Drawer,
  Stack,
  Divider,
} from "@mui/material";
import {
  Undo,
  Redo,
  ContentCopy,
  ContentPaste,
  Delete,
  FileCopy,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  ExpandMore,
  ExpandLess,
  ThreeDRotation,
  Style,
  Settings,
  Straighten,
  ColorLens,
  FormatPaint,
  Tune,
  Build,
  ViewInAr,
  OpenWith,
  ZoomOutMap,
  RotateRight,
  SaveAlt,
  Category as CategoryIcon,
  Animation,
} from "@mui/icons-material";
import { SketchPicker } from "react-color";
import { MaterialProperties, Vector3Tuple, EditMode } from "../../types";
import TextureManager from "./TextureManager";
import SubObjectEditor from "./SubObjectEditor";
import MeshOperationsPanel from "./MeshOperationsPanel";
import { glassStyles } from "../../config/theme";

const ModelEditor: React.FC = () => {
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const models = useSelector((state: any) => state.models.models);
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const editMode = useSelector((state: any) => state.ui.editMode);
  const dispatch = useDispatch();

  const [position, setPosition] = useState<Vector3Tuple>([0, 0, 0]);
  const [rotation, setRotation] = useState<Vector3Tuple>([0, 0, 0]);
  const [scale, setScale] = useState<Vector3Tuple>([1, 1, 1]);
  const [materialType, setMaterialType] =
    useState<MaterialProperties["type"]>("standard");
  const [color, setColor] = useState<string>("#00ff00");
  const [opacity, setOpacity] = useState<number>(1);
  const [metalness, setMetalness] = useState<number>(0);
  const [roughness, setRoughness] = useState<number>(0.5);
  const [emissive, setEmissive] = useState<string>("#000000");
  const [emissiveIntensity, setEmissiveIntensity] = useState<number>(0);
  const [transparent, setTransparent] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [locked, setLocked] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>("");

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    transform: true,
    object: true,
    material: true,
    actions: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section as keyof typeof expandedSections],
    });
  };

  // State to track history panel visibility
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const historyIndex = useSelector((state: any) => state.models.historyIndex);
  const historySteps = useSelector((state: any) => state.models.history.length);

  const selectedModel = models.find((m: any) => m.id === selectedModelId);

  useEffect(() => {
    if (selectedModel) {
      setPosition(selectedModel.position ?? [0, 0, 0]);
      setRotation(selectedModel.rotation ?? [0, 0, 0]);
      setScale(selectedModel.scale ?? [1, 1, 1]);
      setMaterialType(selectedModel.material?.type ?? "standard");
      setColor(selectedModel.material?.color ?? "#00ff00");
      setOpacity(selectedModel.material?.opacity ?? 1);
      setMetalness(selectedModel.material?.metalness ?? 0);
      setRoughness(selectedModel.material?.roughness ?? 0.5);
      setEmissive(selectedModel.material?.emissive ?? "#000000");
      setEmissiveIntensity(selectedModel.material?.emissiveIntensity ?? 0);
      setTransparent(selectedModel.material?.transparent ?? false);
      setWireframe(selectedModel.material?.wireframe ?? false);
      setVisible(selectedModel.visible ?? true);
      setLocked(selectedModel.locked ?? false);
      setModelName(selectedModel.name ?? "");
    }
  }, [selectedModel]);

  const handleTransformChange = (axis: number, value: number) => {
    if (!selectedModelId) return;

    let newPosition: Vector3Tuple = [...position];
    let newRotation: Vector3Tuple = [...rotation];
    let newScale: Vector3Tuple = [...scale];

    if (isNaN(value)) value = 0;

    switch (activeTool) {
      case "translate":
        newPosition[axis] = value;
        setPosition(newPosition);
        break;
      case "rotate":
        newRotation[axis] = value;
        setRotation(newRotation);
        break;
      case "scale":
        newScale[axis] = value;
        setScale(newScale);
        break;
      default:
        return;
    }

    dispatch(
      updateModelTransform({
        id: selectedModelId as string,
        position: newPosition,
        rotation: newRotation,
        scale: newScale,
      })
    );
  };

  const handleMaterialChange = (property: string, value: any) => {
    if (!selectedModelId) return;

    const newMaterial: MaterialProperties = {
      type: materialType,
      color,
      opacity,
      metalness,
      roughness,
      emissive,
      emissiveIntensity,
      transparent,
      wireframe,
      [property]: value,
    };

    // Update local state
    switch (property) {
      case "type":
        setMaterialType(value);
        break;
      case "color":
        setColor(value);
        break;
      case "opacity":
        setOpacity(value);
        break;
      case "metalness":
        setMetalness(value);
        break;
      case "roughness":
        setRoughness(value);
        break;
      case "emissive":
        setEmissive(value);
        break;
      case "emissiveIntensity":
        setEmissiveIntensity(value);
        break;
      case "transparent":
        setTransparent(value);
        break;
      case "wireframe":
        setWireframe(value);
        break;
    }

    dispatch(
      updateModelMaterial({
        id: selectedModelId as string,
        material: newMaterial,
      })
    );
  };

  const handleMetadataChange = (property: string, value: any) => {
    if (!selectedModelId) return;

    switch (property) {
      case "name":
        setModelName(value);
        break;
      case "visible":
        setVisible(value);
        break;
      case "locked":
        setLocked(value);
        break;
    }

    dispatch(
      updateModelMetadata({
        id: selectedModelId as string,
        [property]: value,
      })
    );
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: EditMode) => {
    dispatch(setEditMode(newValue));
  };

  const renderTransformControls = () => (
    <Paper elevation={0} sx={styles.section}>
      <Box sx={styles.sectionHeader} onClick={() => toggleSection("transform")}>
        <Box sx={styles.sectionHeaderLeft}>
          <ThreeDRotation sx={styles.sectionIcon} />
          <Typography variant="subtitle1" sx={styles.sectionTitle}>
            Transform
          </Typography>
        </Box>
        {expandedSections.transform ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={expandedSections.transform}>
        <Box sx={styles.sectionContent}>
          {/* Transform Tool Selection */}
          <Typography variant="body2" sx={styles.controlLabel}>
            Transform Tool
          </Typography>

          <ButtonGroup size="small" fullWidth sx={{ mb: 2 }}>
            <Button
              variant={activeTool === "translate" ? "contained" : "outlined"}
              onClick={() => dispatch(setActiveTool("translate"))}
              startIcon={<OpenWith fontSize="small" />}
              sx={styles.transformButton}
            >
              Move
            </Button>
            <Button
              variant={activeTool === "rotate" ? "contained" : "outlined"}
              onClick={() => dispatch(setActiveTool("rotate"))}
              startIcon={<RotateRight fontSize="small" />}
              sx={styles.transformButton}
            >
              Rotate
            </Button>
            <Button
              variant={activeTool === "scale" ? "contained" : "outlined"}
              onClick={() => dispatch(setActiveTool("scale"))}
              startIcon={<ZoomOutMap fontSize="small" />}
              sx={styles.transformButton}
            >
              Scale
            </Button>
          </ButtonGroup>

          {/* Coordinate Inputs */}
          <Typography variant="body2" sx={styles.controlLabel}>
            {activeTool === "translate"
              ? "Position"
              : activeTool === "rotate"
                ? "Rotation"
                : "Scale"}
          </Typography>
          <Grid container spacing={2}>
            {["X", "Y", "Z"].map((axis, i) => (
              <Grid item xs={4} key={i}>
                <TextField
                  label={axis}
                  value={
                    activeTool === "translate"
                      ? position[i]
                      : activeTool === "rotate"
                        ? rotation[i]
                        : scale[i]
                  }
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  onChange={(e) =>
                    handleTransformChange(i, parseFloat(e.target.value))
                  }
                  sx={styles.textField}
                  disabled={locked}
                  InputProps={{
                    endAdornment: (
                      <Typography variant="caption" sx={styles.unitLabel}>
                        {activeTool === "rotate" ? "°" : ""}
                      </Typography>
                    ),
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );

  const renderObjectControls = () => (
    <Paper elevation={0} sx={styles.section}>
      <Box sx={styles.sectionHeader} onClick={() => toggleSection("object")}>
        <Box sx={styles.sectionHeaderLeft}>
          <ViewInAr sx={styles.sectionIcon} />
          <Typography variant="subtitle1" sx={styles.sectionTitle}>
            Object Properties
          </Typography>
        </Box>
        {expandedSections.object ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={expandedSections.object}>
        <Box sx={styles.sectionContent}>
          <TextField
            label="Name"
            value={modelName}
            onChange={(e) => handleMetadataChange("name", e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            sx={{ mb: 3 }}
            disabled={locked}
            InputProps={{
              startAdornment: (
                <CategoryIcon sx={{ mr: 1, opacity: 0.7 }} fontSize="small" />
              ),
            }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={styles.stateToggleCard}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={visible}
                      onChange={(e) =>
                        handleMetadataChange("visible", e.target.checked)
                      }
                      icon={<VisibilityOff />}
                      checkedIcon={<Visibility />}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#00c9ff",
                        },
                      }}
                    />
                  }
                  label="Visible"
                  sx={{ m: 0 }}
                />
                <Typography variant="caption" sx={styles.stateCaption}>
                  {visible ? "Object is visible in scene" : "Object is hidden"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={styles.stateToggleCard}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={locked}
                      onChange={(e) =>
                        handleMetadataChange("locked", e.target.checked)
                      }
                      icon={<LockOpen />}
                      checkedIcon={<Lock />}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#ff9900",
                        },
                      }}
                    />
                  }
                  label="Locked"
                  sx={{ m: 0 }}
                />
                <Typography variant="caption" sx={styles.stateCaption}>
                  {locked
                    ? "Object is locked from editing"
                    : "Object is editable"}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {selectedModel && (
            <Box sx={styles.objectInfoCard}>
              <Box sx={styles.objectInfoRow}>
                <Typography variant="caption" color="textSecondary">
                  Type:
                </Typography>
                <Typography variant="caption" sx={styles.objectInfoValue}>
                  {selectedModel.type}
                </Typography>
              </Box>
              <Box sx={styles.objectInfoRow}>
                <Typography variant="caption" color="textSecondary">
                  Created:
                </Typography>
                <Typography variant="caption" sx={styles.objectInfoValue}>
                  {new Date(selectedModel.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={styles.objectInfoRow}>
                <Typography variant="caption" color="textSecondary">
                  Modified:
                </Typography>
                <Typography variant="caption" sx={styles.objectInfoValue}>
                  {new Date(selectedModel.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );

  const renderMaterialControls = () => (
    <Paper elevation={0} sx={styles.section}>
      <Box sx={styles.sectionHeader} onClick={() => toggleSection("material")}>
        <Box sx={styles.sectionHeaderLeft}>
          <ColorLens sx={styles.sectionIcon} />
          <Typography variant="subtitle1" sx={styles.sectionTitle}>
            Material
          </Typography>
        </Box>
        {expandedSections.material ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={expandedSections.material}>
        <Box sx={styles.sectionContent}>
          <FormControl fullWidth sx={styles.formControl}>
            <InputLabel id="material-type-label">Material Type</InputLabel>
            <Select
              labelId="material-type-label"
              value={materialType}
              onChange={(e) => handleMaterialChange("type", e.target.value)}
              label="Material Type"
              disabled={locked}
              startAdornment={
                <FormatPaint sx={{ mr: 1, opacity: 0.7 }} fontSize="small" />
              }
            >
              <MenuItem value="standard">Standard (PBR)</MenuItem>
              <MenuItem value="phong">Phong</MenuItem>
              <MenuItem value="lambert">Lambert</MenuItem>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="physical">Physical</MenuItem>
              <MenuItem value="toon">Toon</MenuItem>
            </Select>
          </FormControl>

          <Box sx={styles.materialPreviewWrapper}>
            <Box
              sx={{
                ...styles.materialPreview,
                backgroundColor: color,
                opacity: opacity,
                boxShadow:
                  metalness > 0.5
                    ? `0 0 20px rgba(255, 255, 255, ${metalness * 0.5})`
                    : "none",
                filter: `brightness(${1 + emissiveIntensity * 0.5})`,
              }}
            />
            <Typography variant="caption" sx={styles.materialPreviewLabel}>
              Material Preview
            </Typography>
          </Box>

          <Accordion sx={styles.materialAccordion} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2">Base Color</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={styles.colorPickerWrapper}>
                <SketchPicker
                  color={color}
                  onChange={(color) => handleMaterialChange("color", color.hex)}
                  disableAlpha={false}
                  width="100%"
                  presetColors={[
                    "#D0021B",
                    "#F5A623",
                    "#F8E71C",
                    "#8B572A",
                    "#7ED321",
                    "#417505",
                    "#BD10E0",
                    "#9013FE",
                    "#4A90E2",
                    "#50E3C2",
                    "#B8E986",
                    "#000000",
                    "#4A4A4A",
                    "#9B9B9B",
                    "#FFFFFF",
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Material sliders with more visual feedback */}
          <Grid container spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Grid item xs={4}>
              <Typography variant="body2" sx={styles.sliderLabel}>
                Opacity
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Slider
                value={opacity}
                onChange={(_: any, value: number | number[]) =>
                  handleMaterialChange("opacity", value)
                }
                min={0}
                max={1}
                step={0.01}
                disabled={locked}
                sx={styles.slider}
              />
            </Grid>
            <Grid item xs={2}>
              <Typography
                variant="caption"
                align="right"
                sx={{ display: "block" }}
              >
                {opacity.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>

          {(materialType === "standard" || materialType === "physical") && (
            <Fade in={true}>
              <Box>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={styles.sliderLabel}>
                      Metalness
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Slider
                      value={metalness}
                      onChange={(_: any, value: number | number[]) =>
                        handleMaterialChange("metalness", value)
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={locked}
                      sx={styles.slider}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="caption"
                      align="right"
                      sx={{ display: "block" }}
                    >
                      {metalness.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>

                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={styles.sliderLabel}>
                      Roughness
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Slider
                      value={roughness}
                      onChange={(_: any, value: number | number[]) =>
                        handleMaterialChange("roughness", value)
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={locked}
                      sx={styles.slider}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="caption"
                      align="right"
                      sx={{ display: "block" }}
                    >
                      {roughness.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          )}

          <Accordion sx={styles.materialAccordion}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="body2">Emission</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={styles.colorPickerWrapper}>
                <SketchPicker
                  color={emissive}
                  onChange={(color) =>
                    handleMaterialChange("emissive", color.hex)
                  }
                  disableAlpha={true}
                  width="100%"
                />
              </Box>

              <Grid container spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <Grid item xs={5}>
                  <Typography variant="body2" sx={styles.sliderLabel}>
                    Intensity
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Slider
                    value={emissiveIntensity}
                    onChange={(_: any, value: number | number[]) =>
                      handleMaterialChange("emissiveIntensity", value)
                    }
                    min={0}
                    max={2}
                    step={0.01}
                    disabled={locked}
                    sx={styles.slider}
                  />
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    variant="caption"
                    align="right"
                    sx={{ display: "block" }}
                  >
                    {emissiveIntensity.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={transparent}
                    onChange={(e) =>
                      handleMaterialChange("transparent", e.target.checked)
                    }
                    disabled={locked}
                    size="small"
                  />
                }
                label="Transparent"
                sx={styles.switchControl}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={wireframe}
                    onChange={(e) =>
                      handleMaterialChange("wireframe", e.target.checked)
                    }
                    disabled={locked}
                    size="small"
                  />
                }
                label="Wireframe"
                sx={styles.switchControl}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );

  const renderActionButtons = () => (
    <Paper elevation={0} sx={styles.section}>
      <Box sx={styles.sectionHeader} onClick={() => toggleSection("actions")}>
        <Box sx={styles.sectionHeaderLeft}>
          <Build sx={styles.sectionIcon} />
          <Typography variant="subtitle1" sx={styles.sectionTitle}>
            Actions
          </Typography>
        </Box>
        {expandedSections.actions ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={expandedSections.actions}>
        <Box sx={styles.sectionContent}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={styles.actionButtonContainer}>
                <Tooltip title="Undo (Ctrl+Z)" placement="top">
                  <span>
                    <IconButton
                      onClick={() => dispatch(undo())}
                      size="medium"
                      sx={styles.largeActionButton}
                      disabled={historyIndex <= 0}
                    >
                      <Undo />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="caption" sx={styles.buttonLabel}>
                  Undo
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={styles.actionButtonContainer}>
                <Tooltip title="Redo (Ctrl+Y)" placement="top">
                  <span>
                    <IconButton
                      onClick={() => dispatch(redo())}
                      size="medium"
                      sx={styles.largeActionButton}
                      disabled={historyIndex >= historySteps - 1}
                    >
                      <Redo />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="caption" sx={styles.buttonLabel}>
                  Redo
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={styles.actionButtonContainer}>
                <Tooltip title="Save State" placement="top">
                  <IconButton
                    onClick={() => dispatch(saveToHistory())}
                    size="medium"
                    sx={styles.largeActionButton}
                  >
                    <SaveAlt />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={styles.buttonLabel}>
                  Save
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {selectedModelId && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Tooltip title="Copy (Ctrl+C)" placement="top">
                  <Button
                    onClick={() => dispatch(copyModels([selectedModelId]))}
                    disabled={!selectedModelId}
                    sx={styles.secondaryActionButton}
                    startIcon={<ContentCopy />}
                    fullWidth
                    size="small"
                  >
                    Copy
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title="Duplicate" placement="top">
                  <span>
                    <Button
                      onClick={() =>
                        dispatch(duplicateModel({ id: selectedModelId }))
                      }
                      disabled={!selectedModelId || locked}
                      sx={styles.secondaryActionButton}
                      startIcon={<FileCopy />}
                      fullWidth
                      size="small"
                    >
                      Duplicate
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          )}

          {selectedModelId && (
            <Box sx={{ mt: 2 }}>
              <Button
                onClick={() => dispatch(removeModel(selectedModelId))}
                disabled={!selectedModelId || locked}
                sx={styles.dangerButton}
                startIcon={<Delete />}
                fullWidth
                variant="contained"
                color="error"
                size="small"
              >
                Delete Object
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );

  // History panel drawer
  const renderHistoryPanel = () => (
    <Drawer
      anchor="right"
      open={historyPanelOpen}
      onClose={() => setHistoryPanelOpen(false)}
      PaperProps={{
        sx: styles.historyDrawer,
      }}
    >
      <Box sx={styles.historyDrawerHeader}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          History
        </Typography>
        <IconButton
          size="small"
          onClick={() => setHistoryPanelOpen(false)}
          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          <ExpandLess />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary">
          This feature is under construction.
        </Typography>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={styles.editor} className="slide-in-left">
      {/* Header */}
      <Box sx={styles.header}>
        <Box sx={styles.headerLeft}>
          <Typography variant="h6" sx={styles.title}>
            Properties
          </Typography>
          {selectedModelId && (
            <Chip
              label={modelName || "Unnamed Model"}
              size="small"
              sx={styles.selectedChip}
              onDelete={() => dispatch(removeModel(selectedModelId))}
              disabled={locked}
            />
          )}
        </Box>

        {/* Edit Mode Tabs */}
        <Stack direction="row" spacing={1} sx={styles.editModeButtonGroup}>
          <Button
            size="small"
            variant={editMode === "model" ? "contained" : "outlined"}
            onClick={() => dispatch(setEditMode("model"))}
            startIcon={<ViewInAr fontSize="small" />}
            sx={styles.editModeButton}
          >
            Object
          </Button>
          <Button
            size="small"
            variant={editMode === "material" ? "contained" : "outlined"}
            onClick={() => dispatch(setEditMode("material"))}
            startIcon={<Style fontSize="small" />}
            sx={styles.editModeButton}
          >
            Material
          </Button>
          <Button
            size="small"
            variant={
              ["vertex", "edge", "face"].includes(editMode)
                ? "contained"
                : "outlined"
            }
            onClick={() => dispatch(setEditMode("vertex"))}
            startIcon={<Tune fontSize="small" />}
            sx={styles.editModeButton}
          >
            Mesh
          </Button>
        </Stack>
      </Box>

      {selectedModelId ? (
        <Box sx={styles.scrollContainer}>
          {/* Show different sections based on edit mode */}
          {editMode === "model" && (
            <Box sx={styles.sectionContainer}>
              {renderObjectControls()}
              {renderTransformControls()}
            </Box>
          )}

          {editMode === "material" && (
            <Box sx={styles.sectionContainer}>{renderMaterialControls()}</Box>
          )}

          {(editMode === "vertex" ||
            editMode === "edge" ||
            editMode === "face") && (
            <Box sx={styles.sectionContainer}>
              <SubObjectEditor modelId={selectedModelId} />
              <MeshOperationsPanel modelId={selectedModelId} />
            </Box>
          )}

          {editMode === "animation" && (
            <Paper elevation={0} sx={styles.section}>
              <Box sx={styles.sectionHeader}>
                <Box sx={styles.sectionHeaderLeft}>
                  <Animation sx={styles.sectionIcon} />
                  <Typography variant="subtitle1" sx={styles.sectionTitle}>
                    Animation
                  </Typography>
                </Box>
              </Box>
              <Box sx={styles.sectionContent}>
                <Typography variant="body2" sx={styles.comingSoon}>
                  Advanced animation controls and timeline will be available
                  soon.
                </Typography>
              </Box>
            </Paper>
          )}

          {editMode === "hierarchy" && (
            <Paper elevation={0} sx={styles.section}>
              <Box sx={styles.sectionHeader}>
                <Box sx={styles.sectionHeaderLeft}>
                  <Settings sx={styles.sectionIcon} />
                  <Typography variant="subtitle1" sx={styles.sectionTitle}>
                    Scene Hierarchy
                  </Typography>
                </Box>
              </Box>
              <Box sx={styles.sectionContent}>
                <Typography variant="body2" sx={styles.comingSoon}>
                  Hierarchical model organization coming soon.
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Common action buttons at the bottom regardless of mode */}
          {renderActionButtons()}
        </Box>
      ) : (
        <Box sx={styles.emptyState}>
          <Box sx={styles.emptyIcon}>
            <ViewInAr sx={{ fontSize: 70, opacity: 0.3 }} />
          </Box>
          <Typography variant="h6" sx={styles.emptyTitle}>
            No Model Selected
          </Typography>
          <Typography variant="body2" sx={styles.emptyText}>
            Select a model from the sidebar to edit its properties
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} size="small">
            Create New Model
          </Button>
        </Box>
      )}

      {renderHistoryPanel()}
    </Box>
  );
};

const styles = {
  editor: {
    ...glassStyles.panel,
    padding: "16px",
    width: "100%",
    height: "100vh",
    margin: 0,
    borderRadius: 0,
    display: "flex",
    flexDirection: "column" as const,
    position: "relative",
    zIndex: 10,
    boxSizing: "border-box" as const,
    borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
  },
  textField: {
    "& .MuiOutlinedInput-root": {
      color: "white",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.2)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.3)",
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255, 255, 255, 0.7)",
    },
    "& .MuiInputBase-input": {
      color: "white",
    },
  },
  header: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    marginBottom: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontWeight: 700,
    background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "#ffffff",
  },
  selectedChip: {
    background: "rgba(0, 201, 255, 0.15)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(0, 201, 255, 0.3)",
    color: "#ffffff",
    fontWeight: 500,
    fontSize: "0.75rem",
    "& .MuiChip-deleteIcon": {
      color: "rgba(255, 255, 255, 0.7)",
      "&:hover": {
        color: "#ff5252",
      },
    },
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    marginBottom: "12px",
    overflow: "hidden",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      borderColor: "rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    },
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
    },
  },
  sectionHeaderLeft: {
    display: "flex",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "0.3px",
  },
  sectionIcon: {
    fontSize: "18px",
    marginRight: "10px",
    color: "#00c9ff",
  },
  sectionContent: {
    padding: "16px",
  },
  scrollContainer: {
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    flex: 1,
    paddingRight: "4px",
    marginRight: "4px",
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.05)",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(0, 201, 255, 0.3)",
      borderRadius: "4px",
      "&:hover": {
        background: "rgba(0, 201, 255, 0.5)",
      },
    },
  },
  sectionContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  materialPreviewWrapper: {
    position: "relative" as const,
    width: "100%",
    height: "60px",
    marginBottom: "16px",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    backgroundImage:
      'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="8" height="8" fill="%23252525"/><rect x="8" y="8" width="8" height="8" fill="%23252525"/></svg>\')',
    backgroundSize: "16px 16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  materialPreview: {
    width: "100%",
    height: "100%",
    transition: "all 0.3s ease",
  },
  materialPreviewLabel: {
    position: "absolute" as const,
    bottom: "4px",
    right: "8px",
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.7rem",
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
  },
  colorPickerWrapper: {
    width: "100%",
    borderRadius: "4px",
    overflow: "hidden",
    "& .sketch-picker": {
      boxShadow: "none !important",
      width: "100% !important",
      backgroundColor: "rgba(30, 30, 30, 0.8) !important",
      "& label, input": {
        color: "white !important",
      },
    },
  },
  materialAccordion: {
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: "6px",
    "&:before": {
      display: "none",
    },
    "& .MuiAccordionSummary-root": {
      minHeight: "40px",
      padding: "0 12px",
      "& .MuiAccordionSummary-content": {
        margin: "8px 0",
      },
    },
    "& .MuiAccordionDetails-root": {
      padding: "0 12px 12px 12px",
    },
  },
  sliderLabel: {
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: 500,
  },
  controlLabel: {
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: 500,
    marginBottom: "8px",
    marginTop: "8px",
  },
  unitLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    marginRight: "4px",
  },
  actionButtonContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
  },
  largeActionButton: {
    width: "48px",
    height: "48px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    color: "rgba(255, 255, 255, 0.9)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    },
    "&:disabled": {
      opacity: 0.4,
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      color: "rgba(255, 255, 255, 0.3)",
      transform: "none",
      boxShadow: "none",
    },
  },
  secondaryActionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "0.75rem",
    textTransform: "none" as const,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    "&:disabled": {
      opacity: 0.4,
      color: "rgba(255, 255, 255, 0.3)",
    },
  },
  dangerButton: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
    "&:hover": {
      backgroundColor: "rgba(244, 67, 54, 0.25)",
    },
    "&:disabled": {
      backgroundColor: "rgba(244, 67, 54, 0.05)",
    },
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "0.75rem",
    textTransform: "none" as const,
  },
  buttonLabel: {
    display: "block",
    textAlign: "center" as const,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.7rem",
    fontWeight: 500,
  },
  transformButton: {
    textTransform: "none" as const,
    fontSize: "0.75rem",
    padding: "4px 0",
    minWidth: "unset",
  },
  objectInfoCard: {
    padding: "12px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  objectInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
    "&:last-child": {
      marginBottom: 0,
    },
  },
  objectInfoValue: {
    color: "#00c9ff",
    fontWeight: 500,
  },
  stateToggleCard: {
    padding: "8px 12px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    height: "100%",
  },
  stateCaption: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "0.7rem",
    marginTop: "4px",
    display: "block",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "60%",
    textAlign: "center" as const,
    padding: "40px 20px",
  },
  emptyIcon: {
    marginBottom: "20px",
    opacity: 0.6,
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "50%",
    padding: "16px",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginBottom: "12px",
    fontWeight: 600,
    color: "#ffffff",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "0.875rem",
    lineHeight: 1.6,
    maxWidth: "250px",
  },
  historyDrawer: {
    backgroundColor: "rgba(30, 40, 50, 0.95)",
    backdropFilter: "blur(20px)",
    borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
    width: "300px",
  },
  historyDrawerHeader: {
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editModeButtonGroup: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "8px",
    padding: "4px",
    width: "100%",
  },
  editModeButton: {
    flex: 1,
    borderRadius: "6px",
    fontSize: "0.75rem",
    textTransform: "none" as const,
    padding: "6px 0",
    minWidth: "unset",
    "&.MuiButton-contained": {
      background:
        "linear-gradient(135deg, rgba(0, 201, 255, 0.7) 0%, rgba(146, 254, 157, 0.7) 100%)",
      color: "rgba(0, 0, 0, 0.9)",
      fontWeight: 600,
    },
  },
  switchControl: {
    margin: 0,
    "& .MuiFormControlLabel-label": {
      fontSize: "0.8rem",
      color: "rgba(255, 255, 255, 0.9)",
    },
    "& .MuiSwitch-root": {
      marginRight: "8px",
    },
  },
  comingSoon: {
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    padding: "20px 0",
    fontStyle: "italic",
  },
  formControl: {
    marginBottom: "16px",
    "& .MuiInputLabel-root": {
      color: "rgba(255, 255, 255, 0.7)",
    },
    "& .MuiOutlinedInput-root": {
      color: "white",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.2)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255, 255, 255, 0.3)",
      },
    },
  },
  slider: {
    color: "#00c9ff",
    "& .MuiSlider-thumb": {
      width: 14,
      height: 14,
      "&:hover, &.Mui-active": {
        boxShadow: "0 0 0 8px rgba(0, 201, 255, 0.2)",
      },
    },
    "& .MuiSlider-rail": {
      opacity: 0.3,
    },
  },
};

export default ModelEditor;

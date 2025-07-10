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
} from "../../store/slices/modelSlice";
import { setEditMode } from "../../store/slices/uiSlice";
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
  Button,
  IconButton,
  Slider,
  Divider,
  Tooltip,
  ButtonGroup,
  Chip,
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
    <Card sx={styles.card}>
      <CardContent sx={styles.cardContent}>
        <Typography variant="h6" sx={styles.subTitle}>
          {activeTool &&
            `${
              activeTool.charAt(0).toUpperCase() + activeTool.slice(1)
            } Controls`}
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
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderMaterialControls = () => (
    <Card sx={styles.card}>
      <CardContent sx={styles.cardContent}>
        <Typography variant="h6" sx={styles.subTitle}>
          Material Properties
        </Typography>

        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel>Material Type</InputLabel>
          <Select
            value={materialType}
            onChange={(e) => handleMaterialChange("type", e.target.value)}
            label="Material Type"
            disabled={locked}
          >
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="phong">Phong</MenuItem>
            <MenuItem value="lambert">Lambert</MenuItem>
            <MenuItem value="basic">Basic</MenuItem>
            <MenuItem value="physical">Physical</MenuItem>
            <MenuItem value="toon">Toon</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          Base Color
        </Typography>
        <Box sx={{ marginBottom: 2 }}>
          <SketchPicker
            color={color}
            onChange={(color) => handleMaterialChange("color", color.hex)}
            disableAlpha={false}
          />
        </Box>

        <Typography variant="body2" gutterBottom>
          Opacity: {opacity.toFixed(2)}
        </Typography>
        <Slider
          value={opacity}
          onChange={(_: any, value: number | number[]) =>
            handleMaterialChange("opacity", value)
          }
          min={0}
          max={1}
          step={0.01}
          disabled={locked}
          sx={{ marginBottom: 2 }}
        />

        {(materialType === "standard" || materialType === "physical") && (
          <>
            <Typography variant="body2" gutterBottom>
              Metalness: {metalness.toFixed(2)}
            </Typography>
            <Slider
              value={metalness}
              onChange={(_: any, value: number | number[]) =>
                handleMaterialChange("metalness", value)
              }
              min={0}
              max={1}
              step={0.01}
              disabled={locked}
              sx={{ marginBottom: 2 }}
            />

            <Typography variant="body2" gutterBottom>
              Roughness: {roughness.toFixed(2)}
            </Typography>
            <Slider
              value={roughness}
              onChange={(_: any, value: number | number[]) =>
                handleMaterialChange("roughness", value)
              }
              min={0}
              max={1}
              step={0.01}
              disabled={locked}
              sx={{ marginBottom: 2 }}
            />
          </>
        )}

        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          Emissive Color
        </Typography>
        <Box sx={{ marginBottom: 2 }}>
          <SketchPicker
            color={emissive}
            onChange={(color) => handleMaterialChange("emissive", color.hex)}
            disableAlpha={true}
          />
        </Box>

        <Typography variant="body2" gutterBottom>
          Emissive Intensity: {emissiveIntensity.toFixed(2)}
        </Typography>
        <Slider
          value={emissiveIntensity}
          onChange={(_: any, value: number | number[]) =>
            handleMaterialChange("emissiveIntensity", value)
          }
          min={0}
          max={2}
          step={0.01}
          disabled={locked}
          sx={{ marginBottom: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={transparent}
              onChange={(e) =>
                handleMaterialChange("transparent", e.target.checked)
              }
              disabled={locked}
            />
          }
          label="Transparent"
          sx={{ marginBottom: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={wireframe}
              onChange={(e) =>
                handleMaterialChange("wireframe", e.target.checked)
              }
              disabled={locked}
            />
          }
          label="Wireframe"
        />
      </CardContent>
    </Card>
  );

  const renderObjectControls = () => (
    <Card sx={styles.card}>
      <CardContent sx={styles.cardContent}>
        <Typography variant="h6" sx={styles.subTitle}>
          Object Properties
        </Typography>

        <TextField
          label="Name"
          value={modelName}
          onChange={(e) => handleMetadataChange("name", e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ marginBottom: 2 }}
          disabled={locked}
        />

        <Grid container spacing={1} sx={{ marginBottom: 2 }}>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={visible}
                  onChange={(e) =>
                    handleMetadataChange("visible", e.target.checked)
                  }
                  icon={<VisibilityOff />}
                  checkedIcon={<Visibility />}
                />
              }
              label="Visible"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={locked}
                  onChange={(e) =>
                    handleMetadataChange("locked", e.target.checked)
                  }
                  icon={<LockOpen />}
                  checkedIcon={<Lock />}
                />
              }
              label="Locked"
            />
          </Grid>
        </Grid>

        {selectedModel && (
          <Box>
            <Typography variant="body2" color="textSecondary">
              Type: {selectedModel.type}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created: {new Date(selectedModel.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Modified: {new Date(selectedModel.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderActionButtons = () => (
    <Card sx={styles.card}>
      <CardContent sx={styles.cardContent}>
        <Typography variant="h6" sx={styles.subTitle}>
          Actions
        </Typography>

        <Grid container spacing={1} sx={{ marginBottom: 2 }}>
          <Grid item xs={6}>
            <Tooltip title="Undo (Ctrl+Z)">
              <IconButton
                onClick={() => dispatch(undo())}
                size="small"
                sx={styles.actionButton}
              >
                <Undo />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={6}>
            <Tooltip title="Redo (Ctrl+Y)">
              <IconButton
                onClick={() => dispatch(redo())}
                size="small"
                sx={styles.actionButton}
              >
                <Redo />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>

        {selectedModelId && (
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Tooltip title="Copy (Ctrl+C)">
                <IconButton
                  onClick={() => dispatch(copyModels([selectedModelId]))}
                  size="small"
                  sx={styles.actionButton}
                >
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Paste (Ctrl+V)">
                <IconButton
                  onClick={() => dispatch(pasteModels([0, 0, 0]))}
                  size="small"
                  sx={styles.actionButton}
                >
                  <ContentPaste />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Duplicate">
                <span>
                  <IconButton
                    onClick={() =>
                      dispatch(duplicateModel({ id: selectedModelId }))
                    }
                    size="small"
                    sx={styles.actionButton}
                    disabled={locked}
                  >
                    <FileCopy />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    onClick={() => dispatch(removeModel(selectedModelId))}
                    size="small"
                    sx={{ ...styles.actionButton, color: "error.main" }}
                    disabled={locked}
                  >
                    <Delete />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  const renderTextureControls = () => (
    <TextureManager
      selectedModelId={selectedModelId}
      currentMaterial={selectedModel?.material || { type: "standard" }}
    />
  );

  return (
    <Box sx={styles.editor} className="slide-in-left">
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h5" sx={styles.title}>
          Properties
        </Typography>
        {selectedModelId && (
          <Chip
            label={`Model Selected`}
            size="small"
            sx={styles.selectedChip}
          />
        )}
      </Box>

      {renderActionButtons()}

      {selectedModelId ? (
        <Box sx={styles.scrollContainer}>
          <Tabs
            value={editMode}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={styles.tabs}
          >
            <Tab label="Transform" value="model" sx={styles.tab} />
            <Tab label="Material" value="material" sx={styles.tab} />
            <Tab label="Vertex" value="vertex" sx={styles.tab} />
            <Tab label="Edge" value="edge" sx={styles.tab} />
            <Tab label="Face" value="face" sx={styles.tab} />
            <Tab label="Animation" value="animation" sx={styles.tab} />
            <Tab label="Hierarchy" value="hierarchy" sx={styles.tab} />
          </Tabs>

          <Box sx={styles.tabContent}>
            {editMode === "model" && (
              <Box sx={styles.sectionContainer}>
                {renderObjectControls()}
                {renderTransformControls()}
              </Box>
            )}

            {editMode === "material" && (
              <Box sx={styles.sectionContainer}>
                {renderMaterialControls()}
                {renderTextureControls()}
              </Box>
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
              <Card sx={styles.card}>
                <CardContent sx={styles.cardContent}>
                  <Typography variant="h6" sx={styles.subTitle}>
                    Animation Timeline
                  </Typography>
                  <Typography variant="body2" sx={styles.comingSoon}>
                    Advanced animation controls and timeline will be available
                    soon.
                  </Typography>
                </CardContent>
              </Card>
            )}

            {editMode === "hierarchy" && (
              <Card sx={styles.card}>
                <CardContent sx={styles.cardContent}>
                  <Typography variant="h6" sx={styles.subTitle}>
                    Scene Hierarchy
                  </Typography>
                  <Typography variant="body2" sx={styles.comingSoon}>
                    Hierarchical model organization coming soon.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={styles.emptyState}>
          <Box sx={styles.emptyIcon}>
            <Typography variant="h1" sx={{ opacity: 0.3, fontSize: "4rem" }}>
              🎯
            </Typography>
          </Box>
          <Typography variant="h6" sx={styles.emptyTitle}>
            No Model Selected
          </Typography>
          <Typography variant="body2" sx={styles.emptyText}>
            Select a model from the sidebar to start editing its properties
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const styles = {
  editor: {
    ...glassStyles.panel,
    padding: "24px",
    width: "380px",
    height: "100vh",
    margin: "16px 16px 16px 8px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column" as const,
    position: "relative",
    zIndex: 10,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
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
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.75rem",
  },
  subTitle: {
    marginBottom: "16px",
    fontWeight: 600,
    color: "#ffffff",
    fontSize: "1.125rem",
  },
  scrollContainer: {
    overflowY: "auto" as const,
    flex: 1,
    paddingRight: "12px",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.3)",
      borderRadius: "3px",
    },
  },
  tabs: {
    marginBottom: "24px",
    "& .MuiTabs-indicator": {
      background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
      height: "3px",
      borderRadius: "3px",
    },
    "& .MuiTabs-scrollButtons": {
      color: "#ffffff",
    },
  },
  tab: {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    minHeight: "48px",
    color: "rgba(255, 255, 255, 0.8)",
    "&.Mui-selected": {
      color: "#ffffff",
    },
  },
  tabContent: {
    animation: "fadeIn 0.3s ease-in-out",
  },
  sectionContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  card: {
    ...glassStyles.darkPanel,
    marginBottom: "20px",
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
    },
  },
  cardContent: {
    padding: "20px !important",
    "&:last-child": {
      paddingBottom: "20px !important",
    },
  },
  textField: {
    marginTop: "8px",
    "& .MuiOutlinedInput-root": {
      ...glassStyles.button,
      "& input": {
        color: "#ffffff",
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255, 255, 255, 0.8)",
    },
  },
  actionButton: {
    ...glassStyles.button,
    width: "100%",
    height: "48px",
    margin: "4px 0",
    color: "#ffffff",
    fontWeight: 600,
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      ...glassStyles.gradientButton["&:hover"],
    },
  },
  actionButtonGroup: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
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
  comingSoon: {
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: "italic",
    textAlign: "center" as const,
    padding: "20px",
  },
};

export default ModelEditor;

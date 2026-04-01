import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateModelMetadata,
  undo,
  redo,
  copyModels,
  removeModel,
  duplicateModel,
  saveToHistory,
} from "../../store/slices/modelSlice";
import { setEditMode } from "../../store/slices/uiSlice";
import {
  TextField,
  Typography,
  Grid,
  Box,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Collapse,
  Paper,
  Drawer,
  Divider,
} from "@mui/material";
import {
  Undo,
  Redo,
  ContentCopy,
  Delete,
  FileCopy,
  ExpandMore,
  ExpandLess,
  Style,
  Settings,
  Tune,
  Build,
  ViewInAr,
  SaveAlt,
  Category as CategoryIcon,
  Animation,
} from "@mui/icons-material";
import { MaterialProperties, Vector3Tuple } from "../../types";
import MeshEditPanel from "./MeshEditPanel";
import { glassStyles } from "../../config/theme";
import { EditModes } from "../../Enums";

const ModelEditor: React.FC = () => {
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const models = useSelector((state: any) => state.models.models);
  const editMode = useSelector((state: any) => state.ui.editMode);
  const dispatch = useDispatch();

  const [, setPosition] = useState<Vector3Tuple>([0, 0, 0]);
  const [, setRotation] = useState<Vector3Tuple>([0, 0, 0]);
  const [, setScale] = useState<Vector3Tuple>([1, 1, 1]);
  const [, setMaterialType] =
    useState<MaterialProperties["type"]>("standard");
  const [, setColor] = useState<string>("#00ff00");
  const [, setOpacity] = useState<number>(1);
  const [, setMetalness] = useState<number>(0);
  const [, setRoughness] = useState<number>(0.5);
  const [, setEmissive] = useState<string>("#000000");
  const [, setEmissiveIntensity] = useState<number>(0);
  const [, setTransparent] = useState<boolean>(false);
  const [, setWireframe] = useState<boolean>(false);
  const [, setVisible] = useState<boolean>(true);
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
        <Box sx={styles.editModeButtonContainer}>
          <Tooltip title="Object Mode" placement="top">
            <Button
              size="small"
              variant={editMode === EditModes.model ? "contained" : "outlined"}
              onClick={() => dispatch(setEditMode(EditModes.model))}
              sx={styles.editModeButton}
            >
              <ViewInAr sx={{ fontSize: "20px" }} />
            </Button>
          </Tooltip>

          <Tooltip title="Material Mode" placement="top">
            <Button
              size="small"
              variant={
                editMode === EditModes.material ? "contained" : "outlined"
              }
              onClick={() => dispatch(setEditMode(EditModes.material))}
              sx={styles.editModeButton}
            >
              <Style sx={{ fontSize: "20px" }} />
            </Button>
          </Tooltip>

          <Tooltip title="Mesh Mode" placement="top">
            <Button
              size="small"
              onClick={() => dispatch(setEditMode(EditModes.vertex))}
              variant={editMode === EditModes.vertex ? "contained" : "outlined"}
              sx={styles.editModeButton}
            >
              <Tune sx={{ fontSize: "20px" }} />
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {selectedModelId ? (
        <Box sx={styles.scrollContainer}>
          {/* Show different sections based on edit mode */}
          {editMode === EditModes.model && (
            <Box sx={styles.sectionContainer}>{renderObjectControls()}</Box>
          )}

          {/* Mesh Editing Mode - now using MeshEditPanel for all mesh modes */}
          {(editMode === EditModes.vertex ||
            editMode === EditModes.edge ||
            editMode === EditModes.face) && (
            <Box sx={styles.sectionContainer}>
              <MeshEditPanel modelId={selectedModelId} />
            </Box>
          )}

          {editMode === EditModes.animation && (
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

          {editMode === EditModes.hierarchy && (
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
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: "#ffffff",
  },
  selectedChip: {
    background: "rgba(102, 126, 234, 0.15)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    color: "#ffffff",
    fontWeight: 500,
    fontSize: "0.75rem",
    "& .MuiChip-deleteIcon": {
      color: "rgba(255, 255, 255, 0.7)",
      "&:hover": {
        color: "#fa709a",
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
    color: "#667eea",
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
      background: "rgba(102, 126, 234, 0.4)",
      borderRadius: "4px",
      "&:hover": {
        background: "rgba(102, 126, 234, 0.6)",
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
    color: "#667eea",
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
  editModeButtonContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "6px",
    backgroundColor: "rgba(17, 21, 34, 0.8)",
    padding: "5px",
    borderRadius: "8px",
    width: "100%",
    border: "1px solid rgba(72, 84, 139, 0.3)",
  },
  editModeButton: {
    borderRadius: "6px",
    padding: "8px",
    minWidth: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",
    "&.MuiButton-contained": {
      background: "rgba(79, 105, 198, 0.8)",
      color: "#ffffff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
      "&:hover": {
        background: "rgba(79, 105, 198, 0.9)",
      },
    },
    "&.MuiButton-outlined": {
      borderColor: "rgba(255, 255, 255, 0.15)",
      color: "rgba(255, 255, 255, 0.8)",
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      "&:hover": {
        borderColor: "rgba(255, 255, 255, 0.3)",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
      },
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
    color: "#667eea",
    "& .MuiSlider-thumb": {
      width: 14,
      height: 14,
      "&:hover, &.Mui-active": {
        boxShadow: "0 0 0 8px rgba(102, 126, 234, 0.2)",
      },
    },
    "& .MuiSlider-rail": {
      opacity: 0.3,
    },
  },
  meshModeButton: {
    fontSize: "0.75rem",
    textTransform: "none" as const,
    padding: "6px 0",
    fontWeight: 500,
    "&.MuiButton-contained": {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
    },
  },
};

export default ModelEditor;

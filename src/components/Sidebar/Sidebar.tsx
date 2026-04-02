import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectModel,
  updateModelMetadata,
} from "../../store/slices/modelSlice";
import { setGrid, setWireframe } from "../../store/slices/uiSlice";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Divider,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Tooltip,
  Chip,
  Avatar,
  Stack,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility,
  VisibilityOff,
  GridOn,
  GridOff,
  Palette,
  Category,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
} from "@mui/icons-material";
import CreateModelModal from "./CreateModelModal";
import FileManager from "../FileManager/FileManager";
import { ProjectDialog } from "../ProjectManager";
import { UndoRedoPanel } from "../UndoRedo";
import { useCommandManager } from "../../hooks/useCommandManager";
import { RemoveModelCommand } from "../../utils/commands";
import { glassStyles } from "../../config/theme";
import { RootState } from "../../store";
import { ModelMetadata } from "../../types";
import * as THREE from "three";

const Sidebar: React.FC = () => {
  const models = useSelector((state: RootState) => state.models.models);
  const selectedModelId = useSelector(
    (state: RootState) => state.models.selectedModelId
  );
  const showGrid = useSelector((state: RootState) => state.ui.showGrid);
  const showWireframe = useSelector(
    (state: RootState) => state.ui.showWireframe
  );
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [fileManagerMode, setFileManagerMode] = useState<"import" | "export">(
    "import"
  );
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<"save" | "load">(
    "save"
  );

  const { executeCommand } = useCommandManager();

  // Get current selected model's geometry for export
  const selectedModel = models.find((model) => model.id === selectedModelId);
  const currentGeometry = selectedModel?.userData?.geometry as
    | THREE.BufferGeometry
    | undefined;

  const handleModelSelect = (id: string) => {
    dispatch(selectModel(id));
  };

  const toggleVisibility = (id: string, visible: boolean) => {
    dispatch(updateModelMetadata({ id, visible: !visible }));
  };

  const handleDeleteModel = (model: ModelMetadata) => {
    const command = new RemoveModelCommand(model);
    executeCommand(command);
  };

  const handleImportClick = () => {
    setFileManagerMode("import");
    setFileManagerOpen(true);
  };

  const handleExportClick = () => {
    if (!selectedModelId) {
      // Could show a toast notification here
      console.warn("No model selected for export");
      return;
    }
    setFileManagerMode("export");
    setFileManagerOpen(true);
  };

  const handleSaveProjectClick = () => {
    setProjectDialogMode("save");
    setProjectDialogOpen(true);
  };

  const handleLoadProjectClick = () => {
    setProjectDialogMode("load");
    setProjectDialogOpen(true);
  };

  return (
    <Box sx={styles.sidebar} className="slide-in-left" role="complementary" aria-label="Sidebar">
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h5" sx={styles.headerTitle}>
          SaifEngine
        </Typography>
        <Chip label="v1.0" size="small" sx={styles.versionChip} />
      </Box>

      <Divider sx={styles.divider} />

      {/* Quick Actions */}
      <Box sx={styles.section}>
        <Typography variant="subtitle1" sx={styles.sectionTitle}>
          Quick Actions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={styles.createButton}
          className="hover-lift"
          fullWidth
        >
          Create Model
        </Button>

        {/* File Operations */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportClick}
            sx={{ flex: 1 }}
            className="hover-lift"
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            disabled={!selectedModelId}
            sx={{ flex: 1 }}
            className="hover-lift"
          >
            Export
          </Button>
        </Stack>

        {/* Project Operations */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveProjectClick}
            sx={{ flex: 1 }}
            className="hover-lift"
            color="secondary"
          >
            Save Project
          </Button>
          <Button
            variant="outlined"
            startIcon={<LoadIcon />}
            onClick={handleLoadProjectClick}
            sx={{ flex: 1 }}
            className="hover-lift"
            color="secondary"
          >
            Load Project
          </Button>
        </Stack>
      </Box>

      {/* Models List */}
      <Box sx={styles.section}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={styles.sectionTitle}>
            Models
          </Typography>
          <Badge
            badgeContent={models.length}
            color="primary"
            sx={styles.modelsBadge}
          >
            <Category sx={{ fontSize: 20 }} />
          </Badge>
        </Stack>

        <Box sx={styles.modelList} role="list" aria-label="Models list">
          {models.length === 0 ? (
            <Box sx={styles.emptyState}>
              <Category
                style={{ opacity: 0.5, marginBottom: 8, fontSize: 32 }}
              />
              <Typography variant="body2" sx={styles.emptyText}>
                No models yet
              </Typography>
              <Typography variant="caption" sx={{ ...styles.emptyText, mt: 0.5 }}>
                Click "Create Model" to get started
              </Typography>
            </Box>
          ) : (
            <List sx={{ padding: 0 }}>
              {models.map((model: ModelMetadata, index: number) => (
                <ListItem
                  key={model.id}
                  disablePadding
                  sx={{
                    ...styles.modelItem,
                    ...(model.id === selectedModelId
                      ? styles.selectedModelItem
                      : {}),
                  }}
                  className="fade-in hover-lift"
                >
                  <ListItemButton
                    onClick={() => handleModelSelect(model.id)}
                    sx={styles.modelItemButton}
                    aria-current={model.id === selectedModelId ? "true" : undefined}
                    aria-label={`Select model ${model.name || `Model ${index + 1}`}`}
                  >
                    <Avatar
                      sx={{
                        ...styles.modelAvatar,
                        bgcolor: model.material?.color || "#485563",
                      }}
                    >
                      <Category fontSize="small" />
                    </Avatar>
                    <ListItemText
                      primary={model.name || `Model ${index + 1}`}
                      secondary={model.type || "Standard"}
                      sx={styles.modelItemText}
                    />
                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Tooltip title={model.visible ? "Hide model" : "Show model"}>
                        <IconButton
                          size="small"
                          sx={styles.miniButton}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            toggleVisibility(model.id, model.visible);
                          }}
                          aria-label={model.visible ? `Hide ${model.name}` : `Show ${model.name}`}
                        >
                          {model.visible ? (
                            <Visibility sx={{ fontSize: 16 }} />
                          ) : (
                            <VisibilityOff sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete model">
                        <IconButton
                          size="small"
                          sx={styles.deleteButton}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteModel(model);
                          }}
                          aria-label={`Delete ${model.name}`}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* History */}
      <Box sx={styles.section}>
        <UndoRedoPanel compact={false} showHistory={true} />
      </Box>

      {/* Settings */}
      <Box sx={styles.section}>
        <Typography variant="subtitle1" sx={styles.sectionTitle}>
          Viewport Settings
        </Typography>
        <FormGroup sx={styles.settingsGroup}>
          <FormControlLabel
            control={
              <Switch
                checked={showGrid}
                onChange={(e) => dispatch(setGrid(e.target.checked))}
                size="small"
                icon={<GridOff fontSize="small" />}
                checkedIcon={<GridOn fontSize="small" />}
              />
            }
            label="Show Grid"
            sx={styles.switchControl}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showWireframe}
                onChange={(e) => dispatch(setWireframe(e.target.checked))}
                size="small"
                icon={<Palette fontSize="small" />}
                checkedIcon={<Palette fontSize="small" />}
              />
            }
            label="Wireframe"
            sx={styles.switchControl}
          />
        </FormGroup>
      </Box>

      <CreateModelModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* File Manager Dialog */}
      <FileManager
        open={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        mode={fileManagerMode}
        currentGeometry={currentGeometry}
        currentModelId={selectedModelId || undefined}
      />

      {/* Project Manager Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        mode={projectDialogMode}
      />
    </Box>
  );
};

const styles = {
  sidebar: {
    width: "100%",
    height: "100vh",
    ...glassStyles.panel,
    display: "flex",
    flexDirection: "column" as "column",
    padding: "16px",
    margin: 0,
    borderRadius: 0,
    position: "relative",
    overflow: "auto",
    zIndex: 10,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  headerTitle: {
    fontWeight: 700,
    background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  versionChip: {
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "rgba(0, 0, 0, 0.8)",
    fontWeight: 600,
    fontSize: "0.75rem",
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: "16px",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    marginBottom: "10px",
    fontWeight: 600,
    color: "#ffffff",
    fontSize: "0.875rem",
    letterSpacing: "0.3px",
  },
  createButton: {
    ...glassStyles.gradientButton,
    height: "44px",
    fontWeight: 600,
    fontSize: "0.875rem",
    textTransform: "none",
    borderRadius: "8px",
    "&:hover": {
      ...glassStyles.gradientButton["&:hover"],
    },
  },
  modelList: {
    maxHeight: "320px",
    overflowY: "auto" as "auto",
    paddingRight: "4px",
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "2px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.3)",
      borderRadius: "2px",
    },
  },
  modelsBadge: {
    "& .MuiBadge-badge": {
      backgroundColor: "#43e97b",
      color: "rgba(0, 0, 0, 0.8)",
      fontWeight: 600,
    },
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    textAlign: "center" as "center",
    color: "rgba(255, 255, 255, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "8px",
    border: "1px dashed rgba(255, 255, 255, 0.15)",
  },
  emptyText: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.6)",
  },
  modelItem: {
    marginBottom: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.06)",
    },
  },
  selectedModelItem: {
    background:
      "linear-gradient(135deg, rgba(0, 201, 255, 0.2) 0%, rgba(146, 254, 157, 0.2) 100%)",
    borderColor: "rgba(0, 201, 255, 0.4)",
    boxShadow: "0 4px 12px rgba(0, 201, 255, 0.15)",
    "&:hover": {
      background:
        "linear-gradient(135deg, rgba(0, 201, 255, 0.25) 0%, rgba(146, 254, 157, 0.25) 100%)",
    },
  },
  modelItemButton: {
    padding: "10px 12px",
    borderRadius: "6px",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  modelAvatar: {
    width: 32,
    height: 32,
    marginRight: "12px",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
  },
  modelItemText: {
    overflow: "hidden",
    "& .MuiListItemText-primary": {
      color: "#ffffff",
      fontWeight: 600,
      fontSize: "0.875rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .MuiListItemText-secondary": {
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: "0.75rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
  miniButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    minWidth: "28px",
    minHeight: "28px",
    width: "28px",
    height: "28px",
    color: "rgba(255, 255, 255, 0.8)",
    borderRadius: "6px",
    padding: 0,
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  deleteButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    minWidth: "28px",
    minHeight: "28px",
    width: "28px",
    height: "28px",
    color: "rgba(255, 255, 255, 0.6)",
    borderRadius: "6px",
    padding: 0,
    "&:hover": {
      backgroundColor: "rgba(255, 80, 80, 0.2)",
      borderColor: "rgba(255, 80, 80, 0.4)",
      color: "#ff5050",
    },
  },
  settingsGroup: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "8px",
    padding: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  switchControl: {
    margin: "4px 0",
    "& .MuiFormControlLabel-label": {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    "& .MuiSwitch-thumb": {
      backgroundColor: "#ffffff",
    },
    "& .MuiSwitch-track": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    "& .Mui-checked .MuiSwitch-thumb": {
      background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    },
    "& .Mui-checked + .MuiSwitch-track": {
      backgroundColor: "rgba(0, 201, 255, 0.3)",
    },
  },
};

export default Sidebar;

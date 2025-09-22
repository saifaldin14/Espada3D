import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  InsertDriveFile as FileIcon,
  AccountBox as PersonIcon,
  DateRange as DateIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  ProjectManager,
  ProjectSaveOptions,
  ProjectLoadResult,
  deserializeGeometry,
} from "../../utils/projectManager";
import { setModels, clearModels } from "../../store/slices/modelSlice";
import { createGeometry } from "../../utils/geometryFactory";
import * as THREE from "three";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "save" | "load";
}

const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  onClose,
  mode,
}) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redux state
  const models = useSelector((state: RootState) => state.models.models);

  // Component state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectPreview, setProjectPreview] = useState<any>(null);
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);

  // Save options
  const [projectName, setProjectName] = useState("Untitled Project");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectAuthor, setProjectAuthor] = useState("");
  const [saveOptions, setSaveOptions] = useState<ProjectSaveOptions>({
    includeGeometry: true,
    includeCamera: true,
    includeLighting: true,
    includeEnvironment: true,
  });

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setSelectedFile(null);
    setProjectPreview(null);
    setLoadWarnings([]);
    setLoading(false);
    onClose();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setProjectPreview(null);

    // Validate file
    const validation = ProjectManager.validateProjectFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);

    // Get project preview
    try {
      const preview = await ProjectManager.getProjectPreview(file);
      setProjectPreview(preview);
    } catch (error) {
      console.warn("Could not load project preview:", error);
    }
  };

  const collectGeometryData = (): {
    [modelId: string]: THREE.BufferGeometry;
  } => {
    const geometryData: { [modelId: string]: THREE.BufferGeometry } = {};

    models.forEach((model) => {
      let geometry: THREE.BufferGeometry | null = null;

      if (model.type === "imported" && model.userData?.geometry) {
        // Use stored geometry for imported models
        geometry = model.userData.geometry;
      } else {
        // Create geometry for primitive models
        geometry = createGeometry(model.type);
      }

      if (geometry) {
        geometryData[model.id] = geometry;
      }
    });

    return geometryData;
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError("Please enter a project name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const geometryData = collectGeometryData();

      // Mock scene state - in a real app, this would come from your 3D scene
      const sceneState = {
        camera: { position: [0, 5, 10], target: [0, 0, 0], zoom: 1 },
        lighting: {
          ambientIntensity: 0.5,
          directionalLight: {
            position: [-10, 10, 5],
            intensity: 0.6,
            castShadow: true,
          },
          pointLight: {
            position: [10, 10, 10],
            intensity: 1.0,
            castShadow: true,
          },
        },
        environment: {
          showGrid: false,
          showWireframe: false,
          backgroundColor: "#1e1e1e",
        },
      };

      const projectJson = await ProjectManager.saveProject(
        models,
        geometryData,
        sceneState,
        {
          name: projectName,
          description: projectDescription || undefined,
          author: projectAuthor || undefined,
        },
        saveOptions
      );

      ProjectManager.downloadProject(projectJson, projectName);

      setSuccess(`Project "${projectName}" saved successfully!`);

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Save error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save project"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedFile) {
      setError("Please select a project file to load");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadWarnings([]);

    try {
      const result: ProjectLoadResult =
        await ProjectManager.loadProjectFromFile(selectedFile);

      if (!result.success) {
        setError(result.error || "Failed to load project");
        return;
      }

      const projectData = result.data!;
      setLoadWarnings(result.warnings || []);

      // Clear existing models
      dispatch(clearModels());

      // Restore models with geometry
      const modelsWithGeometry = projectData.scene.models.map((model) => {
        let restoredModel = { ...model };

        // Restore geometry if available
        if (projectData.geometryData[model.id]) {
          const geometry = deserializeGeometry(
            projectData.geometryData[model.id]
          );
          restoredModel.userData = {
            ...restoredModel.userData,
            geometry: geometry,
          };
        }

        return restoredModel;
      });

      // Load models into Redux store
      dispatch(setModels(modelsWithGeometry));

      // TODO: Restore camera, lighting, and environment settings
      // This would typically involve updating your 3D scene state

      setSuccess(`Project "${projectData.name}" loaded successfully!`);

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Load error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load project"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {mode === "save" ? <SaveIcon /> : <LoadIcon />}
          {mode === "save" ? "Save Project" : "Load Project"}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {mode === "save" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Save your current scene with all models, materials, and hierarchy
              to a project file.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                label="Description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Author"
                value={projectAuthor}
                onChange={(e) => setProjectAuthor(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Export Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={saveOptions.includeGeometry || false}
                        onChange={(e) =>
                          setSaveOptions((prev) => ({
                            ...prev,
                            includeGeometry: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Include Mesh Geometry"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={saveOptions.includeCamera || false}
                        onChange={(e) =>
                          setSaveOptions((prev) => ({
                            ...prev,
                            includeCamera: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Include Camera Settings"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={saveOptions.includeLighting || false}
                        onChange={(e) =>
                          setSaveOptions((prev) => ({
                            ...prev,
                            includeLighting: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Include Lighting Setup"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={saveOptions.includeEnvironment || false}
                        onChange={(e) =>
                          setSaveOptions((prev) => ({
                            ...prev,
                            includeEnvironment: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Include Environment Settings"
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 2, p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Current Scene:</strong> {models.length} model(s)
              </Typography>
            </Box>
          </Box>
        )}

        {mode === "load" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a project file to load. This will replace your current
              scene.
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept=".esp"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            <Box
              sx={{
                border: "2px dashed",
                borderColor: selectedFile ? "primary.main" : "grey.300",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                },
                mb: 2,
              }}
              onClick={handleBrowseClick}
            >
              {selectedFile ? (
                <Box>
                  <FileIcon
                    sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                  />
                  <Typography variant="body1" fontWeight="medium">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <LoadIcon sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                  <Typography variant="body1">
                    Click to browse for a project file
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supports .esp (SaifEngine Project) files
                  </Typography>
                </Box>
              )}
            </Box>

            {projectPreview && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Preview
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Name"
                        secondary={projectPreview.name || "Untitled"}
                      />
                    </ListItem>
                    {projectPreview.description && (
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Description"
                          secondary={projectPreview.description}
                        />
                      </ListItem>
                    )}
                    {projectPreview.author && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Author"
                          secondary={projectPreview.author}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemIcon>
                        <CategoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Models"
                        secondary={`${projectPreview.modelCount || 0} model(s)`}
                      />
                    </ListItem>
                    {projectPreview.createdAt && (
                      <ListItem>
                        <ListItemIcon>
                          <DateIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Created"
                          secondary={new Date(
                            projectPreview.createdAt
                          ).toLocaleDateString()}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            )}

            {loadWarnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="medium">
                  Loading Warnings:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  {loadWarnings.map((warning, index) => (
                    <li key={index}>
                      <Typography variant="body2">{warning}</Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}

            {models.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> Loading this project will replace
                  your current scene with {models.length} model(s). Consider
                  saving your current work first.
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={mode === "save" ? handleSave : handleLoad}
          disabled={
            loading ||
            (mode === "save" && !projectName.trim()) ||
            (mode === "load" && !selectedFile)
          }
          startIcon={
            loading ? (
              <CircularProgress size={20} />
            ) : mode === "save" ? (
              <SaveIcon />
            ) : (
              <LoadIcon />
            )
          }
        >
          {loading
            ? "Processing..."
            : mode === "save"
              ? "Save Project"
              : "Load Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDialog;

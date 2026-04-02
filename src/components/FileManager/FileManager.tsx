import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Typography,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { addNotification } from "../../store/slices/notificationSlice";
import {
  OBJLoader,
  OBJExporter,
  validateOBJFile,
  OBJExportOptions,
} from "../../utils/objLoader";
import { downloadModelGLTF, GLTFExportOptions } from "../../utils/gltfExporter";
import { addModel } from "../../store/slices/modelSlice";
import { createGeometry } from "../../utils/geometryFactory";
import * as THREE from "three";

type ExportFormat = "obj" | "gltf" | "glb";

interface FileManagerProps {
  open: boolean;
  onClose: () => void;
  mode: "import" | "export";
  currentGeometry?: THREE.BufferGeometry;
  currentModelId?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  open,
  onClose,
  mode,
  currentGeometry,
  currentModelId,
}) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the selected model from the store
  const models = useSelector((state: RootState) => state.models.models);
  const selectedModel = currentModelId
    ? models.find((model) => model.id === currentModelId)
    : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Export options
  const [exportFilename, setExportFilename] = useState("model");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("glb");
  const [exportOptions, setExportOptions] = useState<OBJExportOptions>({
    includeNormals: true,
    includeUVs: true,
    flipYUV: true,
  });

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setSelectedFile(null);
    setLoading(false);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Validate file
    const validation = validateOBJFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Please select a file to import");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await OBJLoader.loadFromFile(selectedFile);

      if (!result.success) {
        setError(result.error || "Failed to parse OBJ file");
        return;
      }

      // Add the loaded geometry as a new model
      const modelId = `imported_${Date.now()}`;
      const modelName = selectedFile.name.replace(".obj", "");

      dispatch(
        addModel({
          id: modelId,
          type: "imported",
          name: modelName,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          material: {
            type: "standard",
            color: "#808080",
            metalness: 0.1,
            roughness: 0.8,
          },
          parentId: null,
          visible: true,
          locked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userData: {
            geometry: result.geometry,
            importedFrom: selectedFile.name,
          },
        })
      );

      setSuccess(`Successfully imported "${selectedFile.name}"!`);
      dispatch(addNotification({ message: `Imported "${selectedFile.name}"`, severity: 'success' }));
      setSelectedFile(null);

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Import error:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    let geometryToExport: THREE.BufferGeometry | null = null;

    // Try to get geometry from different sources
    if (currentGeometry) {
      geometryToExport = currentGeometry;
    } else if (selectedModel) {
      if (
        selectedModel.type === "imported" &&
        selectedModel.userData?.geometry
      ) {
        geometryToExport = selectedModel.userData.geometry;
      } else {
        geometryToExport = createGeometry(selectedModel.type);
      }
    }

    if (!geometryToExport && exportFormat === "obj") {
      setError("No geometry available to export");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (exportFormat === "obj") {
        const filename = selectedModel?.name || exportFilename;
        OBJExporter.downloadOBJ(geometryToExport!, filename, exportOptions);
        setSuccess(`Successfully exported "${exportFilename}.obj"!`);
        dispatch(addNotification({ message: `Exported "${exportFilename}.obj"`, severity: 'success' }));
      } else {
        // glTF / GLB export
        if (!selectedModel) {
          setError("No model selected to export");
          setLoading(false);
          return;
        }
        const binary = exportFormat === "glb";
        const gltfOpts: GLTFExportOptions = { binary };
        const filename = selectedModel.name || exportFilename;
        await downloadModelGLTF(selectedModel, geometryToExport ?? undefined, filename, gltfOpts);
        setSuccess(`Successfully exported "${filename}.${exportFormat}"!`);
        dispatch(addNotification({ message: `Exported "${filename}.${exportFormat}"`, severity: 'success' }));
      }

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Export error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to export file"
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 },
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
          {mode === "import" ? <UploadIcon /> : <DownloadIcon />}
          {mode === "import" ? "Import Model" : "Export Model"}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {mode === "import" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select an OBJ file to import into your scene. The file will be
              parsed and added as a new model.
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept=".obj"
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
                  <UploadIcon sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
                  <Typography variant="body1">
                    Click to browse or drag & drop an OBJ file
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maximum file size: 50MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {mode === "export" && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Export the current model. Choose a format and configure options below.
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Export Format
            </Typography>
            <ToggleButtonGroup
              value={exportFormat}
              exclusive
              onChange={(_, v) => { if (v) setExportFormat(v as ExportFormat); }}
              sx={{ mb: 2, display: "flex" }}
              size="small"
            >
              <ToggleButton value="glb" sx={{ flex: 1 }}>GLB (Binary)</ToggleButton>
              <ToggleButton value="gltf" sx={{ flex: 1 }}>glTF (JSON)</ToggleButton>
              <ToggleButton value="obj" sx={{ flex: 1 }}>OBJ</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              fullWidth
              label="Filename"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              sx={{ mb: 2 }}
              helperText={`File will be saved as [filename].${exportFormat}`}
            />

            {exportFormat === "obj" && (
              <>
                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  OBJ Export Options
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeNormals || false}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          includeNormals: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Include Normals"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeUVs || false}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          includeUVs: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Include UV Coordinates"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.flipYUV || false}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          flipYUV: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Flip Y UV Coordinate"
                />
              </>
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
          onClick={mode === "import" ? handleImport : handleExport}
          disabled={
            loading ||
            (mode === "import" && !selectedFile) ||
            (mode === "export" && !selectedModel)
          }
          startIcon={
            loading ? (
              <CircularProgress size={20} />
            ) : mode === "import" ? (
              <UploadIcon />
            ) : (
              <DownloadIcon />
            )
          }
        >
          {loading ? "Processing..." : mode === "import" ? "Import" : "Export"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileManager;

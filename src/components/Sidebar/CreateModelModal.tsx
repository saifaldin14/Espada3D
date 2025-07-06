import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  Box,
  Alert,
} from "@mui/material";
import { FaCube, FaGlobe, FaShapes } from "react-icons/fa";
import {
  MaterialProperties,
  GeometryType,
  CreateModelPayload,
} from "../../types";
import { useModels } from "../../hooks/useRedux";
import { validateCreateModelPayload } from "../../utils/validation";
import { glassStyles } from "../../config/theme";

interface CreateModelModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateModelModal: React.FC<CreateModelModalProps> = ({
  open,
  onClose,
}) => {
  const [modelType, setModelType] = useState<GeometryType>("box");
  const [material, setMaterial] = useState<MaterialProperties>({
    type: "standard",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const { createModel, error } = useModels();

  const handleCreateModel = () => {
    try {
      const payload: CreateModelPayload = {
        type: modelType,
        material,
      };

      // Validate the payload before creating
      validateCreateModelPayload(payload);

      createModel(payload);
      setValidationError(null);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create model";
      setValidationError(errorMessage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          ...glassStyles.panel,
          borderRadius: "20px",
          padding: "8px",
        },
      }}
    >
      <DialogTitle sx={styles.title}>
        <Typography variant="h5" component="div" sx={styles.titleText}>
          ✨ Create New Model
        </Typography>
        <Typography variant="body2" sx={styles.subtitle}>
          Choose your 3D geometry and material properties
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={styles.content}>
        {(validationError || error) && (
          <Alert severity="error" sx={styles.alert}>
            {validationError || error}
          </Alert>
        )}

        <Box sx={styles.section}>
          <Typography variant="h6" sx={styles.sectionTitle}>
            Model Shape
          </Typography>
          <FormControl fullWidth sx={styles.formControl}>
            <InputLabel sx={styles.inputLabel}>Geometry Type</InputLabel>
            <Select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as GeometryType)}
              label="Geometry Type"
              sx={styles.select}
              startAdornment={
                <Box sx={styles.iconContainer}>
                  {modelType === "box" && <FaCube size={20} />}
                  {modelType === "sphere" && <FaGlobe size={20} />}
                  {modelType === "cylinder" && <FaShapes size={20} />}
                </Box>
              }
            >
              <MenuItem value="box" sx={styles.menuItem}>
                <Box sx={styles.menuItemContent}>
                  <FaCube size={16} />
                  <Box sx={styles.menuItemText}>
                    <Typography variant="body2" fontWeight={600}>
                      Box
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Rectangular 3D shape
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="sphere" sx={styles.menuItem}>
                <Box sx={styles.menuItemContent}>
                  <FaGlobe size={16} />
                  <Box sx={styles.menuItemText}>
                    <Typography variant="body2" fontWeight={600}>
                      Sphere
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Perfectly round 3D shape
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="cylinder" sx={styles.menuItem}>
                <Box sx={styles.menuItemContent}>
                  <FaShapes size={16} />
                  <Box sx={styles.menuItemText}>
                    <Typography variant="body2" fontWeight={600}>
                      Cylinder
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Circular tube shape
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={styles.section}>
          <Typography variant="h6" sx={styles.sectionTitle}>
            Material Properties
          </Typography>
          <FormControl fullWidth sx={styles.formControl}>
            <InputLabel sx={styles.inputLabel}>Material Type</InputLabel>
            <Select
              value={material.type}
              onChange={(e) =>
                setMaterial({
                  type: e.target.value as MaterialProperties["type"],
                })
              }
              label="Material Type"
              sx={styles.select}
            >
              <MenuItem value="standard" sx={styles.menuItem}>
                <Box sx={styles.menuItemText}>
                  <Typography variant="body2" fontWeight={600}>
                    Standard
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Physically-based material with metalness and roughness
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="phong" sx={styles.menuItem}>
                <Box sx={styles.menuItemText}>
                  <Typography variant="body2" fontWeight={600}>
                    Phong
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Shiny material with specular highlights
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="lambert" sx={styles.menuItem}>
                <Box sx={styles.menuItemText}>
                  <Typography variant="body2" fontWeight={600}>
                    Lambert
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Matte material with diffuse lighting only
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={styles.actions}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={styles.cancelButton}
          className="hover-lift"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateModel}
          variant="contained"
          sx={styles.createButton}
          className="hover-lift"
        >
          Create Model
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const styles = {
  title: {
    textAlign: "center",
    padding: "24px 24px 16px",
    background: "transparent",
  },
  titleText: {
    fontWeight: 700,
    background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "8px",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "0.875rem",
  },
  content: {
    padding: "20px 24px",
    backgroundColor: "transparent",
  },
  alert: {
    marginBottom: "20px",
    ...glassStyles.button,
    "& .MuiAlert-message": {
      color: "#ffffff",
    },
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    marginBottom: "16px",
    fontWeight: 600,
    color: "#ffffff",
    fontSize: "1rem",
  },
  formControl: {
    "& .MuiOutlinedInput-root": {
      ...glassStyles.button,
      borderRadius: "12px",
    },
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    "&.Mui-focused": {
      color: "#00c9ff",
    },
  },
  select: {
    color: "#ffffff",
    "& .MuiSelect-icon": {
      color: "rgba(255, 255, 255, 0.8)",
    },
  },
  iconContainer: {
    marginRight: "12px",
    display: "flex",
    alignItems: "center",
    color: "#00c9ff",
  },
  menuItem: {
    padding: "12px 16px",
    borderRadius: "8px",
    margin: "4px 8px",
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      background: "rgba(0, 201, 255, 0.1)",
    },
  },
  menuItemContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
  },
  menuItemText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  actions: {
    padding: "16px 24px 24px",
    gap: "12px",
    backgroundColor: "transparent",
  },
  cancelButton: {
    ...glassStyles.button,
    color: "#ffffff",
    borderColor: "rgba(255, 255, 255, 0.3)",
    "&:hover": {
      borderColor: "rgba(255, 255, 255, 0.5)",
      background: "rgba(255, 255, 255, 0.1)",
    },
  },
  createButton: {
    ...glassStyles.gradientButton,
    fontWeight: 600,
  },
};

export default CreateModelModal;

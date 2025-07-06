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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div" align="center">
          Create New Model
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {(validationError || error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError || error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel>Model Type</InputLabel>
          <Select
            value={modelType}
            onChange={(e) => setModelType(e.target.value as GeometryType)}
            label="Model Type"
            startAdornment={
              <Tooltip title="Choose the shape of your model">
                <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                  {modelType === "box" && <FaCube />}
                  {modelType === "sphere" && <FaGlobe />}
                  {modelType === "cylinder" && <FaShapes />}
                </Box>
              </Tooltip>
            }
          >
            <MenuItem value="box">Box</MenuItem>
            <MenuItem value="sphere">Sphere</MenuItem>
            <MenuItem value="cylinder">Cylinder</MenuItem>
          </Select>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Select the 3D shape you want to create.
          </Typography>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Material</InputLabel>
          <Select
            value={material.type}
            onChange={(e) =>
              setMaterial({
                type: e.target.value as MaterialProperties["type"],
              })
            }
            label="Material"
          >
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="phong">Phong</MenuItem>
            <MenuItem value="lambert">Lambert</MenuItem>
          </Select>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Choose the material type to define how your model interacts with
            light.
          </Typography>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleCreateModel}
          color="primary"
          variant="contained"
          sx={{ ml: 2 }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateModelModal;

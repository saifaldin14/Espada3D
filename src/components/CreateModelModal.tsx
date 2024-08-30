import React, { useState } from "react";
import { useDispatch } from "react-redux";
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
} from "@mui/material";
import { createNewModel } from "../store/slices/modelSlice";

interface CreateModelModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateModelModal: React.FC<CreateModelModalProps> = ({
  open,
  onClose,
}) => {
  const [modelType, setModelType] = useState<"box" | "sphere" | "cylinder">(
    "box"
  );
  const [material, setMaterial] = useState<"standard" | "phong" | "lambert">(
    "standard"
  );
  const dispatch = useDispatch();

  const handleCreateModel = () => {
    dispatch(createNewModel({ type: modelType, material }));
    onClose(); // Close the modal after creating the model
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Model</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ marginBottom: 2 }}>
          <InputLabel>Model Type</InputLabel>
          <Select
            value={modelType}
            onChange={(e) =>
              setModelType(e.target.value as "box" | "sphere" | "cylinder")
            }
            label="Model Type"
          >
            <MenuItem value="box">Box</MenuItem>
            <MenuItem value="sphere">Sphere</MenuItem>
            <MenuItem value="cylinder">Cylinder</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Material</InputLabel>
          <Select
            value={material}
            onChange={(e) =>
              setMaterial(e.target.value as "standard" | "phong" | "lambert")
            }
            label="Material"
          >
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="phong">Phong</MenuItem>
            <MenuItem value="lambert">Lambert</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleCreateModel} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateModelModal;

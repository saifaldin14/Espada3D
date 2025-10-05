import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateModelMaterial } from "../../store/slices/modelSlice";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";

const MaterialSelector: React.FC = () => {
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const selectedModel = useSelector((state: any) =>
    state.models.models.find((model: any) => model.id === selectedModelId)
  );
  const dispatch = useDispatch();

  const handleMaterialChange = (event: SelectChangeEvent) => {
    if (selectedModelId) {
      dispatch(
        updateModelMaterial({
          id: selectedModelId,
          material: {
            type: event.target.value as "standard" | "phong" | "lambert",
          },
        })
      );
    }
  };

  return (
    <FormControl fullWidth variant="outlined" sx={styles.formControl}>
      <InputLabel>Material</InputLabel>
      <Select
        value={selectedModel?.material || "standard"}
        onChange={handleMaterialChange}
        label="Material"
      >
        <MenuItem value="standard">Standard</MenuItem>
        <MenuItem value="phong">Phong</MenuItem>
        <MenuItem value="lambert">Lambert</MenuItem>
      </Select>
    </FormControl>
  );
};

const styles = {
  formControl: {
    marginBottom: "16px",
    "& .MuiOutlinedInput-root": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: "8px",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
      },
      "&.Mui-focused": {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(255, 255, 255, 0.7)",
      "&.Mui-focused": {
        color: "#667eea",
      },
    },
  },
};

export default MaterialSelector;

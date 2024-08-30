import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateModelMaterial } from "../store/slices/modelSlice";
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
    backgroundColor: "#1abc9c",
    color: "#ecf0f1",
    borderRadius: "8px",
  },
};

export default MaterialSelector;

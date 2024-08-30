import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateModelTransform,
  updateModelMaterial,
  Vector3Tuple,
  MaterialProperties,
} from "../../store/slices/modelSlice";
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
} from "@mui/material";
import { SketchPicker } from "react-color"; // Import a color picker component

const ModelEditor: React.FC = () => {
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const models = useSelector((state: any) => state.models.models);
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const dispatch = useDispatch();

  const [position, setPosition] = useState<Vector3Tuple>([0, 0, 0]);
  const [rotation, setRotation] = useState<Vector3Tuple>([0, 0, 0]);
  const [scale, setScale] = useState<Vector3Tuple>([1, 1, 1]);
  const [materialType, setMaterialType] = useState<
    "standard" | "phong" | "lambert"
  >("standard");
  const [color, setColor] = useState<string>("#00ff00");

  useEffect(() => {
    const model = models.find((m: any) => m.id === selectedModelId);
    if (model) {
      setPosition(model.position ?? [0, 0, 0]);
      setRotation(model.rotation ?? [0, 0, 0]);
      setScale(model.scale ?? [1, 1, 1]);
      setMaterialType(model.material?.type ?? "standard");
      setColor(model.material?.color ?? "#00ff00");
    }
  }, [models, selectedModelId]);

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

    const newMaterial = {
      type: materialType,
      color,
      [property]: value,
    };

    dispatch(
      updateModelMaterial({
        id: selectedModelId as string,
        material: newMaterial as MaterialProperties,
      })
    );
  };

  return (
    <Box sx={styles.editor}>
      <Typography variant="h5" sx={styles.title}>
        Model Editor
      </Typography>
      <Box sx={styles.scrollContainer}>
        <Typography variant="h6" sx={styles.subTitle}>
          {activeTool
            ? activeTool.charAt(0).toUpperCase() + activeTool.slice(1)
            : ""}
        </Typography>

        {/* Group X, Y, Z Controls */}
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
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Material Editor Section */}
        <Card sx={styles.card}>
          <CardContent sx={styles.cardContent}>
            <Typography variant="h6" sx={styles.subTitle}>
              Material
            </Typography>
            <FormControl fullWidth sx={{ marginBottom: 2 }}>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={materialType}
                onChange={(e) => {
                  setMaterialType(
                    e.target.value as "standard" | "phong" | "lambert"
                  );
                  handleMaterialChange("type", e.target.value);
                }}
                label="Material Type"
              >
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="phong">Phong</MenuItem>
                <MenuItem value="lambert">Lambert</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body1" sx={{ marginBottom: 1 }}>
              Color
            </Typography>
            <SketchPicker
              color={color}
              onChange={(color: { hex: React.SetStateAction<string> }) => {
                setColor(color.hex);
                handleMaterialChange("color", color.hex);
              }}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

const styles = {
  editor: {
    padding: "16px",
    background: "#f5f5f5",
    borderRadius: "8px",
    width: "300px",
    height: "98vh",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
  },
  title: {
    marginBottom: "16px",
    fontWeight: "bold",
  },
  subTitle: {
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#555",
  },
  scrollContainer: {
    overflowY: "auto" as "auto",
    maxHeight: "calc(100vh - 80px)",
  },
  card: {
    background: "#ffffff",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  cardContent: {
    paddingBottom: "16px !important",
  },
  textField: {
    marginTop: "8px",
  },
};

export default ModelEditor;

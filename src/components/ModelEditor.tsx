import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateModelTransform, Vector3Tuple } from "../store/slices/modelSlice";
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Box,
  IconButton,
} from "@mui/material";
import { Transform } from "@mui/icons-material";

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

  useEffect(() => {
    const model = models.find((m: any) => m.id === selectedModelId);
    if (model) {
      setPosition(model.position ?? [0, 0, 0]);
      setRotation(model.rotation ?? [0, 0, 0]);
      setScale(model.scale ?? [1, 1, 1]);
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

  return (
    <Box sx={styles.editor}>
      <Typography variant="h5" sx={styles.title}>
        Model Editor
      </Typography>

      <Typography variant="h6" sx={styles.subTitle}>
        {activeTool
          ? activeTool.charAt(0).toUpperCase() + activeTool.slice(1)
          : ""}
      </Typography>

      <Grid container spacing={2}>
        {["X", "Y", "Z"].map((axis, i) => (
          <Grid item xs={12} key={i}>
            <Card sx={styles.card}>
              <CardContent sx={styles.cardContent}>
                <Box sx={styles.cardHeader}>
                  <Typography variant="h6" component="div">
                    {axis}
                  </Typography>
                  <IconButton sx={styles.iconButton}>
                    <Transform />
                  </IconButton>
                </Box>
                <TextField
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const styles = {
  editor: {
    padding: "16px",
    background: "#f5f5f5",
    borderRadius: "8px",
    width: "260px",
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
  card: {
    background: "#ffffff",
    borderRadius: "8px",
  },
  cardContent: {
    paddingBottom: "16px !important",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    color: "#1abc9c",
  },
  textField: {
    marginTop: "8px",
  },
};

export default ModelEditor;

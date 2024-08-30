import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateModelTransform, Vector3Tuple } from "../store/slices/modelSlice";
import { Card, CardContent, TextField, Typography } from "@mui/material";

const ModelEditor: React.FC = () => {
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const models = useSelector((state: any) => state.models.models);
  const activeTool = useSelector((state: any) => state.ui.activeTool); // Get the active tool from Redux
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

    if (isNaN(value)) value = 0; // Prevent NaN

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
    <div style={styles.editor}>
      <h3>Model Editor</h3>

      <div style={styles.controlGroup}>
        <h4>{activeTool?.charAt(0).toUpperCase() + activeTool?.slice(1)}</h4>
        {["X", "Y", "Z"].map((axis, i) => (
          <div key={i}>
            <Card>
              <CardContent>
                <Typography gutterBottom variant="h6">
                  {axis}
                </Typography>
                <TextField
                  id="transform-value"
                  value={
                    activeTool === "translate"
                      ? position[i]
                      : activeTool === "rotate"
                      ? rotation[i]
                      : scale[i]
                  }
                  type="number"
                  onChange={(e) =>
                    handleTransformChange(i, parseFloat(e.target.value))
                  }
                />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  editor: {
    padding: "10px",
    background: "#ecf0f1",
    borderRadius: "8px",
    width: "200px",
  },
  controlGroup: {
    marginBottom: "15px",
  },
  control: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
  },
};

export default ModelEditor;

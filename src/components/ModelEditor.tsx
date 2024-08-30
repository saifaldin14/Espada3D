import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useModel } from "./ModelContext";
import { updateModelTransform } from "../store/slices/modelSlice";

const ModelEditor: React.FC = () => {
  const { selectedModel } = useModel();
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const activeTool = useSelector((state: any) => state.ui.activeTool); // Get the active tool from Redux
  const dispatch = useDispatch();

  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1]);

  useEffect(() => {
    if (selectedModel) {
      const newPosition = selectedModel.position
        .toArray()
        .map((n) => (isNaN(n) ? 0 : n)) as [number, number, number];
      const newRotation = selectedModel.rotation
        .toArray()
        .slice(0, 3)
        .map((n) => (typeof n === "number" ? n : 0)) as [
        number,
        number,
        number
      ];
      const newScale = selectedModel.scale
        .toArray()
        .map((n) => (isNaN(n) ? 1 : n)) as [number, number, number];
      setPosition(newPosition);
      setRotation(newRotation);
      setScale(newScale);
    }
  }, [selectedModel]);

  const handleTransformChange = (axis: number, value: number) => {
    if (!selectedModelId) return;

    let newPosition: [number, number, number] = [...position];
    let newRotation: [number, number, number] = [...rotation];
    let newScale: [number, number, number] = [...scale];

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
        id: selectedModelId,
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
          <div key={i} style={styles.control}>
            <label>{axis}</label>
            <input
              type="number"
              value={
                activeTool === "translate"
                  ? position[i]
                  : activeTool === "rotate"
                  ? rotation[i]
                  : scale[i]
              }
              onChange={(e) =>
                handleTransformChange(i, parseFloat(e.target.value))
              }
            />
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

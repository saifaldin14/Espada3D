import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Slider,
  FormControl,
  FormLabel,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import {
  Transform as TransformIcon,
  Refresh as ResetIcon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useModelCommands } from "../../hooks/useModelCommands";
import { useCommandManager } from "../../hooks/useCommandManager";

interface TransformDemoProps {
  selectedModelId?: string;
}

const TransformDemo: React.FC<TransformDemoProps> = ({ selectedModelId }) => {
  const models = useSelector((state: RootState) => state.models.models);
  const { updateTransform } = useModelCommands();
  const { canUndo, canRedo, undoDescription, redoDescription } =
    useCommandManager();

  const selectedModel = selectedModelId
    ? models.find((m) => m.id === selectedModelId)
    : null;

  const [tempTransform, setTempTransform] = useState({
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  });

  // Update temp transform when model selection changes
  React.useEffect(() => {
    if (selectedModel) {
      setTempTransform({
        position: [...selectedModel.position],
        rotation: [...selectedModel.rotation],
        scale: [...selectedModel.scale],
      });
    }
  }, [selectedModel]);

  const handleTransformChange = useCallback(
    (
      type: "position" | "rotation" | "scale",
      axis: 0 | 1 | 2,
      value: number
    ) => {
      setTempTransform((prev) => ({
        ...prev,
        [type]: prev[type].map((v, i) => (i === axis ? value : v)) as [
          number,
          number,
          number,
        ],
      }));
    },
    []
  );

  const applyTransform = useCallback(() => {
    if (!selectedModel) return;

    updateTransform(selectedModel.id, tempTransform);
  }, [selectedModel, tempTransform, updateTransform]);

  const resetTransform = useCallback(() => {
    if (!selectedModel) return;

    const resetTransform = {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
    };

    setTempTransform(resetTransform);
    updateTransform(selectedModel.id, resetTransform);
  }, [selectedModel, updateTransform]);

  if (!selectedModel) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Select a model to see transform controls
        </Typography>
      </Paper>
    );
  }

  const hasChanges =
    JSON.stringify(tempTransform.position) !==
      JSON.stringify(selectedModel.position) ||
    JSON.stringify(tempTransform.rotation) !==
      JSON.stringify(selectedModel.rotation) ||
    JSON.stringify(tempTransform.scale) !== JSON.stringify(selectedModel.scale);

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <TransformIcon />
        <Typography variant="h6">Transform Controls</Typography>
        <Chip
          label={selectedModel.name}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Position Controls */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Position</FormLabel>
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <Box key={axis} sx={{ mb: 1 }}>
            <Typography variant="body2" gutterBottom>
              {axis}: {tempTransform.position[index].toFixed(2)}
            </Typography>
            <Slider
              value={tempTransform.position[index]}
              onChange={(_: Event, value: number | number[]) =>
                handleTransformChange(
                  "position",
                  index as 0 | 1 | 2,
                  value as number
                )
              }
              min={-10}
              max={10}
              step={0.1}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
        ))}
      </FormControl>

      <Divider sx={{ my: 2 }} />

      {/* Rotation Controls */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 1, fontWeight: 600 }}>
          Rotation (degrees)
        </FormLabel>
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <Box key={axis} sx={{ mb: 1 }}>
            <Typography variant="body2" gutterBottom>
              {axis}:{" "}
              {((tempTransform.rotation[index] * 180) / Math.PI).toFixed(1)}°
            </Typography>
            <Slider
              value={(tempTransform.rotation[index] * 180) / Math.PI}
              onChange={(_: Event, value: number | number[]) =>
                handleTransformChange(
                  "rotation",
                  index as 0 | 1 | 2,
                  ((value as number) * Math.PI) / 180
                )
              }
              min={-180}
              max={180}
              step={1}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
        ))}
      </FormControl>

      <Divider sx={{ my: 2 }} />

      {/* Scale Controls */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Scale</FormLabel>
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <Box key={axis} sx={{ mb: 1 }}>
            <Typography variant="body2" gutterBottom>
              {axis}: {tempTransform.scale[index].toFixed(2)}
            </Typography>
            <Slider
              value={tempTransform.scale[index]}
              onChange={(_: Event, value: number | number[]) =>
                handleTransformChange(
                  "scale",
                  index as 0 | 1 | 2,
                  value as number
                )
              }
              min={0.1}
              max={3}
              step={0.1}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
        ))}
      </FormControl>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={applyTransform}
          disabled={!hasChanges}
          sx={{ flex: 1 }}
        >
          Apply Changes
        </Button>
        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={resetTransform}
          sx={{ flex: 1 }}
        >
          Reset
        </Button>
      </Stack>

      {/* Undo/Redo Status */}
      <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>History Status:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {canUndo ? `Can undo: ${undoDescription}` : "No actions to undo"}
        </Typography>
        {canRedo && (
          <Typography variant="body2" color="text.secondary">
            Can redo: {redoDescription}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default TransformDemo;

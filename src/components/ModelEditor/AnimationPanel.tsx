import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Add,
  Delete,
  PlayArrow,
  Pause,
  Stop,
  Timeline,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
} from "@mui/material";
import { AnimationData, AnimationKeyframe, Vector3Tuple } from "../../types";
import { glassStyles } from "../../config/theme";

interface AnimationPanelProps {
  isOpen: boolean;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({ isOpen }) => {
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const selectedModel = useSelector((state: any) =>
    state.models.models.find((m: any) => m.id === selectedModelId)
  );

  const [animations, setAnimations] = useState<AnimationData[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [newAnimationName, setNewAnimationName] = useState("");
  const [newAnimationDuration, setNewAnimationDuration] = useState(5);

  if (!isOpen || !selectedModelId) return null;

  const handleCreateAnimation = () => {
    if (newAnimationName && selectedModel) {
      const newAnimation: AnimationData = {
        id: `anim_${Date.now()}`,
        name: newAnimationName,
        duration: newAnimationDuration,
        loop: true,
        keyframes: [
          {
            time: 0,
            position: selectedModel.position,
            rotation: selectedModel.rotation,
            scale: selectedModel.scale,
          },
          {
            time: newAnimationDuration,
            position: selectedModel.position,
            rotation: selectedModel.rotation,
            scale: selectedModel.scale,
          },
        ],
        enabled: true,
      };

      setAnimations([...animations, newAnimation]);
      setCreateDialog(false);
      setNewAnimationName("");
      setNewAnimationDuration(5);
    }
  };

  const handleDeleteAnimation = (animationId: string) => {
    setAnimations(animations.filter((anim) => anim.id !== animationId));
    if (currentAnimation === animationId) {
      setCurrentAnimation(null);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const currentAnim = animations.find((anim) => anim.id === currentAnimation);

  return (
    <Box sx={styles.panel}>
      <Typography variant="h6" sx={styles.title}>
        Animation
      </Typography>

      <Box sx={styles.toolbar}>
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => setCreateDialog(true)}
          variant="outlined"
        >
          New Animation
        </Button>
      </Box>

      {/* Animation List */}
      <Card sx={styles.card}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Animations
          </Typography>
          <List dense>
            {animations.map((animation) => (
              <ListItem key={animation.id} disablePadding>
                <ListItemButton
                  selected={currentAnimation === animation.id}
                  onClick={() => setCurrentAnimation(animation.id)}
                  sx={styles.animationItem}
                >
                  <ListItemText
                    primary={animation.name}
                    secondary={`${animation.duration}s ${
                      animation.loop ? "(Loop)" : ""
                    }`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteAnimation(animation.id);
                      }}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>
            ))}
            {animations.length === 0 && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                No animations created
              </Typography>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Animation Controls */}
      {currentAnim && (
        <Card sx={styles.card}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Controls - {currentAnim.name}
            </Typography>

            <Box sx={styles.playbackControls}>
              <IconButton onClick={handlePlayPause} color="primary">
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton onClick={handleStop}>
                <Stop />
              </IconButton>
            </Box>

            <Typography variant="body2" gutterBottom>
              Time: {currentTime.toFixed(2)}s / {currentAnim.duration}s
            </Typography>
            <Slider
              value={currentTime}
              onChange={(_: any, value: number | number[]) =>
                setCurrentTime(value as number)
              }
              min={0}
              max={currentAnim.duration}
              step={0.1}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Keyframes ({currentAnim.keyframes.length})
            </Typography>

            <List dense>
              {currentAnim.keyframes.map((keyframe, index) => (
                <ListItem key={index} sx={styles.keyframeItem}>
                  <ListItemText
                    primary={`Keyframe ${index + 1}`}
                    secondary={`Time: ${keyframe.time}s`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => {
                // Add keyframe at current time
                const newKeyframe: AnimationKeyframe = {
                  time: currentTime,
                  position: selectedModel?.position || [0, 0, 0],
                  rotation: selectedModel?.rotation || [0, 0, 0],
                  scale: selectedModel?.scale || [1, 1, 1],
                };

                const updatedAnimation = {
                  ...currentAnim,
                  keyframes: [...currentAnim.keyframes, newKeyframe].sort(
                    (a, b) => a.time - b.time
                  ),
                };

                setAnimations(
                  animations.map((anim) =>
                    anim.id === currentAnimation ? updatedAnimation : anim
                  )
                );
              }}
              sx={{ mt: 1 }}
            >
              Add Keyframe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Animation Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Animation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Animation Name"
            fullWidth
            variant="outlined"
            value={newAnimationName}
            onChange={(e) => setNewAnimationName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Duration (seconds)"
            type="number"
            fullWidth
            variant="outlined"
            value={newAnimationDuration}
            onChange={(e) =>
              setNewAnimationDuration(parseFloat(e.target.value) || 5)
            }
            inputProps={{ min: 0.1, max: 60, step: 0.1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAnimation}
            variant="contained"
            disabled={!newAnimationName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const styles = {
  panel: {
    width: "350px",
    height: "100vh",
    backgroundColor: "#f5f5f5",
    borderLeft: "1px solid #ddd",
    padding: "16px",
    boxSizing: "border-box" as const,
    overflow: "auto",
  },
  title: {
    marginBottom: "16px",
    fontWeight: "bold",
  },
  toolbar: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  card: {
    marginBottom: "16px",
    backgroundColor: "white",
  },
  animationItem: {
    borderRadius: "4px",
    marginBottom: "4px",
    "&.Mui-selected": {
      backgroundColor: "rgba(25, 118, 210, 0.08)",
    },
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.04)",
    },
  },
  keyframeItem: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: "4px",
    marginBottom: "4px",
  },
  playbackControls: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "16px",
  },
};

export default AnimationPanel;

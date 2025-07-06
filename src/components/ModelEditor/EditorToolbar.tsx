import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setActiveTool,
  setEditMode,
  setSnap,
  setSnapSize,
  toggleHierarchyPanel,
  toggleAnimationPanel,
} from "../../store/slices/uiSlice";
import {
  undo,
  redo,
  copyModels,
  pasteModels,
  saveToHistory,
} from "../../store/slices/modelSlice";
import {
  Box,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  OpenWith,
  RotateRight,
  ZoomOutMap,
  Undo,
  Redo,
  ContentCopy,
  ContentPaste,
  Save,
  GridOn,
  GridOff,
  AccountTree,
  Timeline,
  CenterFocusStrong,
} from "@mui/icons-material";
import { ToolType, EditMode } from "../../types";

const EditorToolbar: React.FC = () => {
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const editMode = useSelector((state: any) => state.ui.editMode);
  const snap = useSelector((state: any) => state.ui.snap);
  const snapSize = useSelector((state: any) => state.ui.snapSize);
  const showGrid = useSelector((state: any) => state.ui.showGrid);
  const isHierarchyPanelOpen = useSelector(
    (state: any) => state.ui.isHierarchyPanelOpen
  );
  const isAnimationPanelOpen = useSelector(
    (state: any) => state.ui.isAnimationPanelOpen
  );
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const selectedModelIds = useSelector(
    (state: any) => state.models.selectedModelIds
  );

  const dispatch = useDispatch();

  const handleToolChange = (
    event: React.MouseEvent<HTMLElement>,
    newTool: ToolType
  ) => {
    if (newTool !== null) {
      dispatch(setActiveTool(newTool));
    }
  };

  const handleEditModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: EditMode
  ) => {
    if (newMode !== null) {
      dispatch(setEditMode(newMode));
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case "z":
          event.preventDefault();
          if (event.shiftKey) {
            dispatch(redo());
          } else {
            dispatch(undo());
          }
          break;
        case "y":
          event.preventDefault();
          dispatch(redo());
          break;
        case "c":
          if (selectedModelIds.length > 0) {
            event.preventDefault();
            dispatch(copyModels(selectedModelIds));
          }
          break;
        case "v":
          event.preventDefault();
          dispatch(pasteModels());
          break;
        case "s":
          event.preventDefault();
          dispatch(saveToHistory());
          break;
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedModelIds]);

  return (
    <Box sx={styles.toolbar}>
      {/* Transform Tools */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          Transform
        </Typography>
        <ToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={handleToolChange}
          size="small"
        >
          <ToggleButton value="translate">
            <Tooltip title="Move (G)">
              <OpenWith />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="rotate">
            <Tooltip title="Rotate (R)">
              <RotateRight />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="scale">
            <Tooltip title="Scale (S)">
              <ZoomOutMap />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="select">
            <Tooltip title="Select (A)">
              <CenterFocusStrong />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ margin: "0 8px" }} />

      {/* Edit Mode */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          Mode
        </Typography>
        <ToggleButtonGroup
          value={editMode}
          exclusive
          onChange={handleEditModeChange}
          size="small"
        >
          <ToggleButton value="model">
            <Tooltip title="Model Mode">
              <Box>M</Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="material">
            <Tooltip title="Material Mode">
              <Box>T</Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="animation">
            <Tooltip title="Animation Mode">
              <Timeline />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="hierarchy">
            <Tooltip title="Hierarchy Mode">
              <AccountTree />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ margin: "0 8px" }} />

      {/* History Actions */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          History
        </Typography>
        <Box sx={styles.buttonGroup}>
          <Tooltip title="Undo (Ctrl+Z)">
            <IconButton
              size="small"
              onClick={() => dispatch(undo())}
              sx={styles.iconButton}
            >
              <Undo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <IconButton
              size="small"
              onClick={() => dispatch(redo())}
              sx={styles.iconButton}
            >
              <Redo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save State (Ctrl+S)">
            <IconButton
              size="small"
              onClick={() => dispatch(saveToHistory())}
              sx={styles.iconButton}
            >
              <Save />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ margin: "0 8px" }} />

      {/* Clipboard Actions */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          Clipboard
        </Typography>
        <Box sx={styles.buttonGroup}>
          <Tooltip title="Copy (Ctrl+C)">
            <IconButton
              size="small"
              onClick={() => dispatch(copyModels(selectedModelIds))}
              disabled={selectedModelIds.length === 0}
              sx={styles.iconButton}
            >
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title="Paste (Ctrl+V)">
            <IconButton
              size="small"
              onClick={() => dispatch(pasteModels())}
              sx={styles.iconButton}
            >
              <ContentPaste />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ margin: "0 8px" }} />

      {/* Snap Settings */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          Snap
        </Typography>
        <Box sx={styles.snapControls}>
          <FormControlLabel
            control={
              <Switch
                checked={snap}
                onChange={(e) => dispatch(setSnap(e.target.checked))}
                size="small"
              />
            }
            label="Grid"
            sx={styles.switchLabel}
          />
          <TextField
            size="small"
            type="number"
            value={snapSize}
            onChange={(e) =>
              dispatch(setSnapSize(parseFloat(e.target.value) || 0.5))
            }
            disabled={!snap}
            sx={{ width: 80 }}
            inputProps={{ min: 0.1, max: 5, step: 0.1 }}
          />
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ margin: "0 8px" }} />

      {/* Panel Toggles */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          Panels
        </Typography>
        <Box sx={styles.buttonGroup}>
          <Tooltip title="Toggle Hierarchy Panel">
            <IconButton
              size="small"
              onClick={() => dispatch(toggleHierarchyPanel())}
              sx={{
                ...styles.iconButton,
                backgroundColor: isHierarchyPanelOpen
                  ? "primary.main"
                  : "transparent",
                color: isHierarchyPanelOpen
                  ? "primary.contrastText"
                  : "text.primary",
              }}
            >
              <AccountTree />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Animation Panel">
            <IconButton
              size="small"
              onClick={() => dispatch(toggleAnimationPanel())}
              sx={{
                ...styles.iconButton,
                backgroundColor: isAnimationPanelOpen
                  ? "primary.main"
                  : "transparent",
                color: isAnimationPanelOpen
                  ? "primary.contrastText"
                  : "text.primary",
              }}
            >
              <Timeline />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

const styles = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #ddd",
    gap: "8px",
    minHeight: "56px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  section: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
  },
  sectionTitle: {
    fontSize: "10px",
    color: "text.secondary",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  buttonGroup: {
    display: "flex",
    gap: "4px",
  },
  iconButton: {
    width: "32px",
    height: "32px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.04)",
    },
  },
  snapControls: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
  },
  switchLabel: {
    fontSize: "12px",
    margin: 0,
    "& .MuiFormControlLabel-label": {
      fontSize: "12px",
    },
  },
};

export default EditorToolbar;

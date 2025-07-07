import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setActiveTool,
  setEditMode,
  setSnap,
  setSnapSize,
  setGrid,
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
import { glassStyles } from "../../config/theme";

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
          dispatch(pasteModels([0, 0, 0]));
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
    <Box sx={styles.toolbar} className="fade-in">
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
          sx={styles.toggleGroup}
        >
          <ToggleButton value="translate" sx={styles.toggleButton}>
            <Tooltip title="Move (G)">
              <OpenWith fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="rotate" sx={styles.toggleButton}>
            <Tooltip title="Rotate (R)">
              <RotateRight fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="scale" sx={styles.toggleButton}>
            <Tooltip title="Scale (S)">
              <ZoomOutMap fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="select" sx={styles.toggleButton}>
            <Tooltip title="Select (A)">
              <CenterFocusStrong fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider orientation="vertical" flexItem sx={styles.divider} />

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
              className="hover-lift"
            >
              <Undo fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo (Ctrl+Y)">
            <IconButton
              size="small"
              onClick={() => dispatch(redo())}
              sx={styles.iconButton}
              className="hover-lift"
            >
              <Redo fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save State (Ctrl+S)">
            <IconButton
              size="small"
              onClick={() => dispatch(saveToHistory())}
              sx={styles.iconButton}
              className="hover-lift"
            >
              <Save fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={styles.divider} />

      {/* Clipboard Actions */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          Clipboard
        </Typography>
        <Box sx={styles.buttonGroup}>
          <Tooltip title="Copy (Ctrl+C)">
            <span>
              <IconButton
                size="small"
                onClick={() => dispatch(copyModels(selectedModelIds))}
                disabled={selectedModelIds.length === 0}
                sx={styles.iconButton}
                className="hover-lift"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Paste (Ctrl+V)">
            <IconButton
              size="small"
              onClick={() => dispatch(pasteModels([0, 0, 0]))}
              sx={styles.iconButton}
              className="hover-lift"
            >
              <ContentPaste fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={styles.divider} />

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
                sx={styles.switch}
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
            sx={styles.textField}
            inputProps={{ min: 0.1, max: 5, step: 0.1 }}
          />
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem sx={styles.divider} />

      {/* Edit Mode */}
      {selectedModelId && (
        <>
          <Box sx={styles.section}>
            <Typography variant="body2" sx={styles.sectionTitle}>
              Edit Mode
            </Typography>
            <ToggleButtonGroup
              value={editMode}
              exclusive
              onChange={handleEditModeChange}
              size="small"
              sx={styles.toggleGroup}
            >
              <ToggleButton value="model" sx={styles.compactToggleButton}>
                Model
              </ToggleButton>
              <ToggleButton value="vertex" sx={styles.compactToggleButton}>
                Vertex
              </ToggleButton>
              <ToggleButton value="edge" sx={styles.compactToggleButton}>
                Edge
              </ToggleButton>
              <ToggleButton value="face" sx={styles.compactToggleButton}>
                Face
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Divider orientation="vertical" flexItem sx={styles.divider} />
        </>
      )}

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
                ...(isHierarchyPanelOpen ? styles.activeIconButton : {}),
              }}
              className="hover-lift"
            >
              <AccountTree fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Animation Panel">
            <IconButton
              size="small"
              onClick={() => dispatch(toggleAnimationPanel())}
              sx={{
                ...styles.iconButton,
                ...(isAnimationPanelOpen ? styles.activeIconButton : {}),
              }}
              className="hover-lift"
            >
              <Timeline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Viewport Toggle */}
      <Box sx={styles.section}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          View
        </Typography>
        <Tooltip title="Toggle Grid">
          <IconButton
            size="small"
            onClick={() => dispatch(setGrid(!showGrid))}
            sx={{
              ...styles.iconButton,
              ...(showGrid ? styles.activeIconButton : {}),
            }}
            className="hover-lift"
          >
            {showGrid ? (
              <GridOn fontSize="small" />
            ) : (
              <GridOff fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

const styles = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    ...glassStyles.panel,
    margin: "16px 16px 8px 8px",
    marginLeft: "8px",
    borderRadius: "16px",
    minHeight: "64px",
    position: "relative",
    zIndex: 5,
    gap: "16px",
  },
  section: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "11px",
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    fontWeight: 600,
  },
  buttonGroup: {
    display: "flex",
    gap: "6px",
  },
  toggleGroup: {
    ...glassStyles.button,
    borderRadius: "12px",
    "& .MuiToggleButtonGroup-grouped": {
      margin: "0 2px",
      border: "none",
      borderRadius: "10px !important",
      "&:not(:first-of-type)": {
        borderLeft: "none",
      },
    },
  },
  toggleButton: {
    ...glassStyles.button,
    minWidth: "40px",
    minHeight: "40px",
    padding: "8px",
    color: "#ffffff",
    "&.Mui-selected": {
      ...glassStyles.gradientButton,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
    },
  },
  compactToggleButton: {
    ...glassStyles.button,
    fontSize: "10px",
    padding: "6px 12px",
    minWidth: "60px",
    minHeight: "32px",
    color: "#ffffff",
    "&.Mui-selected": {
      ...glassStyles.gradientButton,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
    },
  },
  iconButton: {
    ...glassStyles.button,
    width: "40px",
    height: "40px",
    color: "#ffffff",
    transition: "all 0.3s ease-in-out",
  },
  activeIconButton: {
    ...glassStyles.gradientButton,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    margin: "0 12px",
    height: "40px",
  },
  snapControls: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "8px",
  },
  switchLabel: {
    fontSize: "12px",
    margin: 0,
    color: "#ffffff",
    "& .MuiFormControlLabel-label": {
      fontSize: "12px",
      fontWeight: 500,
    },
  },
  switch: {
    "& .MuiSwitch-thumb": {
      background: "#ffffff",
    },
    "& .MuiSwitch-track": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    "& .Mui-checked .MuiSwitch-thumb": {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    "& .Mui-checked + .MuiSwitch-track": {
      backgroundColor: "rgba(102, 126, 234, 0.3)",
    },
  },
  textField: {
    width: "80px",
    "& .MuiOutlinedInput-root": {
      ...glassStyles.button,
      height: "32px",
      "& input": {
        color: "#ffffff",
        textAlign: "center",
        fontSize: "12px",
      },
    },
  },
};

export default EditorToolbar;

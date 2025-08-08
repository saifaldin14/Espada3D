import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setActiveTool,
  setEditMode,
  setSnap,
  setSnapSize,
  setGrid,
  toggleHierarchyPanel,
  toggleAnimationPanel,
  toggleNodeEditor,
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
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Paper,
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
  Edit,
  ViewInAr,
  Extension,
  Texture,
  Animation,
  Category,
  Layers,
  Menu as MenuIcon,
  ArrowDropDown,
  MoreVert,
  Dashboard,
  TuneRounded,
  FileCopy,
  History,
  LayersClear,
  Settings as SettingsIcon,
  CameraAlt,
  DeveloperMode,
  CloudUpload,
  CloudDownload,
  Help,
  KeyboardArrowRight,
  RadioButtonChecked,
  AccountCircle,
} from "@mui/icons-material";
import { ToolType, EditMode } from "../../types";
import { glassStyles } from "../../config/theme";
import { EditModes } from "../../Enums";

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
  const isNodeEditorOpen = useSelector(
    (state: any) => state.ui.isNodeEditorOpen
  );
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const selectedModelIds = useSelector(
    (state: any) => state.models.selectedModelIds
  );
  const historyIndex = useSelector((state: any) => state.models.historyIndex);
  const historySteps = useSelector((state: any) => state.models.history.length);

  const dispatch = useDispatch();

  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState<null | HTMLElement>(
    null
  );

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

  const openMainMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMainMenuAnchor(event.currentTarget);
  };

  const closeMainMenu = () => {
    setMainMenuAnchor(null);
  };

  const openViewMenu = (event: React.MouseEvent<HTMLElement>) => {
    setViewMenuAnchor(event.currentTarget);
  };

  const closeViewMenu = () => {
    setViewMenuAnchor(null);
  };

  const openToolsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setToolsMenuAnchor(event.currentTarget);
  };

  const closeToolsMenu = () => {
    setToolsMenuAnchor(null);
  };

  return (
    <Box sx={styles.toolbar} className="fade-in">
      {/* Left Section - Logo and Main Menu */}
      <Box sx={styles.toolbarSection}>
        <IconButton onClick={openMainMenu} sx={styles.menuButton}>
          <MenuIcon />
        </IconButton>

        <Badge
          badgeContent="SE"
          color="secondary"
          sx={styles.logo}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <ViewInAr sx={{ fontSize: 24, color: "#00c9ff" }} />
        </Badge>
      </Box>

      <Divider orientation="vertical" flexItem sx={styles.divider} />

      {/* Transform Tools - Enhanced with labels */}
      <Box sx={styles.toolbarSection}>
        <ToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={handleToolChange}
          size="small"
          sx={styles.toggleGroupMain}
          aria-label="Transform Tools"
        >
          <ToggleButton value="select" sx={styles.mainToggleButton}>
            <Tooltip title="Select (A)">
              <Box sx={styles.buttonContent}>
                <CenterFocusStrong fontSize="small" />
                <Typography variant="caption" sx={styles.buttonLabel}>
                  Select
                </Typography>
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="translate" sx={styles.mainToggleButton}>
            <Tooltip title="Move (G)">
              <Box sx={styles.buttonContent}>
                <OpenWith fontSize="small" />
                <Typography variant="caption" sx={styles.buttonLabel}>
                  Move
                </Typography>
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="rotate" sx={styles.mainToggleButton}>
            <Tooltip title="Rotate (R)">
              <Box sx={styles.buttonContent}>
                <RotateRight fontSize="small" />
                <Typography variant="caption" sx={styles.buttonLabel}>
                  Rotate
                </Typography>
              </Box>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="scale" sx={styles.mainToggleButton}>
            <Tooltip title="Scale (S)">
              <Box sx={styles.buttonContent}>
                <ZoomOutMap fontSize="small" />
                <Typography variant="caption" sx={styles.buttonLabel}>
                  Scale
                </Typography>
              </Box>
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider orientation="vertical" flexItem sx={styles.divider} />

      {/* History Controls */}
      <Box sx={styles.toolbarSection}>
        <Box sx={styles.buttonGroupWithLabel}>
          <Typography variant="caption" sx={styles.sectionTitle}>
            History
          </Typography>
          <Box sx={styles.buttonGroup}>
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton
                  size="small"
                  onClick={() => dispatch(undo())}
                  sx={styles.iconButton}
                  className="hover-lift"
                  disabled={historyIndex <= 0}
                >
                  <Undo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton
                  size="small"
                  onClick={() => dispatch(redo())}
                  sx={styles.iconButton}
                  className="hover-lift"
                  disabled={historyIndex >= historySteps - 1}
                >
                  <Redo fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Edit Actions */}
      <Box sx={styles.toolbarSection}>
        <Box sx={styles.buttonGroupWithLabel}>
          <Typography variant="caption" sx={styles.sectionTitle}>
            Edit
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
      </Box>

      <Divider orientation="vertical" flexItem sx={styles.divider} />

      {/* Edit Mode Tabs - When model is selected */}
      {selectedModelId && (
        <>
          <Box sx={styles.toolbarSection}>
            <Box sx={styles.buttonGroupWithLabel}>
              <Typography variant="caption" sx={styles.sectionTitle}>
                Edit Mode
              </Typography>
              <ToggleButtonGroup
                value={editMode}
                exclusive
                onChange={handleEditModeChange}
                size="small"
                sx={styles.toggleGroup}
              >
                <ToggleButton value={EditModes.model} sx={styles.toggleButton}>
                  <Tooltip title="Object Mode">
                    <ViewInAr fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton
                  value={EditModes.material}
                  sx={styles.toggleButton}
                >
                  <Tooltip title="Material Mode">
                    <Texture fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value={EditModes.vertex} sx={styles.toggleButton}>
                  <Tooltip title="Mesh Edit">
                    <Category fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton
                  value={EditModes.animation}
                  sx={styles.toggleButton}
                >
                  <Tooltip title="Animation">
                    <Animation fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          <Divider orientation="vertical" flexItem sx={styles.divider} />
        </>
      )}

      {/* Grid & Snap Settings */}
      <Box sx={styles.toolbarSection}>
        <Box sx={styles.buttonGroupWithLabel}>
          <Typography variant="caption" sx={styles.sectionTitle}>
            Grid
          </Typography>
          <Box sx={styles.buttonGroup}>
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

            <Tooltip title="Grid Snap">
              <Box sx={{ position: "relative" }}>
                <IconButton
                  size="small"
                  sx={{
                    ...styles.iconButton,
                    ...(snap ? styles.activeIconButton : {}),
                  }}
                  onClick={(_: any) => dispatch(setSnap(!snap))}
                  className="hover-lift"
                >
                  {snap ? (
                    <CenterFocusStrong fontSize="small" />
                  ) : (
                    <RadioButtonChecked fontSize="small" />
                  )}
                </IconButton>
                {snap && (
                  <TextField
                    size="small"
                    type="number"
                    value={snapSize}
                    onChange={(e) =>
                      dispatch(setSnapSize(parseFloat(e.target.value) || 0.5))
                    }
                    sx={styles.snapTextField}
                    inputProps={{ min: 0.1, max: 5, step: 0.1 }}
                  />
                )}
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Right Side Controls */}
      <Box
        sx={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Panels Toggle */}
        <Box sx={styles.toolbarSection}>
          <Box sx={styles.buttonGroupWithLabel}>
            <Typography variant="caption" sx={styles.sectionTitle}>
              Panels
            </Typography>
            <Box sx={styles.buttonGroup}>
              <Tooltip title="Hierarchy Panel">
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
              <Tooltip title="Animation Panel">
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
              <Tooltip title="Node Editor">
                <IconButton
                  size="small"
                  onClick={() => dispatch(toggleNodeEditor())}
                  sx={{
                    ...styles.iconButton,
                    ...(isNodeEditorOpen ? styles.activeIconButton : {}),
                  }}
                  className="hover-lift"
                >
                  <AccountCircle fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem sx={styles.divider} />

        {/* View Menu Button */}
        <Tooltip title="View Options">
          <IconButton onClick={openViewMenu} sx={styles.menuIconButton}>
            <CameraAlt fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Tools Menu Button */}
        <Tooltip title="Tools">
          <IconButton onClick={openToolsMenu} sx={styles.menuIconButton}>
            <TuneRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Menu */}
      <Menu
        anchorEl={mainMenuAnchor}
        open={Boolean(mainMenuAnchor)}
        onClose={closeMainMenu}
        PaperProps={{
          sx: styles.menuPaper,
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        <MenuItem onClick={closeMainMenu}>
          <ListItemIcon>
            <Dashboard fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </MenuItem>
        <MenuItem onClick={closeMainMenu}>
          <ListItemIcon>
            <CloudUpload fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Import Model" />
        </MenuItem>
        <MenuItem onClick={closeMainMenu}>
          <ListItemIcon>
            <CloudDownload fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export" />
          <KeyboardArrowRight fontSize="small" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={closeMainMenu}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Project History" />
        </MenuItem>
        <MenuItem onClick={closeMainMenu}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={closeMainMenu}>
          <ListItemIcon>
            <Help fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Help" />
        </MenuItem>
      </Menu>

      {/* View Menu */}
      <Menu
        anchorEl={viewMenuAnchor}
        open={Boolean(viewMenuAnchor)}
        onClose={closeViewMenu}
        PaperProps={{
          sx: styles.menuPaper,
        }}
      >
        <MenuItem
          onClick={() => {
            dispatch(setGrid(!showGrid));
            closeViewMenu();
          }}
        >
          <ListItemIcon>
            {showGrid ? (
              <GridOn fontSize="small" />
            ) : (
              <GridOff fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText primary={showGrid ? "Hide Grid" : "Show Grid"} />
        </MenuItem>
        <MenuItem onClick={closeViewMenu}>
          <ListItemIcon>
            <CameraAlt fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Camera Settings" />
        </MenuItem>
        <MenuItem onClick={closeViewMenu}>
          <ListItemIcon>
            <LayersClear fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Toggle Wireframe" />
        </MenuItem>
      </Menu>

      {/* Tools Menu */}
      <Menu
        anchorEl={toolsMenuAnchor}
        open={Boolean(toolsMenuAnchor)}
        onClose={closeToolsMenu}
        PaperProps={{
          sx: styles.menuPaper,
        }}
      >
        <MenuItem onClick={closeToolsMenu}>
          <ListItemIcon>
            <DeveloperMode fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Developer Console" />
        </MenuItem>
        <MenuItem onClick={closeToolsMenu}>
          <ListItemIcon>
            <FileCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Asset Manager" />
        </MenuItem>
        <MenuItem onClick={closeToolsMenu}>
          <ListItemIcon>
            <MoreVert fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="More Options" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

const styles = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    ...glassStyles.panel,
    margin: "12px 12px 8px 12px",
    borderRadius: "16px",
    minHeight: "68px",
    position: "relative",
    zIndex: 5,
    gap: "12px",
  },
  toolbarSection: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    "& .MuiBadge-badge": {
      backgroundColor: "#43e97b",
      color: "#000",
      fontWeight: 700,
      fontSize: "0.65rem",
      padding: "0 4px",
      minWidth: "16px",
      height: "16px",
    },
  },
  menuButton: {
    mr: 1,
    color: "rgba(255, 255, 255, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  menuIconButton: {
    color: "rgba(255, 255, 255, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  menuPaper: {
    backgroundColor: "rgba(30, 40, 50, 0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    "& .MuiMenuItem-root": {
      color: "rgba(255, 255, 255, 0.9)",
      padding: "8px 16px",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
      },
      "& .MuiListItemIcon-root": {
        color: "rgba(255, 255, 255, 0.7)",
        minWidth: "36px",
      },
    },
    "& .MuiDivider-root": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      margin: "4px 0",
    },
  },
  buttonGroupWithLabel: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
  },
  sectionTitle: {
    fontSize: "10px",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    fontWeight: 600,
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  buttonGroup: {
    display: "flex",
    gap: "4px",
  },
  toggleGroup: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    padding: "2px",
    "& .MuiToggleButtonGroup-grouped": {
      margin: 0,
      border: "none",
      borderRadius: "6px !important",
      "&:not(:first-of-type)": {
        borderLeft: "none",
      },
    },
  },
  toggleGroupMain: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    padding: "2px",
    "& .MuiToggleButtonGroup-grouped": {
      margin: 0,
      border: "none",
      borderRadius: "8px !important",
      "&:not(:first-of-type)": {
        borderLeft: "none",
        marginLeft: "2px",
      },
    },
  },
  toggleButton: {
    minWidth: "36px",
    minHeight: "36px",
    padding: "6px",
    color: "rgba(255, 255, 255, 0.7)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: "#ffffff",
    },
    "&.Mui-selected": {
      background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
      color: "rgba(0, 0, 0, 0.8)",
      fontWeight: 600,
    },
  },
  mainToggleButton: {
    minWidth: "50px",
    minHeight: "50px",
    padding: "6px 10px",
    color: "rgba(255, 255, 255, 0.7)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: "#ffffff",
    },
    "&.Mui-selected": {
      background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
      color: "rgba(0, 0, 0, 0.8)",
      fontWeight: 600,
      boxShadow: "0 4px 8px rgba(0, 201, 255, 0.2)",
      "& .MuiTypography-root": {
        color: "rgba(0, 0, 0, 0.7)",
      },
    },
  },
  buttonContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  buttonLabel: {
    fontSize: "10px",
    textTransform: "none",
    fontWeight: 600,
  },
  editModeButton: {
    minWidth: "32px",
    minHeight: "32px",
    padding: "4px",
    color: "rgba(255, 255, 255, 0.7)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: "#ffffff",
    },
    "&.Mui-selected": {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      fontWeight: 600,
    },
  },
  iconButton: {
    width: "36px",
    height: "36px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "6px",
    color: "rgba(255, 255, 255, 0.7)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: "#ffffff",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
    "&:disabled": {
      opacity: 0.4,
      color: "rgba(255, 255, 255, 0.3)",
    },
  },
  activeIconButton: {
    background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    color: "rgba(0, 0, 0, 0.8)",
    border: "none",
    boxShadow: "0 2px 8px rgba(0, 201, 255, 0.3)",
    "&:hover": {
      background: "linear-gradient(135deg, #00b8e6 0%, #7de68a 100%)",
      color: "rgba(0, 0, 0, 0.9)",
    },
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    margin: "0 4px",
    height: "36px",
  },
  snapTextField: {
    position: "absolute",
    top: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "60px",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: "4px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    zIndex: 10,
    "& .MuiOutlinedInput-input": {
      padding: "6px 8px",
      fontSize: "12px",
      textAlign: "center",
      color: "#ffffff",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
};

export default EditorToolbar;

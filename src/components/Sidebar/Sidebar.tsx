import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectModel,
  removeModel,
  duplicateModel,
} from "../../store/slices/modelSlice";
import {
  setActiveTool,
  setGrid,
  setWireframe,
} from "../../store/slices/uiSlice";
import {
  FaArrowsAlt,
  FaSyncAlt,
  FaPlus,
  FaTrashAlt,
  FaCopy,
  FaCube,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FaArrowsLeftRight } from "react-icons/fa6";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Divider,
  FormGroup,
  FormControlLabel,
  Switch,
  FormLabel,
  Button,
  Tooltip,
  Chip,
  Avatar,
  Stack,
  Badge,
} from "@mui/material";
import CreateModelModal from "./CreateModelModal";
import { glassStyles } from "../../config/theme";

const Sidebar: React.FC = () => {
  const models = useSelector((state: any) => state.models.models);
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);

  const handleModelSelect = (id: string) => {
    dispatch(selectModel(id));
  };

  const handleToolSelect = (tool: "translate" | "rotate" | "scale") => {
    dispatch(setActiveTool(tool));
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleGridChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setGrid(event.target.checked));
  };

  const handleWireframeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    dispatch(setWireframe(event.target.checked));
  };

  const handleModelRemove = (id: string) => {
    dispatch(removeModel(id));
  };

  const handleModelDuplicate = (id: string) => {
    dispatch(duplicateModel(id));
  };

  return (
    <Box sx={styles.sidebar} className="slide-in-left">
      {/* Header */}
      <Box sx={styles.header}>
        <Typography variant="h5" sx={styles.headerTitle}>
          SaifEngine
        </Typography>
        <Chip label="v1.0" size="small" sx={styles.versionChip} />
      </Box>

      <Divider sx={styles.divider} />

      {/* Quick Actions */}
      <Box sx={styles.section}>
        <Typography variant="h6" sx={styles.sectionTitle}>
          Quick Actions
        </Typography>
        <Button
          variant="contained"
          startIcon={<FaPlus />}
          onClick={() => setModalOpen(true)}
          sx={styles.createButton}
          className="hover-lift"
          fullWidth
        >
          Create Model
        </Button>
      </Box>

      {/* Models List */}
      <Box sx={styles.section}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" sx={styles.sectionTitle}>
            Models
          </Typography>
          <Badge badgeContent={models.length} color="primary">
            <FaCube size={20} />
          </Badge>
        </Stack>

        <Box sx={styles.modelList}>
          {models.length === 0 ? (
            <Box sx={styles.emptyState}>
              <FaCube size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
              <Typography variant="body2" sx={styles.emptyText}>
                No models yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ padding: 0 }}>
              {models.map((model: any, index: number) => (
                <ListItem
                  key={model.id}
                  disablePadding
                  sx={{
                    ...styles.modelItem,
                    ...(model.id === selectedModelId
                      ? styles.selectedModelItem
                      : {}),
                  }}
                  className="fade-in hover-lift"
                >
                  <ListItemButton
                    onClick={() => handleModelSelect(model.id)}
                    sx={styles.modelItemButton}
                  >
                    <Avatar sx={styles.modelAvatar}>
                      <FaCube />
                    </Avatar>
                    <ListItemText
                      primary={`Model ${index + 1}`}
                      secondary={model.type || "Standard"}
                      sx={styles.modelItemText}
                    />
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title={model.visible ? "Visible" : "Hidden"}>
                        <IconButton size="small" sx={styles.miniButton}>
                          {model.visible ? (
                            <FaEye size={12} />
                          ) : (
                            <FaEyeSlash size={12} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* Tools */}
      <Box sx={styles.section}>
        <Typography variant="h6" sx={styles.sectionTitle}>
          Transform Tools
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Tooltip title="Translate">
            <IconButton
              sx={{
                ...styles.toolButton,
                ...(activeTool === "translate" ? styles.activeToolButton : {}),
              }}
              onClick={() => handleToolSelect("translate")}
              className="hover-lift"
            >
              <FaArrowsAlt />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate">
            <IconButton
              sx={{
                ...styles.toolButton,
                ...(activeTool === "rotate" ? styles.activeToolButton : {}),
              }}
              onClick={() => handleToolSelect("rotate")}
              className="hover-lift"
            >
              <FaSyncAlt />
            </IconButton>
          </Tooltip>
          <Tooltip title="Scale">
            <IconButton
              sx={{
                ...styles.toolButton,
                ...(activeTool === "scale" ? styles.activeToolButton : {}),
              }}
              onClick={() => handleToolSelect("scale")}
              className="hover-lift"
            >
              <FaArrowsLeftRight />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Model Actions */}
        {selectedModelId && (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Delete Model">
              <IconButton
                sx={styles.actionButton}
                onClick={() => handleModelRemove(selectedModelId)}
                className="hover-lift"
              >
                <FaTrashAlt />
              </IconButton>
            </Tooltip>
            <Tooltip title="Duplicate Model">
              <IconButton
                sx={styles.actionButton}
                onClick={() => handleModelDuplicate(selectedModelId)}
                className="hover-lift"
              >
                <FaCopy />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* Settings */}
      <Box sx={styles.section}>
        <Typography variant="h6" sx={styles.sectionTitle}>
          Viewport Settings
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={useSelector((state: any) => state.ui.showGrid)}
                onChange={(e) => dispatch(setGrid(e.target.checked))}
                size="small"
              />
            }
            label="Show Grid"
            sx={styles.switchControl}
          />
          <FormControlLabel
            control={
              <Switch
                checked={useSelector((state: any) => state.ui.wireframe)}
                onChange={(e) => dispatch(setWireframe(e.target.checked))}
                size="small"
              />
            }
            label="Wireframe"
            sx={styles.switchControl}
          />
        </FormGroup>
      </Box>

      <CreateModelModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Box>
  );
};

const styles = {
  sidebar: {
    width: "320px",
    height: "100vh",
    ...glassStyles.panel,
    display: "flex",
    flexDirection: "column" as "column",
    padding: "24px",
    margin: "16px",
    marginRight: "8px",
    borderRadius: "20px",
    position: "relative",
    overflow: "hidden",
    zIndex: 10,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  headerTitle: {
    fontWeight: 700,
    background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  versionChip: {
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.75rem",
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: "24px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    marginBottom: "16px",
    fontWeight: 600,
    color: "#ffffff",
    fontSize: "1rem",
  },
  createButton: {
    ...glassStyles.gradientButton,
    height: "48px",
    fontWeight: 600,
    fontSize: "0.875rem",
    textTransform: "none",
    "&:hover": {
      ...glassStyles.gradientButton["&:hover"],
    },
  },
  modelList: {
    maxHeight: "240px",
    overflowY: "auto" as "auto",
    paddingRight: "8px",
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "2px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.3)",
      borderRadius: "2px",
    },
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    textAlign: "center" as "center",
    color: "rgba(255, 255, 255, 0.6)",
  },
  emptyText: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.6)",
  },
  modelItem: {
    marginBottom: "8px",
    ...glassStyles.button,
    transition: "all 0.3s ease-in-out",
  },
  selectedModelItem: {
    ...glassStyles.gradientButton,
    background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    boxShadow: "0 4px 15px rgba(0, 201, 255, 0.3)",
  },
  modelItemButton: {
    padding: "12px 16px",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  modelAvatar: {
    width: 32,
    height: 32,
    marginRight: "12px",
    background: "linear-gradient(135deg, #485563 0%, #29323c 100%)",
    fontSize: "14px",
  },
  modelItemText: {
    "& .MuiListItemText-primary": {
      color: "#ffffff",
      fontWeight: 600,
      fontSize: "0.875rem",
    },
    "& .MuiListItemText-secondary": {
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: "0.75rem",
    },
  },
  miniButton: {
    ...glassStyles.button,
    minWidth: "24px",
    minHeight: "24px",
    width: "24px",
    height: "24px",
    color: "rgba(255, 255, 255, 0.8)",
  },
  toolButton: {
    ...glassStyles.button,
    width: "48px",
    height: "48px",
    color: "#ffffff",
    fontSize: "18px",
    flex: 1,
  },
  activeToolButton: {
    ...glassStyles.gradientButton,
    background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    boxShadow: "0 4px 15px rgba(0, 201, 255, 0.3)",
  },
  actionButton: {
    ...glassStyles.button,
    width: "48px",
    height: "48px",
    color: "#ffffff",
    fontSize: "16px",
    "&:hover": {
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "#ffffff",
    },
  },
  switchControl: {
    margin: "4px 0",
    color: "#ffffff",
    "& .MuiFormControlLabel-label": {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    "& .MuiSwitch-thumb": {
      background: "#ffffff",
    },
    "& .MuiSwitch-track": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    "& .Mui-checked .MuiSwitch-thumb": {
      background: "linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)",
    },
    "& .Mui-checked + .MuiSwitch-track": {
      backgroundColor: "rgba(0, 201, 255, 0.3)",
    },
  },
};

export default Sidebar;

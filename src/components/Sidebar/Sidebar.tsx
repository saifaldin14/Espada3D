import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectModel,
  updateModelMetadata,
} from "../../store/slices/modelSlice";
import { setGrid, setWireframe } from "../../store/slices/uiSlice";
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
  Button,
  Tooltip,
  Chip,
  Avatar,
  Stack,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility,
  VisibilityOff,
  GridOn,
  GridOff,
  Palette,
  Category,
} from "@mui/icons-material";
import CreateModelModal from "./CreateModelModal";
import { glassStyles } from "../../config/theme";

const Sidebar: React.FC = () => {
  const models = useSelector((state: any) => state.models.models);
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const showGrid = useSelector((state: any) => state.ui.showGrid);
  const showWireframe = useSelector((state: any) => state.ui.showWireframe);
  const dispatch = useDispatch();

  const [modalOpen, setModalOpen] = useState(false);

  const handleModelSelect = (id: string) => {
    dispatch(selectModel(id));
  };

  const toggleVisibility = (id: string, visible: boolean) => {
    dispatch(updateModelMetadata({ id, visible: !visible }));
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
        <Typography variant="subtitle1" sx={styles.sectionTitle}>
          Quick Actions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
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
          <Typography variant="subtitle1" sx={styles.sectionTitle}>
            Models
          </Typography>
          <Badge
            badgeContent={models.length}
            color="primary"
            sx={styles.modelsBadge}
          >
            <Category sx={{ fontSize: 20 }} />
          </Badge>
        </Stack>

        <Box sx={styles.modelList}>
          {models.length === 0 ? (
            <Box sx={styles.emptyState}>
              <Category
                style={{ opacity: 0.5, marginBottom: 8, fontSize: 32 }}
              />
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
                    <Avatar
                      sx={{
                        ...styles.modelAvatar,
                        bgcolor: model.material?.color || "#485563",
                      }}
                    >
                      <Category fontSize="small" />
                    </Avatar>
                    <ListItemText
                      primary={model.name || `Model ${index + 1}`}
                      secondary={model.type || "Standard"}
                      sx={styles.modelItemText}
                    />
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title={model.visible ? "Visible" : "Hidden"}>
                        <IconButton
                          size="small"
                          sx={styles.miniButton}
                          onClick={(e: any) => {
                            e.stopPropagation();
                            toggleVisibility(model.id, model.visible);
                          }}
                        >
                          {model.visible ? (
                            <Visibility sx={{ fontSize: 16 }} />
                          ) : (
                            <VisibilityOff sx={{ fontSize: 16 }} />
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

      {/* Settings */}
      <Box sx={styles.section}>
        <Typography variant="subtitle1" sx={styles.sectionTitle}>
          Viewport Settings
        </Typography>
        <FormGroup sx={styles.settingsGroup}>
          <FormControlLabel
            control={
              <Switch
                checked={showGrid}
                onChange={(e) => dispatch(setGrid(e.target.checked))}
                size="small"
                icon={<GridOff fontSize="small" />}
                checkedIcon={<GridOn fontSize="small" />}
              />
            }
            label="Show Grid"
            sx={styles.switchControl}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showWireframe}
                onChange={(e) => dispatch(setWireframe(e.target.checked))}
                size="small"
                icon={<Palette fontSize="small" />}
                checkedIcon={<Palette fontSize="small" />}
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
    width: "100%",
    height: "100vh",
    ...glassStyles.panel,
    display: "flex",
    flexDirection: "column" as "column",
    padding: "20px",
    margin: 0,
    borderRadius: 0,
    position: "relative",
    overflow: "auto",
    zIndex: 10,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
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
    color: "rgba(0, 0, 0, 0.8)",
    fontWeight: 600,
    fontSize: "0.75rem",
  },
  divider: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: "20px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    marginBottom: "12px",
    fontWeight: 600,
    color: "#ffffff",
    fontSize: "1rem",
    letterSpacing: "0.3px",
  },
  createButton: {
    ...glassStyles.gradientButton,
    height: "44px",
    fontWeight: 600,
    fontSize: "0.875rem",
    textTransform: "none",
    borderRadius: "8px",
    "&:hover": {
      ...glassStyles.gradientButton["&:hover"],
    },
  },
  modelList: {
    maxHeight: "240px",
    overflowY: "auto" as "auto",
    paddingRight: "4px",
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
  modelsBadge: {
    "& .MuiBadge-badge": {
      backgroundColor: "#43e97b",
      color: "rgba(0, 0, 0, 0.8)",
      fontWeight: 600,
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
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "8px",
    border: "1px dashed rgba(255, 255, 255, 0.15)",
  },
  emptyText: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.6)",
  },
  modelItem: {
    marginBottom: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.06)",
    },
  },
  selectedModelItem: {
    background:
      "linear-gradient(135deg, rgba(0, 201, 255, 0.2) 0%, rgba(146, 254, 157, 0.2) 100%)",
    borderColor: "rgba(0, 201, 255, 0.4)",
    boxShadow: "0 4px 12px rgba(0, 201, 255, 0.15)",
    "&:hover": {
      background:
        "linear-gradient(135deg, rgba(0, 201, 255, 0.25) 0%, rgba(146, 254, 157, 0.25) 100%)",
    },
  },
  modelItemButton: {
    padding: "10px 12px",
    borderRadius: "6px",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  modelAvatar: {
    width: 32,
    height: 32,
    marginRight: "12px",
    fontSize: "14px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    minWidth: "28px",
    minHeight: "28px",
    width: "28px",
    height: "28px",
    color: "rgba(255, 255, 255, 0.8)",
    borderRadius: "6px",
    padding: 0,
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
  settingsGroup: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "8px",
    padding: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  switchControl: {
    margin: "4px 0",
    "& .MuiFormControlLabel-label": {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    "& .MuiSwitch-thumb": {
      backgroundColor: "#ffffff",
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

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectModel,
  updateModelHierarchy,
  groupModels,
  ungroupModels,
  selectMultipleModels,
  toggleModelSelection,
  updateModelMetadata,
} from "../../store/slices/modelSlice";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
} from "@mui/material";
import {
  ExpandMore,
  ChevronRight,
  MoreVert,
  GroupWork,
  Group,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  Folder,
  FolderOpen,
} from "@mui/icons-material";
import { ModelMetadata } from "../../types";
import { glassStyles } from "../../config/theme";

interface HierarchyPanelProps {
  isOpen: boolean;
}

const HierarchyPanel: React.FC<HierarchyPanelProps> = ({ isOpen }) => {
  const models = useSelector((state: any) => state.models.models);
  const selectedModelIds = useSelector(
    (state: any) => state.models.selectedModelIds
  );
  const dispatch = useDispatch();

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    modelId: string;
  } | null>(null);
  const [groupDialog, setGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const rootModels = models.filter((model: ModelMetadata) => !model.parentId);

  const handleContextMenu = (event: React.MouseEvent, modelId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      modelId,
    });
  };

  const handleContextClose = () => {
    setContextMenu(null);
  };

  const handleModelSelect = (modelId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      dispatch(toggleModelSelection(modelId));
    } else {
      dispatch(selectModel(modelId));
    }
  };

  const handleGroup = () => {
    if (selectedModelIds.length > 1) {
      setGroupDialog(true);
    }
    handleContextClose();
  };

  const handleUngroup = () => {
    if (contextMenu) {
      dispatch(ungroupModels(contextMenu.modelId));
    }
    handleContextClose();
  };

  const handleCreateGroup = () => {
    if (groupName && selectedModelIds.length > 1) {
      dispatch(groupModels({ modelIds: selectedModelIds, groupName }));
      setGroupDialog(false);
      setGroupName("");
    }
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderModelItem = (model: ModelMetadata, depth: number = 0) => {
    const children = models.filter(
      (m: ModelMetadata) => m.parentId === model.id
    );
    const isSelected = selectedModelIds.includes(model.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(model.id);

    return (
      <Box key={model.id}>
        <ListItem
          sx={{
            paddingLeft: `${depth * 20 + 16}px`,
            paddingY: "4px",
            backgroundColor: isSelected
              ? "rgba(0, 255, 255, 0.15)"
              : "transparent",
            borderRadius: "8px",
            marginBottom: "2px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isSelected
                ? "rgba(0, 255, 255, 0.2)"
                : "rgba(255, 255, 255, 0.08)",
            },
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => toggleExpanded(model.id)}
              sx={{
                marginRight: 1,
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#00ffff",
                },
              }}
            >
              {isExpanded ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          )}

          <Checkbox
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              dispatch(toggleModelSelection(model.id));
            }}
            size="small"
            sx={{
              marginRight: 1,
              color: "rgba(255, 255, 255, 0.7)",
              "&.Mui-checked": {
                color: "#00ffff",
              },
            }}
          />

          <ListItemIcon sx={{ minWidth: "auto", marginRight: 1 }}>
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen fontSize="small" sx={{ color: "#00cc99" }} />
              ) : (
                <Folder
                  fontSize="small"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                />
              )
            ) : (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: model.material.color,
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 8px rgba(0, 0, 0, 0.3)",
                }}
              />
            )}
          </ListItemIcon>

          <ListItemText
            primary={model.name}
            onClick={(e) => handleModelSelect(model.id, e)}
            sx={{
              cursor: "pointer",
              flexGrow: 1,
              "& .MuiListItemText-primary": {
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: isSelected ? 600 : 400,
              },
            }}
          />

          <IconButton
            size="small"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              dispatch(
                updateModelMetadata({
                  id: model.id,
                  visible: !model.visible,
                })
              );
            }}
            sx={{
              color: model.visible ? "#00ff88" : "rgba(255, 255, 255, 0.3)",
              "&:hover": {
                background: "rgba(0, 255, 136, 0.1)",
              },
            }}
          >
            {model.visible ? (
              <Visibility fontSize="small" />
            ) : (
              <VisibilityOff fontSize="small" />
            )}
          </IconButton>

          <IconButton
            size="small"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              dispatch(
                updateModelMetadata({
                  id: model.id,
                  locked: !model.locked,
                })
              );
            }}
            sx={{
              color: model.locked ? "#ffaa00" : "rgba(255, 255, 255, 0.3)",
              "&:hover": {
                background: "rgba(255, 170, 0, 0.1)",
              },
            }}
          >
            {model.locked ? (
              <Lock fontSize="small" />
            ) : (
              <LockOpen fontSize="small" />
            )}
          </IconButton>

          <IconButton
            size="small"
            onClick={(e: React.MouseEvent) => handleContextMenu(e, model.id)}
            sx={{
              color: "rgba(255, 255, 255, 0.5)",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
              },
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            {children.map((child: ModelMetadata) =>
              renderModelItem(child, depth + 1)
            )}
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box sx={styles.panel}>
      <Box sx={styles.header}>
        <Typography variant="h6" sx={styles.title}>
          🏗️ Scene Hierarchy
        </Typography>
        <Box sx={styles.headerActions}>
          <IconButton
            size="small"
            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            onClick={() => setExpandedNodes(new Set())}
          >
            <Box component="span" sx={{ fontSize: "14px" }}>
              📁
            </Box>
          </IconButton>
          <IconButton size="small" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
            <Box component="span" sx={{ fontSize: "14px" }}>
              ⚙️
            </Box>
          </IconButton>
        </Box>
      </Box>

      <Box sx={styles.toolbar}>
        <Button
          size="small"
          startIcon={<GroupWork />}
          onClick={handleGroup}
          disabled={selectedModelIds.length < 2}
          sx={styles.toolbarButton}
        >
          Group
        </Button>
        <Typography variant="caption" sx={styles.objectCount}>
          {models.length} objects
        </Typography>
      </Box>

      <List sx={styles.list}>
        {rootModels.length === 0 ? (
          <Box sx={styles.emptyState}>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              No objects in scene
            </Typography>
          </Box>
        ) : (
          rootModels.map((model: ModelMetadata) => renderModelItem(model))
        )}
      </List>

      <Menu
        open={contextMenu !== null}
        onClose={handleContextClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            background: "rgba(10, 15, 25, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            "& .MuiMenuItem-root": {
              color: "#ffffff",
              "&:hover": {
                background: "rgba(0, 255, 255, 0.1)",
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleGroup} disabled={selectedModelIds.length < 2}>
          <GroupWork sx={{ marginRight: 1, color: "#00ffff" }} />
          Group Selected
        </MenuItem>
        <MenuItem onClick={handleUngroup}>
          <Group sx={{ marginRight: 1, color: "#00ffff" }} />
          Ungroup
        </MenuItem>
      </Menu>

      <Dialog
        open={groupDialog}
        onClose={() => setGroupDialog(false)}
        PaperProps={{
          sx: {
            background: "rgba(10, 15, 25, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          Create Group
        </DialogTitle>
        <DialogContent sx={{ padding: "20px" }}>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#ffffff",
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#00ffff",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-focused": {
                  color: "#00ffff",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ padding: "16px 20px" }}>
          <Button
            onClick={() => setGroupDialog(false)}
            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #00ffff 0%, #00cc99 100%)",
              color: "#000000",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #00cccc 0%, #00aa77 100%)",
              },
            }}
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
    width: "320px",
    maxHeight: "600px",
    minHeight: "400px",
    background: "rgba(10, 15, 25, 0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(0, 0, 0, 0.2)",
  },
  title: {
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "1.1rem",
    letterSpacing: "0.5px",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "4px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  toolbarButton: {
    background: "linear-gradient(135deg, #00ffff 0%, #00cc99 100%)",
    color: "#000000",
    fontWeight: 600,
    fontSize: "0.75rem",
    "&:hover": {
      background: "linear-gradient(135deg, #00cccc 0%, #00aa77 100%)",
    },
    "&:disabled": {
      background: "rgba(255, 255, 255, 0.1)",
      color: "rgba(255, 255, 255, 0.3)",
    },
  },
  objectCount: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: 500,
  },
  list: {
    padding: "8px",
    overflow: "auto",
    flex: 1,
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(255, 255, 255, 0.05)",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(255, 255, 255, 0.2)",
      borderRadius: "3px",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.3)",
      },
    },
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    textAlign: "center" as const,
  },
};

export default HierarchyPanel;

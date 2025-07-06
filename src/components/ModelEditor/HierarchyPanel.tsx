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
            backgroundColor: isSelected
              ? "rgba(25, 118, 210, 0.12)"
              : "transparent",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => toggleExpanded(model.id)}
              sx={{ marginRight: 1 }}
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
            sx={{ marginRight: 1 }}
          />

          <ListItemIcon sx={{ minWidth: "auto", marginRight: 1 }}>
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen fontSize="small" />
              ) : (
                <Folder fontSize="small" />
              )
            ) : (
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: model.material.color,
                  borderRadius: "50%",
                }}
              />
            )}
          </ListItemIcon>

          <ListItemText
            primary={model.name}
            onClick={(e) => handleModelSelect(model.id, e)}
            sx={{ cursor: "pointer", flexGrow: 1 }}
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
      <Typography variant="h6" sx={styles.title}>
        Hierarchy
      </Typography>

      <Box sx={styles.toolbar}>
        <Button
          size="small"
          startIcon={<GroupWork />}
          onClick={handleGroup}
          disabled={selectedModelIds.length < 2}
        >
          Group
        </Button>
      </Box>

      <List sx={styles.list}>
        {rootModels.map((model: ModelMetadata) => renderModelItem(model))}
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
      >
        <MenuItem onClick={handleGroup} disabled={selectedModelIds.length < 2}>
          <GroupWork sx={{ marginRight: 1 }} />
          Group Selected
        </MenuItem>
        <MenuItem onClick={handleUngroup}>
          <Group sx={{ marginRight: 1 }} />
          Ungroup
        </MenuItem>
      </Menu>

      <Dialog open={groupDialog} onClose={() => setGroupDialog(false)}>
        <DialogTitle>Create Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const styles = {
  panel: {
    width: "300px",
    height: "100vh",
    backgroundColor: "#f5f5f5",
    borderLeft: "1px solid #ddd",
    padding: "16px",
    boxSizing: "border-box" as const,
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
  list: {
    padding: 0,
    overflow: "auto",
    maxHeight: "calc(100vh - 120px)",
  },
};

export default HierarchyPanel;

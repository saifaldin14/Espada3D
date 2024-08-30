import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { createNewModel, selectModel } from "../store/slices/modelSlice";
import { setActiveTool, toggleGrid } from "../store/slices/uiSlice";
import { FaArrowsAlt, FaSyncAlt, FaPlus, FaThLarge } from "react-icons/fa";
import { FaArrowsLeftRight } from "react-icons/fa6";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";

const Sidebar: React.FC = () => {
  const models = useSelector((state: any) => state.models.models);
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const dispatch = useDispatch();

  const handleModelSelect = (id: string) => {
    dispatch(selectModel(id));
  };

  const handleToolSelect = (tool: "translate" | "rotate" | "scale") => {
    dispatch(setActiveTool(tool));
  };

  const handleCreateModel = () => {
    dispatch(createNewModel({ type: "box" }));
  };

  return (
    <Box sx={styles.sidebar}>
      <Typography variant="h5" sx={styles.header}>
        Models
      </Typography>
      <List sx={styles.modelList}>
        {models.map((model: any, index: number) => (
          <ListItem
            key={index}
            disablePadding
            sx={{
              backgroundColor:
                model.id === selectedModelId ? "#1abc9c" : "#34495e",
              borderRadius: 1,
              mb: 1,
              transition: "background-color 0.3s",
            }}
          >
            <ListItemButton
              onClick={() => handleModelSelect(model.id)}
              sx={styles.modelItemButton}
            >
              <ListItemText
                primary={`Model ${index + 1}`}
                sx={styles.modelItemText}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={styles.divider} />
      <Typography variant="h5" sx={styles.header}>
        Controls
      </Typography>
      <Box sx={styles.toolButtons}>
        <IconButton
          sx={{
            ...styles.toolButton,
            backgroundColor: activeTool === "translate" ? "#16a085" : "#1abc9c",
          }}
          onClick={() => handleToolSelect("translate")}
        >
          <FaArrowsAlt />
        </IconButton>
        <IconButton
          sx={{
            ...styles.toolButton,
            backgroundColor: activeTool === "rotate" ? "#16a085" : "#1abc9c",
          }}
          onClick={() => handleToolSelect("rotate")}
        >
          <FaSyncAlt />
        </IconButton>
        <IconButton
          sx={{
            ...styles.toolButton,
            backgroundColor: activeTool === "scale" ? "#16a085" : "#1abc9c",
          }}
          onClick={() => handleToolSelect("scale")}
        >
          <FaArrowsLeftRight />
        </IconButton>
      </Box>
      <Button
        sx={styles.createButton}
        variant="contained"
        startIcon={<FaPlus />}
        onClick={handleCreateModel}
      >
        Create Model
      </Button>
      <Button
        sx={styles.gridButton}
        variant="contained"
        startIcon={<FaThLarge />}
        onClick={() => dispatch(toggleGrid())} // Toggle grid visibility
      >
        Toggle Grid
      </Button>
    </Box>
  );
};

const styles = {
  sidebar: {
    width: "240px",
    background: "#2c3e50",
    color: "#ecf0f1",
    display: "flex",
    flexDirection: "column" as "column",
    padding: 2,
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
  },
  header: {
    marginBottom: 2,
    fontWeight: "bold",
    color: "#ecf0f1",
  },
  divider: {
    marginBottom: 2,
    backgroundColor: "#95a5a6",
  },
  toolButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  toolButton: {
    color: "#ecf0f1",
    transition: "background-color 0.3s",
    width: "30%",
    height: "40px",
    borderRadius: 1,
    "&:hover": {
      backgroundColor: "#16a085",
    },
  },
  createButton: {
    marginTop: 2,
    backgroundColor: "#1abc9c",
    "&:hover": {
      backgroundColor: "#16a085",
    },
  },
  gridButton: {
    marginTop: 2,
    backgroundColor: "#34495e",
    "&:hover": {
      backgroundColor: "#16a085",
    },
  },
  modelList: {
    overflowY: "auto" as "auto",
    marginBottom: 2,
  },
  modelItemButton: {
    padding: "10px",
  },
  modelItemText: {
    color: "#ecf0f1",
  },
};

export default Sidebar;

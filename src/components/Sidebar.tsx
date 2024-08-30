import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectModel } from "../store/slices/modelSlice";
import { setActiveTool, setGrid, setWireframe } from "../store/slices/uiSlice";
import { FaArrowsAlt, FaSyncAlt, FaPlus } from "react-icons/fa";
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
} from "@mui/material";
import CreateModelModal from "./CreateModelModal";

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

  return (
    <Box sx={styles.sidebar}>
      <Typography variant="h5" sx={styles.header}>
        Models
      </Typography>
      <Box sx={styles.scrollContainer}>
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
                "&:hover": {
                  backgroundColor:
                    model.id === selectedModelId ? "#16a085" : "#2c3e50",
                },
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
      </Box>
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
        onClick={handleOpenModal} // Open the modal
      >
        Create Model
      </Button>
      <FormGroup sx={styles.formGroup}>
        <FormLabel sx={styles.formLabel}>Adjust Scene</FormLabel>
        <FormControlLabel
          control={<Switch defaultChecked onChange={handleGridChange} />}
          label="Show Grid"
          sx={styles.switchControl}
        />
        <FormControlLabel
          control={<Switch onChange={handleWireframeChange} />}
          label="Show Wireframes"
          sx={styles.switchControl}
        />
      </FormGroup>
      <CreateModelModal open={modalOpen} onClose={handleCloseModal} />{" "}
    </Box>
  );
};

const styles = {
  sidebar: {
    width: "260px",
    background: "#2c3e50",
    color: "#ecf0f1",
    display: "flex",
    flexDirection: "column" as "column",
    padding: "16px",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
    height: "98vh",
  },
  header: {
    marginBottom: "16px",
    fontWeight: "bold",
    color: "#ecf0f1",
  },
  divider: {
    marginBottom: "16px",
    backgroundColor: "#95a5a6",
  },
  scrollContainer: {
    overflowY: "auto" as "auto",
    flexGrow: 1,
  },
  toolButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  toolButton: {
    color: "#ecf0f1",
    transition: "background-color 0.3s",
    width: "32%",
    height: "48px",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: "#16a085",
    },
  },
  createButton: {
    marginBottom: "16px",
    backgroundColor: "#1abc9c",
    height: "48px",
    "&:hover": {
      backgroundColor: "#16a085",
    },
    borderRadius: "8px",
  },
  formGroup: {
    marginTop: "16px",
  },
  formLabel: {
    color: "#ecf0f1",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  switchControl: {
    marginBottom: "8px",
    color: "#ecf0f1",
  },
  modelList: {
    overflowY: "auto" as "auto",
    marginBottom: "16px",
  },
  modelItemButton: {
    padding: "12px",
    borderRadius: "8px",
  },
  modelItemText: {
    color: "#ecf0f1",
  },
};

export default Sidebar;

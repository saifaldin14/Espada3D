import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setEditMode } from "../../store/slices/uiSlice";
import { Box, Typography, ButtonGroup, Button, Paper } from "@mui/material";
import { Tune } from "@mui/icons-material";
import SubObjectEditor from "./SubObjectEditor";
import MeshOperationsPanel from "./MeshOperationsPanel";
import { EditMode } from "../../types";

interface MeshEditPanelProps {
  modelId: string;
}

const MeshEditPanel: React.FC<MeshEditPanelProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const editMode = useSelector((state: any) => state.ui.editMode);

  const handleMeshModeChange = (mode: EditMode) => {
    dispatch(setEditMode(mode));
  };

  return (
    <Paper elevation={0} sx={styles.section}>
      <Box sx={styles.sectionHeader}>
        <Box sx={styles.sectionHeaderLeft}>
          <Tune sx={styles.sectionIcon} />
          <Typography variant="subtitle1" sx={styles.sectionTitle}>
            Mesh Edit Mode
          </Typography>
        </Box>
      </Box>
      <Box sx={styles.sectionContent}>
        {/* Sub-mode selection for mesh editing */}
        <ButtonGroup fullWidth sx={{ mb: 2 }}>
          <Button
            variant={editMode === "vertex" ? "contained" : "outlined"}
            onClick={() => handleMeshModeChange("vertex")}
            sx={styles.meshModeButton}
          >
            Vertex
          </Button>
          <Button
            variant={editMode === "edge" ? "contained" : "outlined"}
            onClick={() => handleMeshModeChange("edge")}
            sx={styles.meshModeButton}
          >
            Edge
          </Button>
          <Button
            variant={editMode === "face" ? "contained" : "outlined"}
            onClick={() => handleMeshModeChange("face")}
            sx={styles.meshModeButton}
          >
            Face
          </Button>
        </ButtonGroup>

        <SubObjectEditor modelId={modelId} />
        <MeshOperationsPanel modelId={modelId} />
      </Box>
    </Paper>
  );
};

const styles = {
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    marginBottom: "12px",
    overflow: "hidden",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      borderColor: "rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    },
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
    },
  },
  sectionHeaderLeft: {
    display: "flex",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "0.3px",
  },
  sectionIcon: {
    fontSize: "18px",
    marginRight: "10px",
    color: "#00c9ff",
  },
  sectionContent: {
    padding: "16px",
  },
  meshModeButton: {
    fontSize: "0.75rem",
    textTransform: "none" as const,
    padding: "6px 0",
    fontWeight: 500,
    "&.MuiButton-contained": {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
    },
  },
};

export default MeshEditPanel;

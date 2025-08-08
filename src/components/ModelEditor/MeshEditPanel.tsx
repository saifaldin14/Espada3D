import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setEditMode } from "../../store/slices/uiSlice";
import {
  Box,
  Typography,
  ButtonGroup,
  Button,
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Tune, CropFree, LinearScale, Crop } from "@mui/icons-material";
import SubObjectEditor from "./SubObjectEditor";
import MeshOperationsPanel from "./MeshOperationsPanel";
import { EditMode } from "../../types";
import { EditModes } from "../../Enums";

interface MeshEditPanelProps {
  modelId: string;
}

const MeshEditPanel: React.FC<MeshEditPanelProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const editMode = useSelector((state: any) => state.ui.editMode);
  const theme = useTheme();
  const isSmallPanel = useMediaQuery("(max-width:280px)");
  const isVerySmallPanel = useMediaQuery("(max-width:200px)");

  const handleMeshModeChange = (mode: EditMode) => {
    dispatch(setEditMode(mode));
  };

  return (
    <Paper elevation={0} sx={styles.section}>
      <Box sx={styles.sectionHeader}>
        <Box sx={styles.sectionHeaderLeft}>
          <Tune sx={styles.sectionIcon} />
          <Typography variant="subtitle1" sx={styles.sectionTitle} noWrap>
            {isVerySmallPanel ? "Mesh Edit" : "Mesh Edit Mode"}
          </Typography>
        </Box>
      </Box>
      <Box sx={styles.sectionContent}>
        {/* Sub-mode selection for mesh editing */}
        <ButtonGroup
          fullWidth
          orientation={isSmallPanel ? "vertical" : "horizontal"}
          sx={{ mb: isSmallPanel ? 1 : 2 }}
        >
          <Tooltip title="Vertex Mode">
            <Button
              variant={editMode === EditModes.vertex ? "contained" : "outlined"}
              onClick={() => handleMeshModeChange(EditModes.vertex)}
              sx={styles.meshModeButton}
              size={isSmallPanel ? "small" : "medium"}
            >
              {isSmallPanel ? (
                <CropFree sx={styles.buttonIcon} />
              ) : (
                EditModes.vertex
              )}
            </Button>
          </Tooltip>
          <Tooltip title="Edge Mode">
            <Button
              variant={editMode === EditModes.edge ? "contained" : "outlined"}
              onClick={() => handleMeshModeChange(EditModes.edge)}
              sx={styles.meshModeButton}
              size={isSmallPanel ? "small" : "medium"}
            >
              {isSmallPanel ? (
                <LinearScale sx={styles.buttonIcon} />
              ) : (
                EditModes.edge
              )}
            </Button>
          </Tooltip>
          <Tooltip title="Face Mode">
            <Button
              variant={editMode === EditModes.face ? "contained" : "outlined"}
              onClick={() => handleMeshModeChange(EditModes.face)}
              sx={styles.meshModeButton}
              size={isSmallPanel ? "small" : "medium"}
            >
              {isSmallPanel ? <Crop sx={styles.buttonIcon} /> : EditModes.face}
            </Button>
          </Tooltip>
        </ButtonGroup>

        <Box sx={styles.editorContainer}>
          <SubObjectEditor modelId={modelId} />
          <MeshOperationsPanel modelId={modelId} />
        </Box>
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
    padding: "10px 12px",
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
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "#ffffff",
    margin: 0,
    letterSpacing: "0.3px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
  },
  sectionIcon: {
    fontSize: "16px",
    marginRight: "8px",
    flexShrink: 0,
    color: "#00c9ff",
  },
  sectionContent: {
    padding: "10px",
    display: "flex",
    flexDirection: "column" as const,
  },
  meshModeButton: {
    fontSize: "0.75rem",
    textTransform: "none" as const,
    padding: "4px 8px",
    fontWeight: 500,
    minHeight: "28px",
    "&.MuiButton-contained": {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
    },
  },
  buttonIcon: {
    fontSize: "16px",
  },
  editorContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    width: "100%",
    overflow: "hidden",
  },
};

export default MeshEditPanel;

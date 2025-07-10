import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  ButtonGroup,
  Button,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import { CropFree, LinearScale, Crop } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setCurrentSubObjectType } from "../../store/slices/uiSlice";
import {
  initializeMeshData,
  clearMeshData,
} from "../../store/slices/meshSlice";
import { SubObjectType } from "../../types";
import { MeshEditor } from "../../utils/meshEditor";
import VertexEditor from "./VertexEditor";
import EdgeEditor from "./EdgeEditor";
import FaceEditor from "./FaceEditor";
import * as THREE from "three";

interface SubObjectEditorProps {
  modelId: string;
}

const SubObjectEditor: React.FC<SubObjectEditorProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isSmallPanel = useMediaQuery("(max-width:280px)");
  const isVerySmallPanel = useMediaQuery("(max-width:200px)");

  const selectedModel = useSelector((state: RootState) =>
    state.models.models.find((model) => model.id === modelId)
  );
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const meshEditData = useSelector(
    (state: RootState) => state.mesh.meshData[modelId]
  );
  const geometryCache = useSelector(
    (state: RootState) => state.mesh.geometryCache[modelId]
  );
  const editMode = useSelector((state: RootState) => state.ui.editMode);

  useEffect(() => {
    // Initialize mesh edit data when entering sub-object editing mode
    if (
      (editMode === "vertex" || editMode === "edge" || editMode === "face") &&
      !meshEditData &&
      selectedModel &&
      geometryCache
    ) {
      try {
        // Extract real mesh data from cached geometry
        const geometry = createGeometryFromCache(geometryCache);
        const realMeshData = MeshEditor.extractMeshData(geometry, modelId);
        dispatch(initializeMeshData(realMeshData));
      } catch (error) {
        console.warn("Failed to extract mesh data, using fallback:", error);
        // Fallback to mock data if real extraction fails
        const mockMeshData = createMockMeshData(selectedModel.type, modelId);
        dispatch(initializeMeshData(mockMeshData));
      }
    }

    // Clean up mesh edit data when leaving sub-object editing mode
    return () => {
      if (editMode !== "vertex" && editMode !== "edge" && editMode !== "face") {
        dispatch(clearMeshData(modelId));
      }
    };
  }, [editMode, modelId, meshEditData, selectedModel, geometryCache, dispatch]);

  // Synchronize currentSubObjectType with editMode for sub-object editing
  useEffect(() => {
    if (editMode === "vertex" || editMode === "edge" || editMode === "face") {
      if (currentSubObjectType !== editMode) {
        dispatch(setCurrentSubObjectType(editMode));
      }
    }
  }, [editMode, currentSubObjectType, dispatch]);

  const handleSubObjectTypeChange = (type: SubObjectType) => {
    dispatch(setCurrentSubObjectType(type));
  };

  // Helper function to recreate Three.js geometry from cache
  const createGeometryFromCache = (cache: any): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();

    // Set position attribute (convert regular array back to Float32Array)
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(cache.positionArray), 3)
    );

    // Set normal attribute if available
    if (cache.normalArray) {
      geometry.setAttribute(
        "normal",
        new THREE.BufferAttribute(new Float32Array(cache.normalArray), 3)
      );
    }

    // Set UV attribute if available
    if (cache.uvArray) {
      geometry.setAttribute(
        "uv",
        new THREE.BufferAttribute(new Float32Array(cache.uvArray), 2)
      );
    }

    // Set index if available
    if (cache.indexArray) {
      geometry.setIndex(
        new THREE.BufferAttribute(new Uint32Array(cache.indexArray), 1)
      );
    }

    return geometry;
  };

  // Mock mesh data creation (in real implementation, this would extract from Three.js geometry)
  const createMockMeshData = (geometryType: string, modelId: string) => {
    switch (geometryType) {
      case "box":
        return {
          modelId,
          vertices: [
            { index: 0, position: [-0.5, -0.5, -0.5], selected: false },
            { index: 1, position: [0.5, -0.5, -0.5], selected: false },
            { index: 2, position: [0.5, 0.5, -0.5], selected: false },
            { index: 3, position: [-0.5, 0.5, -0.5], selected: false },
            { index: 4, position: [-0.5, -0.5, 0.5], selected: false },
            { index: 5, position: [0.5, -0.5, 0.5], selected: false },
            { index: 6, position: [0.5, 0.5, 0.5], selected: false },
            { index: 7, position: [-0.5, 0.5, 0.5], selected: false },
          ] as any[],
          edges: [
            { index: 0, vertices: [0, 1], selected: false },
            { index: 1, vertices: [1, 2], selected: false },
            { index: 2, vertices: [2, 3], selected: false },
            { index: 3, vertices: [3, 0], selected: false },
            { index: 4, vertices: [4, 5], selected: false },
            { index: 5, vertices: [5, 6], selected: false },
            { index: 6, vertices: [6, 7], selected: false },
            { index: 7, vertices: [7, 4], selected: false },
            { index: 8, vertices: [0, 4], selected: false },
            { index: 9, vertices: [1, 5], selected: false },
            { index: 10, vertices: [2, 6], selected: false },
            { index: 11, vertices: [3, 7], selected: false },
          ] as any[],
          faces: [
            {
              index: 0,
              vertices: [0, 1, 2, 3],
              normal: [0, 0, -1],
              selected: false,
            },
            {
              index: 1,
              vertices: [4, 7, 6, 5],
              normal: [0, 0, 1],
              selected: false,
            },
            {
              index: 2,
              vertices: [0, 4, 5, 1],
              normal: [0, -1, 0],
              selected: false,
            },
            {
              index: 3,
              vertices: [2, 6, 7, 3],
              normal: [0, 1, 0],
              selected: false,
            },
            {
              index: 4,
              vertices: [0, 3, 7, 4],
              normal: [-1, 0, 0],
              selected: false,
            },
            {
              index: 5,
              vertices: [1, 5, 6, 2],
              normal: [1, 0, 0],
              selected: false,
            },
          ] as any[],
          selectionMode: "single",
          subObjectType: "vertex",
        } as any;
      default:
        return {
          modelId,
          vertices: [],
          edges: [],
          faces: [],
          selectionMode: "single",
          subObjectType: "vertex",
        } as any;
    }
  };

  if (!selectedModel) {
    return (
      <Card sx={styles.errorCard}>
        <CardContent sx={styles.errorContent}>
          <Alert severity="warning" sx={styles.alert}>
            {isSmallPanel
              ? "No model selected"
              : "No model selected for editing"}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (editMode !== "vertex" && editMode !== "edge" && editMode !== "face") {
    return null;
  }

  return (
    <Box sx={styles.editorContainer}>
      {/* Stats display */}
      {meshEditData && (
        <Box sx={styles.statsContainer}>
          <Tooltip title="Vertices">
            <Box sx={styles.statItem}>
              <Typography
                variant="caption"
                sx={isVerySmallPanel ? styles.statLabelCompact : null}
              >
                {isVerySmallPanel ? "V:" : "Vertices:"}
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {meshEditData?.vertices?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          {!isVerySmallPanel && (
            <Divider orientation="vertical" flexItem sx={styles.statDivider} />
          )}

          <Tooltip title="Edges">
            <Box sx={styles.statItem}>
              <Typography
                variant="caption"
                sx={isVerySmallPanel ? styles.statLabelCompact : null}
              >
                {isVerySmallPanel ? "E:" : "Edges:"}
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {meshEditData?.edges?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          {!isVerySmallPanel && (
            <Divider orientation="vertical" flexItem sx={styles.statDivider} />
          )}

          <Tooltip title="Faces">
            <Box sx={styles.statItem}>
              <Typography
                variant="caption"
                sx={isVerySmallPanel ? styles.statLabelCompact : null}
              >
                {isVerySmallPanel ? "F:" : "Faces:"}
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {meshEditData?.faces?.length || 0}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      )}

      {/* Editor Components */}
      <Box sx={styles.editorContent}>
        {currentSubObjectType === "vertex" && editMode === "vertex" && (
          <VertexEditor modelId={modelId} />
        )}
        {currentSubObjectType === "edge" && editMode === "edge" && (
          <EdgeEditor modelId={modelId} />
        )}
        {currentSubObjectType === "face" && editMode === "face" && (
          <FaceEditor modelId={modelId} />
        )}
      </Box>
    </Box>
  );
};

const styles = {
  editorContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    width: "100%",
    overflow: "hidden",
  },
  statsContainer: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "2px",
    padding: "6px 8px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "6px",
    justifyContent: "space-between",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 4px",
    minWidth: "fit-content",
  },
  statLabelCompact: {
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.6)",
  },
  statDivider: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    height: "14px",
  },
  editorContent: {
    width: "100%",
    overflow: "hidden",
  },
  errorCard: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 193, 7, 0.3)",
  },
  errorContent: {
    padding: "6px",
    "&:last-child": {
      paddingBottom: "6px",
    },
  },
  alert: {
    backgroundColor: "transparent",
    color: "rgba(255, 193, 7, 0.9)",
    fontSize: "0.75rem",
    padding: "0 4px",
    "& .MuiAlert-icon": {
      color: "rgba(255, 193, 7, 0.9)",
      fontSize: "0.9rem",
      marginRight: "4px",
    },
    "& .MuiAlert-message": {
      padding: "2px 0",
    },
  },
};

export default SubObjectEditor;

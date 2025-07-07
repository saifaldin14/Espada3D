import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  ButtonGroup,
  Button,
  Alert,
} from "@mui/material";
import { CropFree, LinearScale, Crop } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setCurrentSubObjectType,
  initializeMeshEditData,
  clearMeshEditData,
} from "../../store/slices/uiSlice";
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
  const selectedModel = useSelector((state: RootState) =>
    state.models.models.find((model) => model.id === modelId)
  );
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const meshEditData = useSelector(
    (state: RootState) => state.ui.meshEditData[modelId]
  );
  const geometryCache = useSelector(
    (state: RootState) => state.ui.geometryCache[modelId]
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
        dispatch(initializeMeshEditData(realMeshData));
      } catch (error) {
        console.warn("Failed to extract mesh data, using fallback:", error);
        // Fallback to mock data if real extraction fails
        const mockMeshData = createMockMeshData(selectedModel.type, modelId);
        dispatch(initializeMeshEditData(mockMeshData));
      }
    }

    // Clean up mesh edit data when leaving sub-object editing mode
    return () => {
      if (editMode !== "vertex" && editMode !== "edge" && editMode !== "face") {
        dispatch(clearMeshEditData(modelId));
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
      <Card>
        <CardContent>
          <Alert severity="warning">
            No model selected for sub-object editing
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (editMode !== "vertex" && editMode !== "edge" && editMode !== "face") {
    return null;
  }

  return (
    <Box>
      {/* Sub-object Type Selection */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sub-Object Editing: {selectedModel.name}
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            Edit Mode
          </Typography>
          <ButtonGroup variant="outlined" fullWidth>
            <Button
              startIcon={<CropFree />}
              variant={
                currentSubObjectType === "vertex" ? "contained" : "outlined"
              }
              onClick={() => handleSubObjectTypeChange("vertex")}
            >
              Vertex
            </Button>
            <Button
              startIcon={<LinearScale />}
              variant={
                currentSubObjectType === "edge" ? "contained" : "outlined"
              }
              onClick={() => handleSubObjectTypeChange("edge")}
            >
              Edge
            </Button>
            <Button
              startIcon={<Crop />}
              variant={
                currentSubObjectType === "face" ? "contained" : "outlined"
              }
              onClick={() => handleSubObjectTypeChange("face")}
            >
              Face
            </Button>
          </ButtonGroup>
        </CardContent>
      </Card>

      {/* Editor Components */}
      <Box mt={2}>
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

export default SubObjectEditor;

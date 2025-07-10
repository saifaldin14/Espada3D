import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSelector } from "react-redux";
import * as THREE from "three";
import { RootState } from "../../store";
import { useMeshEditor } from "../../hooks/useMeshEditor";
import {
  SelectionMaterialManager,
  getSelectionMaterial,
} from "../../utils/selectionMaterials";
import { SelectionUtils } from "../../utils/selectionUtils";
import BoxSelection from "./BoxSelection";
import TransformGizmo from "./TransformGizmo";

interface MeshEditableModelProps {
  modelId: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  onGeometryUpdate?: (geometry: THREE.BufferGeometry) => void;
}

const MeshEditableModel: React.FC<MeshEditableModelProps> = ({
  modelId,
  geometry: originalGeometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onGeometryUpdate,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(originalGeometry.clone());
  const helperGroupRef = useRef<THREE.Group>(null);
  const [hoveredElement, setHoveredElement] = useState<{
    type: string;
    index: number;
  } | null>(null);

  const { camera, scene } = useThree();

  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );
  const activeTool = useSelector((state: RootState) => state.ui.activeTool);

  const {
    meshData,
    pendingOperations,
    initializeMesh,
    applyOperations,
    selectElements,
  } = useMeshEditor(modelId);

  // Initialize mesh data from geometry on first load
  useEffect(() => {
    console.log("MeshEditableModel: Checking initialization", {
      hasEditMode: ["vertex", "edge", "face"].includes(editMode),
      editMode,
      hasMeshData: !!meshData,
      modelId,
      geometryUuid: geometryRef.current.uuid,
    });

    if (!meshData && ["vertex", "edge", "face"].includes(editMode)) {
      console.log("MeshEditableModel: Initializing mesh data for", modelId);
      try {
        initializeMesh(geometryRef.current);
      } catch (error) {
        console.error("MeshEditableModel: Failed to initialize mesh:", error);
      }
    }
  }, [editMode, meshData, initializeMesh, modelId]);

  // Apply pending operations to geometry
  useEffect(() => {
    if (meshData && pendingOperations.length > 0) {
      applyOperations(geometryRef.current);
      if (onGeometryUpdate) {
        onGeometryUpdate(geometryRef.current);
      }
    }
  }, [meshData, pendingOperations, applyOperations, onGeometryUpdate]);

  // Create helper geometries for visualization with improved materials
  const helpers = useMemo(() => {
    console.log("MeshEditableModel: Creating helpers", {
      hasMeshData: !!meshData,
      editMode,
      currentSubObjectType,
      vertexCount: meshData?.vertices?.length || 0,
      edgeCount: meshData?.edges?.length || 0,
      faceCount: meshData?.faces?.length || 0,
    });

    if (!meshData || !["vertex", "edge", "face"].includes(editMode)) {
      return { vertices: [], edges: [], faces: [] };
    }

    const materials = SelectionMaterialManager.getMaterials();
    const vertexHelpers: THREE.Mesh[] = [];
    const edgeHelpers: THREE.Mesh[] = [];
    const faceHelpers: THREE.Object3D[] = [];

    // Vertex helpers (small spheres) with improved materials
    if (currentSubObjectType === "vertex" || editMode === "vertex") {
      meshData.vertices.forEach((vertex) => {
        const sphereGeometry = new THREE.SphereGeometry(0.03, 8, 6);
        const isHovered =
          hoveredElement?.type === "vertex" &&
          hoveredElement.index === vertex.index;
        const materialType = getSelectionMaterial(
          "vertex",
          {
            selected: vertex.selected,
            hover: isHovered,
          },
          materials
        );

        const sphere = new THREE.Mesh(sphereGeometry, materialType);
        sphere.position.set(
          vertex.position[0],
          vertex.position[1],
          vertex.position[2]
        );
        sphere.userData = { type: "vertex", index: vertex.index };
        sphere.renderOrder = 1000;
        vertexHelpers.push(sphere);
      });
    }

    // Edge helpers (thin cylinders) with improved materials
    if (currentSubObjectType === "edge" || editMode === "edge") {
      meshData.edges.forEach((edge) => {
        const v1 = meshData.vertices[edge.vertices[0]];
        const v2 = meshData.vertices[edge.vertices[1]];

        if (v1 && v2) {
          const start = new THREE.Vector3(
            v1.position[0],
            v1.position[1],
            v1.position[2]
          );
          const end = new THREE.Vector3(
            v2.position[0],
            v2.position[1],
            v2.position[2]
          );
          const direction = end.clone().sub(start);
          const length = direction.length();
          const center = start.clone().add(end).multiplyScalar(0.5);

          const cylinderGeometry = new THREE.CylinderGeometry(
            0.01,
            0.01,
            length
          );
          const isHovered =
            hoveredElement?.type === "edge" &&
            hoveredElement.index === edge.index;
          const materialType = getSelectionMaterial(
            "edge",
            {
              selected: edge.selected,
              hover: isHovered,
            },
            materials
          );

          const cylinder = new THREE.Mesh(cylinderGeometry, materialType);

          // Align cylinder with edge direction
          cylinder.position.copy(center);
          cylinder.lookAt(end);
          cylinder.rotateX(Math.PI / 2);
          cylinder.renderOrder = 1000;

          cylinder.userData = { type: "edge", index: edge.index };
          edgeHelpers.push(cylinder);
        }
      });
    }

    // Face helpers with improved materials
    if (currentSubObjectType === "face" || editMode === "face") {
      meshData.faces.forEach((face) => {
        const faceGeometry = new THREE.BufferGeometry();
        const positions: number[] = [];
        const indices: number[] = [];

        // Create face vertices
        face.vertices.forEach((vertexIndex, i) => {
          const vertex = meshData.vertices[vertexIndex];
          positions.push(
            vertex.position[0],
            vertex.position[1],
            vertex.position[2]
          );
          if (i > 1) {
            // Create triangles for face (fan triangulation)
            indices.push(0, i - 1, i);
          }
        });

        faceGeometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, 3)
        );
        faceGeometry.setIndex(indices);

        const isHovered =
          hoveredElement?.type === "face" &&
          hoveredElement.index === face.index;

        // Show face highlight if selected
        if (face.selected) {
          const faceMaterial = getSelectionMaterial(
            "face",
            {
              selected: true,
              hover: isHovered,
            },
            materials
          );

          const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
          faceMesh.userData = { type: "face", index: face.index };
          faceMesh.renderOrder = 999;
          faceHelpers.push(faceMesh);
        }

        // Always show wireframe edge for visibility
        const wireframeGeometry = new THREE.WireframeGeometry(faceGeometry);
        const wireframeMaterial = face.selected
          ? materials.face.wireframeSelected
          : materials.face.wireframe;

        const wireframe = new THREE.LineSegments(
          wireframeGeometry,
          wireframeMaterial
        );
        wireframe.userData = { type: "face", index: face.index };
        wireframe.renderOrder = 1000;
        faceHelpers.push(wireframe);
      });
    }

    return { vertices: vertexHelpers, edges: edgeHelpers, faces: faceHelpers };
  }, [meshData, editMode, currentSubObjectType, hoveredElement]);

  // Enhanced mouse interactions for selection with hover support
  const handlePointerDown = useCallback(
    (event: any) => {
      if (!meshData || !["vertex", "edge", "face"].includes(editMode)) return;

      event.stopPropagation();

      const intersectedObject = event.object;
      const userData = intersectedObject?.userData;

      if (userData && userData.type === currentSubObjectType) {
        const isShiftPressed = event.shiftKey;
        const isCtrlPressed = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
        const isAltPressed = event.altKey;

        let mode: "set" | "add" | "remove" = "set";

        if (isAltPressed) {
          // Alt + click for deselection
          mode = "remove";
        } else if (selectionMode === "multiple" || isShiftPressed) {
          // Shift or multiple mode for addition
          mode = "add";
        } else if (isCtrlPressed) {
          // Ctrl/Cmd for toggle
          const currentElement =
            meshData[
              userData.type === "vertex"
                ? "vertices"
                : userData.type === "edge"
                  ? "edges"
                  : "faces"
            ]?.[userData.index];
          mode = currentElement?.selected ? "remove" : "add";
        }

        selectElements(currentSubObjectType, [userData.index], mode);
      }
    },
    [meshData, editMode, currentSubObjectType, selectionMode, selectElements]
  );

  // Add hover detection
  const handlePointerOver = useCallback(
    (event: any) => {
      if (!meshData || !["vertex", "edge", "face"].includes(editMode)) return;

      const intersectedObject = event.object;
      const userData = intersectedObject?.userData;

      if (userData && userData.type === currentSubObjectType) {
        setHoveredElement({ type: userData.type, index: userData.index });
        event.stopPropagation();
      }
    },
    [meshData, editMode, currentSubObjectType]
  );

  const handlePointerOut = useCallback((event: any) => {
    setHoveredElement(null);
  }, []);

  // Box selection handler
  const handleBoxSelect = useCallback(
    (
      startNDC: THREE.Vector2,
      endNDC: THREE.Vector2,
      mode: "set" | "add" | "remove" = "set"
    ) => {
      if (!meshData || !meshRef.current) return;

      const modelMatrix = meshRef.current.matrixWorld;
      const result = SelectionUtils.performBoxSelection(
        meshData,
        startNDC,
        endNDC,
        camera,
        modelMatrix
      );

      const indices =
        result[
          currentSubObjectType === "vertex"
            ? "vertices"
            : currentSubObjectType === "edge"
              ? "edges"
              : "faces"
        ];

      if (indices.length > 0) {
        selectElements(currentSubObjectType, indices, mode);
      }
    },
    [meshData, currentSubObjectType, selectElements, camera]
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        ref={meshRef}
        geometry={geometryRef.current}
        material={material}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Transform Gizmo */}
      <TransformGizmo
        modelId={modelId}
        visible={["vertex", "edge", "face"].includes(editMode)}
        mode={
          activeTool === "translate"
            ? "translate"
            : activeTool === "rotate"
              ? "rotate"
              : activeTool === "scale"
                ? "scale"
                : "translate"
        }
      />

      {/* Box Selection Component */}
      <BoxSelection
        onBoxSelect={handleBoxSelect}
        isActive={["vertex", "edge", "face"].includes(editMode)}
      />

      {/* Helper geometries for sub-object visualization */}
      {["vertex", "edge", "face"].includes(editMode) && (
        <group ref={helperGroupRef}>
          {/* Render vertex helpers */}
          {currentSubObjectType === "vertex" &&
            helpers.vertices.map((helper, index) => (
              <primitive
                key={`vertex-${helper.userData.index}`}
                object={helper}
                onPointerDown={handlePointerDown}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
              />
            ))}

          {/* Render edge helpers */}
          {currentSubObjectType === "edge" &&
            helpers.edges.map((helper, index) => (
              <primitive
                key={`edge-${helper.userData.index}`}
                object={helper}
                onPointerDown={handlePointerDown}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
              />
            ))}

          {/* Render face helpers */}
          {currentSubObjectType === "face" &&
            helpers.faces.map((helper, index) => (
              <primitive
                key={`face-${helper.userData.index}-${index}`}
                object={helper}
                onPointerDown={handlePointerDown}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
              />
            ))}
        </group>
      )}
    </group>
  );
};

export default MeshEditableModel;

// TODO: Find a way to optimize the code, too much duplication and wasted operations (i.e. always doing MeshEditModes.includes)
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
import { EditModes, SelectModes } from "../../Enums";
import { BoxSelectionMode } from "../../types";
import { MeshEditModes } from "../../consts";

interface MeshEditableModelProps {
  modelId: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  // New: original child mesh local transform so editing view matches normal view
  meshLocalPosition?: [number, number, number];
  meshLocalRotation?: [number, number, number];
  meshLocalScale?: [number, number, number];
  onGeometryUpdate?: (geometry: THREE.BufferGeometry) => void;
}

const MeshEditableModel: React.FC<MeshEditableModelProps> = ({
  modelId,
  geometry: originalGeometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  meshLocalPosition = [0, 0, 0],
  meshLocalRotation = [0, 0, 0],
  meshLocalScale = [1, 1, 1],
  onGeometryUpdate,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(originalGeometry);
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

  // Only update geometry reference if it's actually a different geometry
  useEffect(() => {
    if (originalGeometry !== geometryRef.current) {
      geometryRef.current = originalGeometry;
    }
  }, [originalGeometry]);

  // Initialize mesh data from geometry on first load
  useEffect(() => {
    if (!meshData && MeshEditModes.includes(editMode)) {
      try {
        initializeMesh(geometryRef.current);
      } catch (error) {
        // Handle error silently
      }
    }
  }, [editMode, meshData, initializeMesh, modelId]);

  // Apply pending operations to geometry
  useEffect(() => {
    if (meshData && pendingOperations.length > 0) {
      applyOperations(geometryRef.current);

      const position = geometryRef.current.getAttribute("position");
      const normal = geometryRef.current.getAttribute("normal");
      if (position) position.needsUpdate = true;
      if (normal) normal.needsUpdate = true;

      if (onGeometryUpdate) {
        onGeometryUpdate(geometryRef.current);
      }

      if (meshRef.current && meshRef.current.material !== meshEditingMaterial) {
        meshRef.current.material = meshEditingMaterial;
      }
    }
  }, [meshData, pendingOperations, applyOperations, onGeometryUpdate]);

  // Create helper geometries for visualization with improved materials
  const helpers = useMemo(() => {
    if (!meshData || !MeshEditModes.includes(editMode)) {
      return { vertices: [], edges: [], faces: [] };
    }

    const materials = SelectionMaterialManager.getMaterials();
    const vertexHelpers: THREE.Mesh[] = [];
    const edgeHelpers: THREE.Mesh[] = [];
    const faceHelpers: THREE.Object3D[] = [];

    // Vertex helpers (small spheres) with improved materials
    if (
      currentSubObjectType === EditModes.vertex ||
      editMode === EditModes.vertex
    ) {
      meshData.vertices.forEach((vertex) => {
        const sphereGeometry = new THREE.SphereGeometry(0.03, 8, 6);
        const isHovered =
          hoveredElement?.type === EditModes.vertex &&
          hoveredElement.index === vertex.index;
        const materialType = getSelectionMaterial(
          EditModes.vertex,
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
        sphere.userData = { type: EditModes.vertex, index: vertex.index };
        sphere.renderOrder = 1000;
        vertexHelpers.push(sphere);
      });
    }

    // Edge helpers (thin cylinders) with improved materials
    if (
      currentSubObjectType === EditModes.edge ||
      editMode === EditModes.edge
    ) {
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
            hoveredElement?.type === EditModes.edge &&
            hoveredElement.index === edge.index;
          const materialType = getSelectionMaterial(
            EditModes.edge,
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

          cylinder.userData = { type: EditModes.edge, index: edge.index };
          edgeHelpers.push(cylinder);
        }
      });
    }

    // Face helpers with improved materials
    if (
      currentSubObjectType === EditModes.face ||
      editMode === EditModes.face
    ) {
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
          hoveredElement?.type === EditModes.face &&
          hoveredElement.index === face.index;

        // Show face highlight if selected
        if (face.selected) {
          const faceMaterial = getSelectionMaterial(
            EditModes.face,
            {
              selected: true,
              hover: isHovered,
            },
            materials
          );

          const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
          faceMesh.userData = { type: EditModes.face, index: face.index };
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
        wireframe.userData = { type: EditModes.face, index: face.index };
        wireframe.renderOrder = 1000;
        faceHelpers.push(wireframe);
      });
    }

    return { vertices: vertexHelpers, edges: edgeHelpers, faces: faceHelpers };
  }, [meshData, editMode, currentSubObjectType, hoveredElement]);

  // Enhanced mouse interactions for selection with hover support
  const handlePointerDown = useCallback(
    (event: any) => {
      if (!meshData || !MeshEditModes.includes(editMode)) return;

      event.stopPropagation();

      const intersectedObject = event.object;
      const userData = intersectedObject?.userData;

      if (userData && userData.type === currentSubObjectType) {
        const isShiftPressed = event.shiftKey;
        const isCtrlPressed = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
        const isAltPressed = event.altKey;

        let mode: BoxSelectionMode = SelectModes.set;

        if (isAltPressed) {
          // Alt + click for deselection
          mode = SelectModes.remove;
        } else if (selectionMode === "multiple" || isShiftPressed) {
          // Shift or multiple mode for addition
          mode = SelectModes.add;
        } else if (isCtrlPressed) {
          // Ctrl/Cmd for toggle
          const currentElement =
            meshData[
              userData.type === EditModes.vertex
                ? "vertices"
                : userData.type === EditModes.edge
                  ? "edges"
                  : "faces"
            ]?.[userData.index];
          mode = currentElement?.selected
            ? SelectModes.remove
            : SelectModes.add;
        }

        selectElements(currentSubObjectType, [userData.index], mode);
      }
    },
    [meshData, editMode, currentSubObjectType, selectionMode, selectElements]
  );

  // Add hover detection
  const handlePointerOver = useCallback(
    (event: any) => {
      if (!meshData || !MeshEditModes.includes(editMode)) return;

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
      mode: BoxSelectionMode = SelectModes.set
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
          currentSubObjectType === EditModes.vertex
            ? "vertices"
            : currentSubObjectType === EditModes.edge
              ? "edges"
              : "faces"
        ];

      if (indices.length > 0) {
        selectElements(currentSubObjectType, indices, mode);
      }
    },
    [meshData, currentSubObjectType, selectElements, camera]
  );

  // Create a double-sided material for mesh editing
  const meshEditingMaterial = useMemo(() => {
    if (!MeshEditModes.includes(editMode)) {
      return material;
    }

    // Clone the material to avoid modifying the original
    let editMaterial: THREE.Material;

    if (Array.isArray(material)) {
      // Handle material arrays by cloning each material
      editMaterial = material.map((mat) => {
        const cloned = mat.clone();
        cloned.side = THREE.DoubleSide;
        return cloned;
      })[0]; // Use first material for simplicity
    } else {
      editMaterial = material.clone();
      editMaterial.side = THREE.DoubleSide;
    }

    return editMaterial;
  }, [material, editMode]);

  // Clean up cloned materials when component unmounts or material changes
  useEffect(() => {
    return () => {
      if (
        meshEditingMaterial !== material &&
        !Array.isArray(meshEditingMaterial)
      ) {
        meshEditingMaterial.dispose();
      }
    };
  }, [meshEditingMaterial, material]);

  return (
    <>
      <group position={position} rotation={rotation} scale={scale}>
        {/* Preserve original child mesh local transform so world position stays identical */}
        <group
          position={meshLocalPosition}
          rotation={meshLocalRotation}
          scale={meshLocalScale}
        >
          <mesh
            ref={meshRef}
            geometry={geometryRef.current}
            material={meshEditingMaterial}
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          />

          {/* Box Selection Component */}
          <BoxSelection
            onBoxSelect={handleBoxSelect}
            isActive={MeshEditModes.includes(editMode)}
          />

          {/* Helper geometries for sub-object visualization */}
          {MeshEditModes.includes(editMode) && (
            <group ref={helperGroupRef}>
              {/* Render vertex helpers */}
              {currentSubObjectType === EditModes.vertex &&
                helpers.vertices.map((helper) => (
                  <primitive
                    key={`vertex-${helper.userData.index}`}
                    object={helper}
                    onPointerDown={handlePointerDown}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                  />
                ))}

              {/* Render edge helpers */}
              {currentSubObjectType === EditModes.edge &&
                helpers.edges.map((helper) => (
                  <primitive
                    key={`edge-${helper.userData.index}`}
                    object={helper}
                    onPointerDown={handlePointerDown}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                  />
                ))}

              {/* Render face helpers */}
              {currentSubObjectType === EditModes.face &&
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
      </group>

      {/* Transform Gizmo - positioned outside the transformed groups */}
      <TransformGizmo
        modelId={modelId}
        visible={MeshEditModes.includes(editMode)}
        mode={
          activeTool === "translate"
            ? "translate"
            : activeTool === "rotate"
              ? "rotate"
              : activeTool === "scale"
                ? "scale"
                : "translate"
        }
        getTargetMatrixWorld={() =>
          meshRef.current ? meshRef.current.matrixWorld.clone() : null
        }
        getMeshObject={() => meshRef.current}
      />
    </>
  );
};

export default MeshEditableModel;

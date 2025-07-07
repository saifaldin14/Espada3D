import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useSelector } from "react-redux";
import * as THREE from "three";
import { RootState } from "../../store";
import { useMeshEditor } from "../../hooks/useMeshEditor";

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

  const { camera } = useThree();

  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  const {
    meshData,
    pendingOperations,
    initializeMesh,
    applyOperations,
    selectElements,
  } = useMeshEditor(modelId);

  // Initialize mesh data from geometry on first load
  useEffect(() => {
    if (!meshData && ["vertex", "edge", "face"].includes(editMode)) {
      initializeMesh(geometryRef.current);
    }
  }, [editMode, meshData, initializeMesh]);

  // Apply pending operations to geometry
  useEffect(() => {
    if (meshData && pendingOperations.length > 0) {
      applyOperations(geometryRef.current);
      if (onGeometryUpdate) {
        onGeometryUpdate(geometryRef.current);
      }
    }
  }, [meshData, pendingOperations, applyOperations, onGeometryUpdate]);

  // Create helper geometries for visualization
  const helpers = useMemo(() => {
    if (!meshData || !["vertex", "edge", "face"].includes(editMode)) {
      return { vertices: [], edges: [], faces: [] };
    }

    const vertexHelpers: THREE.Mesh[] = [];
    const edgeHelpers: THREE.Mesh[] = [];
    const faceHelpers: THREE.Object3D[] = [];

    // Vertex helpers (small spheres)
    if (currentSubObjectType === "vertex" || editMode === "vertex") {
      meshData.vertices.forEach((vertex) => {
        const sphereGeometry = new THREE.SphereGeometry(0.02, 8, 6);
        const material = new THREE.MeshBasicMaterial({
          color: vertex.selected ? 0xff4444 : 0x888888,
          transparent: true,
          opacity: vertex.selected ? 1.0 : 0.6,
        });
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(...vertex.position);
        sphere.userData = { type: "vertex", index: vertex.index };
        vertexHelpers.push(sphere);
      });
    }

    // Edge helpers (thin cylinders)
    if (currentSubObjectType === "edge" || editMode === "edge") {
      meshData.edges.forEach((edge) => {
        const v1 = meshData.vertices[edge.vertices[0]];
        const v2 = meshData.vertices[edge.vertices[1]];

        if (v1 && v2) {
          const start = new THREE.Vector3(...v1.position);
          const end = new THREE.Vector3(...v2.position);
          const direction = end.clone().sub(start);
          const length = direction.length();
          const center = start.clone().add(end).multiplyScalar(0.5);

          const cylinderGeometry = new THREE.CylinderGeometry(
            0.008,
            0.008,
            length
          );
          const material = new THREE.MeshBasicMaterial({
            color: edge.selected ? 0x44ff44 : 0x666666,
            transparent: true,
            opacity: edge.selected ? 1.0 : 0.6,
          });
          const cylinder = new THREE.Mesh(cylinderGeometry, material);

          // Align cylinder with edge direction
          cylinder.position.copy(center);
          cylinder.lookAt(end);
          cylinder.rotateX(Math.PI / 2);

          cylinder.userData = { type: "edge", index: edge.index };
          edgeHelpers.push(cylinder);
        }
      });
    }

    // Face helpers (wireframe outlines)
    if (currentSubObjectType === "face" || editMode === "face") {
      meshData.faces.forEach((face) => {
        if (face.selected) {
          const faceGeometry = new THREE.BufferGeometry();
          const positions: number[] = [];
          const indices: number[] = [];

          // Create face vertices
          face.vertices.forEach((vertexIndex, i) => {
            const vertex = meshData.vertices[vertexIndex];
            positions.push(...vertex.position);
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

          const faceMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
          });

          const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
          faceMesh.userData = { type: "face", index: face.index };
          faceHelpers.push(faceMesh);

          // Also create wireframe edge
          const wireframeGeometry = new THREE.WireframeGeometry(faceGeometry);
          const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x6666ff,
            linewidth: 2,
          });
          const wireframe = new THREE.LineSegments(
            wireframeGeometry,
            wireframeMaterial
          );
          wireframe.userData = { type: "face", index: face.index };
          faceHelpers.push(wireframe);
        }
      });
    }

    return { vertices: vertexHelpers, edges: edgeHelpers, faces: faceHelpers };
  }, [meshData, editMode, currentSubObjectType]);

  // Handle mouse interactions for selection
  const handlePointerDown = useCallback(
    (event: any) => {
      if (!meshData || !["vertex", "edge", "face"].includes(editMode)) return;

      event.stopPropagation();

      // Use event intersections instead of manual raycasting
      const intersects = event.intersections;

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const userData = intersectedObject.userData;

        if (userData && userData.type === currentSubObjectType) {
          const isShiftPressed = event.shiftKey;
          const isCtrlPressed = event.ctrlKey;

          let mode: "set" | "add" | "remove" = "set";

          if (selectionMode === "multiple" || isShiftPressed) {
            mode = "add";
          } else if (isCtrlPressed) {
            mode = "remove";
          }

          selectElements(currentSubObjectType, [userData.index], mode);
        }
      }
    },
    [
      meshData,
      editMode,
      currentSubObjectType,
      selectionMode,
      selectElements,
      helpers,
    ]
  );

  // Update helper group
  useEffect(() => {
    if (helperGroupRef.current) {
      // Clear existing helpers
      helperGroupRef.current.clear();

      // Add new helpers
      [...helpers.vertices, ...helpers.edges, ...helpers.faces].forEach(
        (helper) => {
          helperGroupRef.current!.add(helper);
        }
      );
    }
  }, [helpers]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        ref={meshRef}
        geometry={geometryRef.current}
        material={material}
        onPointerDown={handlePointerDown}
      />
      {/* Helper geometries for sub-object visualization */}
      {["vertex", "edge", "face"].includes(editMode) && (
        <group ref={helperGroupRef} />
      )}
    </group>
  );
};

export default MeshEditableModel;

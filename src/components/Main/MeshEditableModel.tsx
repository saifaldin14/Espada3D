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

  // Create helper geometries for visualization
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
          opacity: vertex.selected ? 1.0 : 0.8,
          depthTest: false,
          depthWrite: false,
        });
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(...vertex.position);
        sphere.userData = { type: "vertex", index: vertex.index };
        sphere.renderOrder = 1000; // Render on top
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
            opacity: edge.selected ? 1.0 : 0.8,
            depthTest: false,
            depthWrite: false,
          });
          const cylinder = new THREE.Mesh(cylinderGeometry, material);

          // Align cylinder with edge direction
          cylinder.position.copy(center);
          cylinder.lookAt(end);
          cylinder.rotateX(Math.PI / 2);
          cylinder.renderOrder = 1000; // Render on top

          cylinder.userData = { type: "edge", index: edge.index };
          edgeHelpers.push(cylinder);
        }
      });
    }

    // Face helpers (wireframe outlines)
    if (currentSubObjectType === "face" || editMode === "face") {
      meshData.faces.forEach((face) => {
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

        // Show face highlight if selected
        if (face.selected) {
          const faceMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
          });

          const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
          faceMesh.userData = { type: "face", index: face.index };
          faceMesh.renderOrder = 999; // Render slightly below edges/vertices
          faceHelpers.push(faceMesh);
        }

        // Always show wireframe edge for visibility
        const wireframeGeometry = new THREE.WireframeGeometry(faceGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
          color: face.selected ? 0x6666ff : 0x444444,
          linewidth: face.selected ? 3 : 1,
          transparent: true,
          opacity: face.selected ? 1.0 : 0.6,
          depthTest: false,
          depthWrite: false,
        });
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
  }, [meshData, editMode, currentSubObjectType]);

  // Handle mouse interactions for selection
  const handlePointerDown = useCallback(
    (event: any) => {
      if (!meshData || !["vertex", "edge", "face"].includes(editMode)) return;

      event.stopPropagation();

      // Get the intersected object from the event
      const intersectedObject = event.object;
      const userData = intersectedObject?.userData;

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
    },
    [meshData, editMode, currentSubObjectType, selectionMode, selectElements]
  );

  // Update helper group
  useEffect(() => {
    if (helperGroupRef.current) {
      // Clear existing helpers
      helperGroupRef.current.clear();

      // Add new helpers with proper event handling
      [...helpers.vertices, ...helpers.edges, ...helpers.faces].forEach(
        (helper) => {
          // Ensure the helper has proper event handlers
          if (helper.userData && helper.userData.type) {
            helperGroupRef.current!.add(helper);
          }
        }
      );
    }
  }, [helpers]);

  // Create event handlers for helper objects
  const createHelperWithEvents = useCallback(
    (helper: THREE.Object3D) => {
      // Clone the helper to avoid modifying the original
      const helperWithEvents = helper.clone();

      // Add pointer event handlers
      const handleHelperPointerDown = (event: any) => {
        event.stopPropagation();
        handlePointerDown(event);
      };

      // Store the event handler reference
      (helperWithEvents as any).onPointerDown = handleHelperPointerDown;

      return helperWithEvents;
    },
    [handlePointerDown]
  );

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
        <group ref={helperGroupRef}>
          {/* Render vertex helpers */}
          {currentSubObjectType === "vertex" &&
            helpers.vertices.map((helper, index) => (
              <primitive
                key={`vertex-${helper.userData.index}`}
                object={helper}
                onPointerDown={handlePointerDown}
              />
            ))}

          {/* Render edge helpers */}
          {currentSubObjectType === "edge" &&
            helpers.edges.map((helper, index) => (
              <primitive
                key={`edge-${helper.userData.index}`}
                object={helper}
                onPointerDown={handlePointerDown}
              />
            ))}

          {/* Render face helpers */}
          {currentSubObjectType === "face" &&
            helpers.faces.map((helper, index) => (
              <primitive
                key={`face-${helper.userData.index}-${index}`}
                object={helper}
                onPointerDown={handlePointerDown}
              />
            ))}
        </group>
      )}
    </group>
  );
};

export default MeshEditableModel;

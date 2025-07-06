import React, { useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useFrame, useThree } from "@react-three/fiber";
import { RootState } from "../../store";
import { selectSubObjects } from "../../store/slices/uiSlice";
import { MeshEditor } from "../../utils/meshEditor";
import * as THREE from "three";

interface InteractiveSubObjectProps {
  modelId: string;
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  children?: React.ReactNode;
}

const InteractiveSubObject: React.FC<InteractiveSubObjectProps> = ({
  modelId,
  geometry,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  children,
}) => {
  const dispatch = useDispatch();
  const { camera, raycaster, scene } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  const meshEditData = useSelector(
    (state: RootState) => state.ui.meshEditData[modelId]
  );
  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  // Create helper geometries for vertex/edge picking
  const helperGeometries = useMemo(() => {
    if (!meshEditData || !["vertex", "edge", "face"].includes(editMode)) {
      return null;
    }

    const helpers = {
      vertices: [] as THREE.Mesh[],
      edges: [] as THREE.Mesh[],
      faces: [] as THREE.Mesh[],
    };

    // Create vertex helpers (small spheres)
    if (currentSubObjectType === "vertex" || editMode === "vertex") {
      meshEditData.vertices.forEach((vertex, index) => {
        const sphereGeometry = new THREE.SphereGeometry(0.02, 8, 6);
        const material = new THREE.MeshBasicMaterial({
          color: vertex.selected ? 0xff0000 : 0x888888,
          transparent: true,
          opacity: 0.8,
        });
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(...vertex.position);
        sphere.userData = { type: "vertex", index: vertex.index };
        helpers.vertices.push(sphere);
      });
    }

    // Create edge helpers (thin cylinders)
    if (currentSubObjectType === "edge" || editMode === "edge") {
      meshEditData.edges.forEach((edge, index) => {
        const v1 = meshEditData.vertices[edge.vertices[0]];
        const v2 = meshEditData.vertices[edge.vertices[1]];

        if (v1 && v2) {
          const start = new THREE.Vector3(...v1.position);
          const end = new THREE.Vector3(...v2.position);
          const direction = end.clone().sub(start);
          const length = direction.length();
          const center = start.clone().add(end).multiplyScalar(0.5);

          const cylinderGeometry = new THREE.CylinderGeometry(
            0.01,
            0.01,
            length
          );
          const material = new THREE.MeshBasicMaterial({
            color: edge.selected ? 0x00ff00 : 0x888888,
            transparent: true,
            opacity: 0.8,
          });
          const cylinder = new THREE.Mesh(cylinderGeometry, material);

          // Align cylinder with edge direction
          cylinder.position.copy(center);
          cylinder.lookAt(end);
          cylinder.rotateX(Math.PI / 2);

          cylinder.userData = { type: "edge", index: edge.index };
          helpers.edges.push(cylinder);
        }
      });
    }

    return helpers;
  }, [meshEditData, editMode, currentSubObjectType]);

  const handlePointerDown = (event: any) => {
    if (!["vertex", "edge", "face"].includes(editMode) || !meshEditData) {
      return;
    }

    event.stopPropagation();

    // Perform raycasting to find clicked sub-object
    const intersects = event.intersections;

    if (intersects.length === 0) return;

    const intersect = intersects[0];

    if (currentSubObjectType === "vertex") {
      handleVertexSelection(intersect, event);
    } else if (currentSubObjectType === "edge") {
      handleEdgeSelection(intersect, event);
    } else if (currentSubObjectType === "face") {
      handleFaceSelection(intersect, event);
    }
  };

  const handleVertexSelection = (intersect: any, event: any) => {
    // Find closest vertex to intersection point
    const point = intersect.point;
    let closestVertexIndex = -1;
    let closestDistance = Infinity;

    meshEditData!.vertices.forEach((vertex, index) => {
      const distance = point.distanceTo(new THREE.Vector3(...vertex.position));
      if (distance < closestDistance && distance < 0.1) {
        // 0.1 unit threshold
        closestDistance = distance;
        closestVertexIndex = index;
      }
    });

    if (closestVertexIndex !== -1) {
      const isShiftPressed = event.shiftKey;
      const isCtrlPressed = event.ctrlKey || event.metaKey;

      let mode: "set" | "add" | "remove" = "set";

      if (selectionMode === "multiple" || isShiftPressed) {
        mode = "add";
      } else if (isCtrlPressed) {
        mode = "remove";
      }

      dispatch(
        selectSubObjects({
          modelId,
          type: "vertex",
          indices: [closestVertexIndex],
          mode,
        })
      );
    }
  };

  const handleEdgeSelection = (intersect: any, event: any) => {
    // Find edge based on face intersection and closest edge
    if (!intersect.face) return;

    const faceIndex = intersect.faceIndex;
    const point = intersect.point;

    // Find edges of the intersected face
    let closestEdgeIndex = -1;
    let closestDistance = Infinity;

    meshEditData!.edges.forEach((edge, index) => {
      const v1 = meshEditData!.vertices[edge.vertices[0]];
      const v2 = meshEditData!.vertices[edge.vertices[1]];

      if (v1 && v2) {
        const start = new THREE.Vector3(...v1.position);
        const end = new THREE.Vector3(...v2.position);

        // Calculate distance from point to line segment
        const line = new THREE.Line3(start, end);
        const closestPoint = new THREE.Vector3();
        line.closestPointToPoint(point, true, closestPoint);
        const distance = point.distanceTo(closestPoint);

        if (distance < closestDistance && distance < 0.1) {
          closestDistance = distance;
          closestEdgeIndex = index;
        }
      }
    });

    if (closestEdgeIndex !== -1) {
      const isShiftPressed = event.shiftKey;
      const isCtrlPressed = event.ctrlKey || event.metaKey;

      let mode: "set" | "add" | "remove" = "set";

      if (selectionMode === "multiple" || isShiftPressed) {
        mode = "add";
      } else if (isCtrlPressed) {
        mode = "remove";
      }

      dispatch(
        selectSubObjects({
          modelId,
          type: "edge",
          indices: [closestEdgeIndex],
          mode,
        })
      );
    }
  };

  const handleFaceSelection = (intersect: any, event: any) => {
    if (!intersect.face) return;

    const faceIndex = Math.floor(intersect.faceIndex! / 2); // Assuming triangulated faces

    const isShiftPressed = event.shiftKey;
    const isCtrlPressed = event.ctrlKey || event.metaKey;

    let mode: "set" | "add" | "remove" = "set";

    if (selectionMode === "multiple" || isShiftPressed) {
      mode = "add";
    } else if (isCtrlPressed) {
      mode = "remove";
    }

    dispatch(
      selectSubObjects({
        modelId,
        type: "face",
        indices: [faceIndex],
        mode,
      })
    );
  };

  // Debug: Log the state to understand what's happening
  React.useEffect(() => {
    console.log("InteractiveSubObject Debug:", {
      modelId,
      editMode,
      currentSubObjectType,
      meshEditData: !!meshEditData,
      meshEditDataKeys: meshEditData ? Object.keys(meshEditData) : "none",
      vertexCount: meshEditData?.vertices?.length || 0,
      edgeCount: meshEditData?.edges?.length || 0,
      faceCount: meshEditData?.faces?.length || 0,
    });
  }, [modelId, editMode, currentSubObjectType, meshEditData]);

  if (!["vertex", "edge", "face"].includes(editMode)) {
    return (
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={scale}
        geometry={geometry}
      >
        {children}
      </mesh>
    );
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Original mesh */}
      <mesh ref={meshRef} geometry={geometry} onPointerDown={handlePointerDown}>
        {children}
      </mesh>

      {/* Helper geometries for selection */}
      {helperGeometries && (
        <>
          {helperGeometries.vertices.map((vertex, index) => (
            <primitive key={`vertex-helper-${index}`} object={vertex} />
          ))}
          {helperGeometries.edges.map((edge, index) => (
            <primitive key={`edge-helper-${index}`} object={edge} />
          ))}
        </>
      )}
    </group>
  );
};

export default InteractiveSubObject;

// TODO: See if I can clean the code (there is some code duplication for example)
import React, { useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useFrame, useThree } from "@react-three/fiber";
import { RootState } from "../../store";
import { selectSubObjects } from "../../store/slices/meshSlice";
import { MeshEditor } from "../../utils/meshEditor";
import * as THREE from "three";
import { BoxSelectionMode } from "../../types";
import { EditModes, SelectModes } from "../../Enums";
import { MeshEditModes } from "../../consts";

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
    (state: RootState) => state.mesh.meshData[modelId]
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
    if (!meshEditData || !MeshEditModes.includes(editMode)) {
      return null;
    }

    const helpers = {
      vertices: [] as THREE.Mesh[],
      edges: [] as THREE.Mesh[],
      faces: [] as THREE.Mesh[],
    };

    // Create vertex helpers (larger spheres for better selection)
    if (
      currentSubObjectType === EditModes.vertex ||
      editMode === EditModes.vertex
    ) {
      meshEditData.vertices.forEach((vertex, index) => {
        const sphereGeometry = new THREE.SphereGeometry(0.08, 8, 6); // Increased from 0.02 to 0.08
        const material = new THREE.MeshBasicMaterial({
          color: vertex.selected ? 0xff0000 : 0x00ff00,
          transparent: true,
          opacity: vertex.selected ? 0.8 : 0.4, // More visible when selected
          depthTest: false, // Always visible through other objects
        });
        const sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.position.set(...vertex.position);
        sphere.userData = {
          type: EditModes.vertex,
          index: vertex.index,
          originalMaterial: material,
          isSelected: vertex.selected,
        };
        sphere.renderOrder = 999; // Render on top
        helpers.vertices.push(sphere);
      });
    }

    // Create edge helpers (thicker cylinders for better selection)
    if (
      currentSubObjectType === EditModes.edge ||
      editMode === EditModes.edge
    ) {
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
            0.05, // Increased from 0.01 to 0.05
            0.05,
            length
          );
          const material = new THREE.MeshBasicMaterial({
            color: edge.selected ? 0x00ff00 : 0x0000ff,
            transparent: true,
            opacity: edge.selected ? 0.8 : 0.4, // More visible when selected
            depthTest: false, // Always visible through other objects
          });
          const cylinder = new THREE.Mesh(cylinderGeometry, material);

          // Align cylinder with edge direction
          cylinder.position.copy(center);
          cylinder.lookAt(end);
          cylinder.rotateX(Math.PI / 2);

          cylinder.userData = {
            type: EditModes.edge,
            index: edge.index,
            originalMaterial: material,
            isSelected: edge.selected,
          };
          cylinder.renderOrder = 999; // Render on top
          helpers.edges.push(cylinder);
        }
      });
    }

    // Create face helpers (semi-transparent overlays for better selection)
    if (
      currentSubObjectType === EditModes.face ||
      editMode === EditModes.face
    ) {
      meshEditData.faces.forEach((face, index) => {
        // Create a simple geometry for the face
        const faceVertices = face.vertices.map((vIndex) => {
          const vertex = meshEditData.vertices[vIndex];
          return new THREE.Vector3(...vertex.position);
        });

        if (faceVertices.length >= 3) {
          // Create a simple triangle or quad geometry
          const faceGeometry = new THREE.BufferGeometry();
          const positions: number[] = [];

          // Triangulate the face (simple fan triangulation)
          for (let i = 1; i < faceVertices.length - 1; i++) {
            positions.push(
              ...faceVertices[0].toArray(),
              ...faceVertices[i].toArray(),
              ...faceVertices[i + 1].toArray()
            );
          }

          faceGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
          );
          faceGeometry.computeVertexNormals();

          const material = new THREE.MeshBasicMaterial({
            color: face.selected ? 0xff0000 : 0xffff00,
            transparent: true,
            opacity: face.selected ? 0.6 : 0.3, // More visible when selected
            side: THREE.DoubleSide,
            depthTest: false, // Always visible through other objects
          });

          const faceMesh = new THREE.Mesh(faceGeometry, material);
          faceMesh.userData = {
            type: EditModes.face,
            index: face.index,
            originalMaterial: material,
            isSelected: face.selected,
          };
          faceMesh.renderOrder = 998; // Render on top but below vertices/edges
          helpers.faces.push(faceMesh);
        }
      });
    }

    return helpers;
  }, [meshEditData, editMode, currentSubObjectType]);

  const handlePointerEnter = (event: any) => {
    const object = event.object;
    if (object.userData?.originalMaterial && !object.userData?.isSelected) {
      // Brighten the material on hover
      object.material.opacity = Math.min(object.material.opacity * 1.5, 1.0);
    }
    // Change cursor to indicate interactivity
    document.body.style.cursor = "pointer";
  };

  const handlePointerLeave = (event: any) => {
    const object = event.object;
    if (object.userData?.originalMaterial && !object.userData?.isSelected) {
      // Restore original opacity
      const type = object.userData.type;
      const baseOpacity = type === EditModes.face ? 0.3 : 0.4;
      object.material.opacity = baseOpacity;
    }
    // Restore default cursor
    document.body.style.cursor = "default";
  };

  const handlePointerDown = (event: any) => {
    if (!MeshEditModes.includes(editMode) || !meshEditData) {
      return;
    }

    event.stopPropagation();

    // Perform raycasting to find clicked sub-object
    const intersects = event.intersections;

    if (intersects.length === 0) return;

    // Check if we clicked directly on a helper geometry first
    const helperIntersect = intersects.find((intersect: any) => {
      return (
        intersect.object.userData?.type &&
        MeshEditModes.includes(intersect.object.userData.type)
      );
    });

    if (helperIntersect) {
      // Direct selection of helper geometry
      const { type, index } = helperIntersect.object.userData;

      if (type === currentSubObjectType) {
        const isShiftPressed = event.shiftKey;
        const isCtrlPressed = event.ctrlKey || event.metaKey;

        let mode: BoxSelectionMode = SelectModes.set;

        if (selectionMode === "multiple" || isShiftPressed) {
          mode = SelectModes.add;
        } else if (isCtrlPressed) {
          mode = SelectModes.remove;
        }

        dispatch(
          selectSubObjects({
            modelId,
            type,
            indices: [index],
            mode,
          })
        );
        return;
      }
    }

    // Fallback to proximity-based selection
    const intersect = intersects[0];

    if (currentSubObjectType === EditModes.vertex) {
      handleVertexSelection(intersect, event);
    } else if (currentSubObjectType === EditModes.edge) {
      handleEdgeSelection(intersect, event);
    } else if (currentSubObjectType === EditModes.face) {
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
      if (distance < closestDistance && distance < 0.2) {
        // Increased threshold from 0.1 to 0.2 for easier selection
        closestDistance = distance;
        closestVertexIndex = index;
      }
    });

    if (closestVertexIndex !== -1) {
      const isShiftPressed = event.shiftKey;
      const isCtrlPressed = event.ctrlKey || event.metaKey;

      let mode: BoxSelectionMode = SelectModes.set;

      if (selectionMode === "multiple" || isShiftPressed) {
        mode = SelectModes.add;
      } else if (isCtrlPressed) {
        mode = SelectModes.remove;
      }

      dispatch(
        selectSubObjects({
          modelId,
          type: EditModes.vertex,
          indices: [closestVertexIndex],
          mode,
        })
      );
    }
  };

  const handleEdgeSelection = (intersect: any, event: any) => {
    // Find edge based on face intersection and closest edge
    if (!intersect.face) return;

    const geometryFaceIndex = intersect.faceIndex;
    const point = intersect.point;

    // Map geometry face index to mesh data face index
    const meshFaceIndex = MeshEditor.getMeshFaceIndex(
      geometry!,
      geometryFaceIndex
    );
    if (meshFaceIndex === null) {
      console.warn(
        "Could not find mesh face index for geometry face:",
        geometryFaceIndex
      );
      return;
    }

    // Find the closest edge within this face
    const closestEdgeIndex = MeshEditor.findClosestEdgeInFace(
      meshEditData!,
      meshFaceIndex,
      point,
      0.2 // Increased threshold from 0.1 to 0.2 for easier selection
    );

    if (closestEdgeIndex !== null) {
      const isShiftPressed = event.shiftKey;
      const isCtrlPressed = event.ctrlKey || event.metaKey;

      let mode: BoxSelectionMode = SelectModes.set;

      if (selectionMode === "multiple" || isShiftPressed) {
        mode = SelectModes.add;
      } else if (isCtrlPressed) {
        mode = SelectModes.remove;
      }

      dispatch(
        selectSubObjects({
          modelId,
          type: EditModes.edge,
          indices: [closestEdgeIndex],
          mode,
        })
      );
    }
  };

  const handleFaceSelection = (intersect: any, event: any) => {
    if (!intersect.face) return;

    const geometryFaceIndex = intersect.faceIndex;

    // Map geometry face index to mesh data face index
    const meshFaceIndex = MeshEditor.getMeshFaceIndex(
      geometry!,
      geometryFaceIndex
    );
    if (meshFaceIndex === null) {
      console.warn(
        "Could not find mesh face index for geometry face:",
        geometryFaceIndex
      );
      return;
    }

    const isShiftPressed = event.shiftKey;
    const isCtrlPressed = event.ctrlKey || event.metaKey;

    let mode: BoxSelectionMode = SelectModes.set;

    if (selectionMode === "multiple" || isShiftPressed) {
      mode = SelectModes.add;
    } else if (isCtrlPressed) {
      mode = SelectModes.remove;
    }

    dispatch(
      selectSubObjects({
        modelId,
        type: EditModes.face,
        indices: [meshFaceIndex],
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

  if (!MeshEditModes.includes(editMode)) {
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
            <primitive
              key={`vertex-helper-${index}`}
              object={vertex}
              onPointerDown={handlePointerDown}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
            />
          ))}
          {helperGeometries.edges.map((edge, index) => (
            <primitive
              key={`edge-helper-${index}`}
              object={edge}
              onPointerDown={handlePointerDown}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
            />
          ))}
          {helperGeometries.faces.map((face, index) => (
            <primitive
              key={`face-helper-${index}`}
              object={face}
              onPointerDown={handlePointerDown}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
            />
          ))}
        </>
      )}
    </group>
  );
};

export default InteractiveSubObject;

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TransformControls } from "@react-three/drei";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { useMeshEditor } from "../../hooks/useMeshEditor";
import { Vector3Tuple, TransformConstraint } from "../../types";
import { MeshEditModes } from "../../consts";
import { EditModes } from "../../Enums";

interface TransformGizmoProps {
  modelId: string;
  visible: boolean;
  mode: "translate" | "rotate" | "scale";
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
  // Matrix of the editable mesh (its local space) for converting world gizmo movement to mesh local deltas
  getTargetMatrixWorld?: () => THREE.Matrix4 | null;
  // New: direct access to mesh object for robust world position calculation
  getMeshObject?: () => THREE.Object3D | null;
}

const TransformGizmo: React.FC<TransformGizmoProps> = ({
  modelId,
  visible,
  mode,
  onTransformStart,
  onTransformEnd,
  getTargetMatrixWorld,
  getMeshObject,
}) => {
  const dispatch = useDispatch();
  const { camera, gl, scene } = useThree();
  const transformRef = useRef<any>(null);
  const helperGroupRef = useRef<THREE.Group>(null);

  const [isTransforming, setIsTransforming] = useState(false);
  const [startValues, setStartValues] = useState<{
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    scale?: THREE.Vector3;
  }>({});

  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const meshData = useSelector(
    (state: RootState) => state.mesh.meshData[modelId]
  );

  const {
    moveVertices,
    scaleVertices,
    rotateVertices,
    moveEdges,
    rotateEdges,
    scaleEdges,
    moveFaces,
    rotateFaces,
    scaleFaces,
  } = useMeshEditor(modelId);

  // Calculate selection center in local mesh space (existing logic)
  const selectionCenter = React.useMemo(() => {
    if (!meshData || !MeshEditModes.includes(editMode)) {
      return new THREE.Vector3(0, 0, 0);
    }

    let selectedElements: any[] = [];
    if (currentSubObjectType === EditModes.vertex) {
      selectedElements = meshData.vertices.filter((v) => v.selected);
    } else if (currentSubObjectType === EditModes.edge) {
      selectedElements = meshData.edges.filter((e) => e.selected);
    } else if (currentSubObjectType === EditModes.face) {
      selectedElements = meshData.faces.filter((f) => f.selected);
    }

    if (selectedElements.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const center = new THREE.Vector3();
    let count = 0;

    if (currentSubObjectType === EditModes.vertex) {
      selectedElements.forEach((vertex) => {
        center.add(new THREE.Vector3().fromArray(vertex.position));
        count++;
      });
    } else if (currentSubObjectType === EditModes.edge) {
      selectedElements.forEach((edge) => {
        edge.vertices.forEach((vIndex: number) => {
          const vertex = meshData.vertices[vIndex];
          if (vertex) {
            center.add(new THREE.Vector3().fromArray(vertex.position));
            count++;
          }
        });
      });
    } else if (currentSubObjectType === EditModes.face) {
      selectedElements.forEach((face) => {
        face.vertices.forEach((vIndex: number) => {
          const vertex = meshData.vertices[vIndex];
          if (vertex) {
            center.add(new THREE.Vector3().fromArray(vertex.position));
            count++;
          }
        });
      });
    }

    return count > 0 ? center.divideScalar(count) : new THREE.Vector3(0, 0, 0);
  }, [meshData, editMode, currentSubObjectType]);

  // Compute corrected gizmo position accounting for full world transform of mesh
  const correctedGizmoPosition = React.useMemo(() => {
    if (!meshData || !MeshEditModes.includes(editMode))
      return new THREE.Vector3(0, 0, 0);
    const targetMatrix = getTargetMatrixWorld?.();
    if (!targetMatrix) return selectionCenter.clone();

    // Collect selected vertex indices depending on sub-object type
    const selectedVertexIndices: number[] = [];
    if (currentSubObjectType === EditModes.vertex) {
      meshData.vertices.forEach((v) => {
        if (v.selected) selectedVertexIndices.push(v.index);
      });
    } else if (currentSubObjectType === EditModes.edge) {
      meshData.edges.forEach((e) => {
        if (e.selected)
          e.vertices.forEach((v) => selectedVertexIndices.push(v));
      });
    } else if (currentSubObjectType === EditModes.face) {
      meshData.faces.forEach((f) => {
        if (f.selected)
          f.vertices.forEach((v) => selectedVertexIndices.push(v));
      });
    }
    if (selectedVertexIndices.length === 0) return selectionCenter.clone();

    // Average in WORLD space
    const worldCenter = new THREE.Vector3();
    selectedVertexIndices.forEach((idx) => {
      const v = meshData.vertices[idx];
      if (!v) return;
      const local = new THREE.Vector3(
        v.position[0],
        v.position[1],
        v.position[2]
      );
      worldCenter.add(local.applyMatrix4(targetMatrix));
    });
    worldCenter.multiplyScalar(1 / selectedVertexIndices.length);

    // Convert world center to the parent local space where helperGroupRef will be attached
    // (parent is the group that contains mesh & gizmo inside MeshEditableModel)
    // If no parent yet, fallback
    if (helperGroupRef.current?.parent) {
      const parentInv = new THREE.Matrix4()
        .copy(helperGroupRef.current.parent.matrixWorld)
        .invert();
      return worldCenter.clone().applyMatrix4(parentInv);
    }
    return worldCenter; // parent not ready yet
  }, [
    meshData,
    editMode,
    currentSubObjectType,
    selectionCenter,
    getTargetMatrixWorld,
  ]);

  // Handle transform start
  const handleTransformStart = useCallback(() => {
    if (!transformRef.current) return;

    setIsTransforming(true);
    const object = transformRef.current.object;

    setStartValues({
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone(),
    });

    // Capture world position for precise world delta computation
    const wp = new THREE.Vector3();
    object.getWorldPosition(wp);
    startWorldPosRef.current = wp.clone();

    onTransformStart?.();
  }, [onTransformStart]);

  const startWorldPosRef = useRef<THREE.Vector3 | null>(null);

  // Handle transform change
  const handleTransformChange = useCallback(() => {
    if (!transformRef.current || !isTransforming || !startValues.position)
      return;

    const object = transformRef.current.object;
    const currentPosition = object.position;
    const currentRotation = object.rotation;
    const currentScale = object.scale;

    // World -> local conversion helper
    const convertWorldDeltaToLocal = (
      deltaWorld: THREE.Vector3
    ): THREE.Vector3 => {
      const targetMatrix = getTargetMatrixWorld?.();
      if (!targetMatrix) return deltaWorld; // Fallback
      const inv = new THREE.Matrix4().copy(targetMatrix).invert();
      // Remove translation component so pure direction/offset is transformed by rotation & scale only
      inv.elements[12] = 0;
      inv.elements[13] = 0;
      inv.elements[14] = 0;
      return deltaWorld.clone().applyMatrix4(inv);
    };

    if (mode === "translate" && startWorldPosRef.current) {
      const currentWorldPos = new THREE.Vector3();
      object.getWorldPosition(currentWorldPos);
      const deltaWorld = currentWorldPos.clone().sub(startWorldPosRef.current);
      if (deltaWorld.lengthSq() !== 0) {
        const deltaLocal = convertWorldDeltaToLocal(deltaWorld);
        const delta: Vector3Tuple = [deltaLocal.x, deltaLocal.y, deltaLocal.z];
        if (currentSubObjectType === EditModes.vertex) {
          moveVertices(
            delta,
            undefined,
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.edge) {
          moveEdges(
            delta,
            undefined,
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.face) {
          moveFaces(
            delta,
            undefined,
            startValues.position.toArray() as Vector3Tuple
          );
        }
        // Reset world pos baseline
        startWorldPosRef.current = currentWorldPos.clone();
      }
    } else if (mode === "translate") {
      // Legacy local delta fallback (should rarely happen)
      const delta: Vector3Tuple = [
        currentPosition.x - startValues.position.x,
        currentPosition.y - startValues.position.y,
        currentPosition.z - startValues.position.z,
      ];
      if (delta[0] || delta[1] || delta[2]) {
        if (currentSubObjectType === EditModes.vertex) {
          moveVertices(
            delta,
            undefined,
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.edge) {
          moveEdges(
            delta,
            undefined,
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.face) {
          moveFaces(
            delta,
            undefined,
            startValues.position.toArray() as Vector3Tuple
          );
        }
        setStartValues({ ...startValues, position: currentPosition.clone() });
      }
    } else if (mode === "rotate" && startValues.rotation) {
      const deltaRotation: Vector3Tuple = [
        currentRotation.x - startValues.rotation.x,
        currentRotation.y - startValues.rotation.y,
        currentRotation.z - startValues.rotation.z,
      ];

      if (
        deltaRotation[0] !== 0 ||
        deltaRotation[1] !== 0 ||
        deltaRotation[2] !== 0
      ) {
        if (currentSubObjectType === EditModes.vertex) {
          rotateVertices(
            deltaRotation,
            startValues.position?.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.edge) {
          rotateEdges(
            deltaRotation,
            startValues.position?.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.face) {
          rotateFaces(
            deltaRotation,
            startValues.position?.toArray() as Vector3Tuple
          );
        }

        // Reset rotation for next delta calculation
        setStartValues({ ...startValues, rotation: currentRotation.clone() });
      }
    } else if (mode === "scale" && startValues.scale) {
      const scaleFactors: Vector3Tuple = [
        currentScale.x / startValues.scale.x,
        currentScale.y / startValues.scale.y,
        currentScale.z / startValues.scale.z,
      ];

      if (
        scaleFactors[0] !== 1 ||
        scaleFactors[1] !== 1 ||
        scaleFactors[2] !== 1
      ) {
        if (currentSubObjectType === EditModes.vertex) {
          scaleVertices(
            scaleFactors,
            undefined,
            startValues.position?.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.edge) {
          scaleEdges(
            scaleFactors,
            startValues.position?.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.face) {
          scaleFaces(
            scaleFactors,
            startValues.position?.toArray() as Vector3Tuple
          );
        }

        // Reset scale for next delta calculation
        setStartValues({ ...startValues, scale: currentScale.clone() });
      }
    }
  }, [
    mode,
    isTransforming,
    startValues,
    currentSubObjectType,
    moveVertices,
    moveEdges,
    moveFaces,
    rotateVertices,
    rotateEdges,
    rotateFaces,
    scaleVertices,
    scaleEdges,
    scaleFaces,
    getTargetMatrixWorld,
  ]);

  // Handle transform end
  const handleTransformEnd = useCallback(() => {
    setIsTransforming(false);
    setStartValues({});
    onTransformEnd?.();
  }, [onTransformEnd]);

  // Frame update: compute selection world center every frame to stay in sync with moved/rotated/scaled model
  useFrame(() => {
    if (
      !helperGroupRef.current ||
      !meshData ||
      !MeshEditModes.includes(editMode)
    )
      return;
    const meshObj = getMeshObject?.();
    if (!meshObj) return;

    const selectedVertexIndices = new Set<number>();
    if (currentSubObjectType === EditModes.vertex) {
      meshData.vertices.forEach((v: any) => {
        if (v.selected) selectedVertexIndices.add(v.index);
      });
    } else if (currentSubObjectType === EditModes.edge) {
      meshData.edges.forEach((e: any) => {
        if (e.selected)
          e.vertices.forEach((v: number) => selectedVertexIndices.add(v));
      });
    } else if (currentSubObjectType === EditModes.face) {
      meshData.faces.forEach((f: any) => {
        if (f.selected)
          f.vertices.forEach((v: number) => selectedVertexIndices.add(v));
      });
    }
    if (selectedVertexIndices.size === 0) return;

    const worldCenter = new THREE.Vector3();
    selectedVertexIndices.forEach((idx) => {
      const v = meshData.vertices[idx];
      if (!v) return;
      const local = new THREE.Vector3(
        v.position[0],
        v.position[1],
        v.position[2]
      );
      meshObj.localToWorld(local); // reliable conversion
      worldCenter.add(local);
    });
    worldCenter.multiplyScalar(1 / selectedVertexIndices.size);

    // Convert worldCenter into parent local space (parent of mesh & gizmo)
    const parent = meshObj.parent;
    if (parent) {
      const parentInv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
      const localCenter = worldCenter.clone().applyMatrix4(parentInv);
      helperGroupRef.current.position.copy(localCenter);
      helperGroupRef.current.updateMatrix();
      helperGroupRef.current.updateMatrixWorld(true);
      if (transformRef.current)
        transformRef.current.object = helperGroupRef.current;
    }
  });

  // Update gizmo position (legacy effect) -- now simplified, rely on frame updates
  useEffect(() => {
    if (transformRef.current && helperGroupRef.current) {
      transformRef.current.object = helperGroupRef.current;
    }
  }, [meshData, editMode, currentSubObjectType]);

  // Show/hide gizmo based on selection
  const hasSelection =
    meshData &&
    ((currentSubObjectType === EditModes.vertex &&
      meshData.vertices.some((v) => v.selected)) ||
      (currentSubObjectType === EditModes.edge &&
        meshData.edges.some((e) => e.selected)) ||
      (currentSubObjectType === EditModes.face &&
        meshData.faces.some((f) => f.selected)));

  const shouldShowGizmo =
    visible && hasSelection && MeshEditModes.includes(editMode);

  if (!shouldShowGizmo) return null;

  return (
    <>
      {/* Invisible helper object for transform controls */}
      <group ref={helperGroupRef} /* position now driven per-frame */>
        <mesh visible={false}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      {/* Transform Controls */}
      {helperGroupRef.current && (
        <TransformControls
          ref={transformRef}
          object={helperGroupRef.current}
          mode={mode}
          enabled={shouldShowGizmo}
          showX={true}
          showY={true}
          showZ={true}
          size={1}
          space="world"
          onObjectChange={handleTransformChange}
          onMouseDown={handleTransformStart}
          onMouseUp={handleTransformEnd}
        />
      )}
    </>
  );
};

export default TransformGizmo;

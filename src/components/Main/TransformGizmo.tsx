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

    // Capture starting local pivot position & world position
    pivotLocalStartRef.current = object.position.clone();
    const wp = new THREE.Vector3();
    object.getWorldPosition(wp);
    startWorldPosRef.current = wp.clone();

    onTransformStart?.();
  }, [onTransformStart]);

  const startWorldPosRef = useRef<THREE.Vector3 | null>(null);
  const pivotLocalStartRef = useRef<THREE.Vector3 | null>(null);

  // Handle transform change
  const handleTransformChange = useCallback(() => {
    if (!transformRef.current || !isTransforming) return;

    const object = transformRef.current.object as THREE.Object3D;
    const currentRotation = object.rotation;
    const currentScale = object.scale;

    // PURE LOCAL TRANSLATION (eliminates axis drift) ----------------------------------
    if (mode === "translate") {
      if (!pivotLocalStartRef.current)
        pivotLocalStartRef.current = object.position.clone();
      const currentLocalPos = object.position.clone();
      const deltaLocalVec = currentLocalPos
        .clone()
        .sub(pivotLocalStartRef.current);
      if (deltaLocalVec.lengthSq() !== 0) {
        const delta: Vector3Tuple = [
          deltaLocalVec.x,
          deltaLocalVec.y,
          deltaLocalVec.z,
        ];
        if (currentSubObjectType === EditModes.vertex) {
          moveVertices(
            delta,
            undefined,
            (
              pivotLocalStartRef.current as THREE.Vector3
            ).toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.edge) {
          moveEdges(
            delta,
            undefined,
            (
              pivotLocalStartRef.current as THREE.Vector3
            ).toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.face) {
          moveFaces(
            delta,
            undefined,
            (
              pivotLocalStartRef.current as THREE.Vector3
            ).toArray() as Vector3Tuple
          );
        }
        // Reset baseline to current for incremental deltas
        pivotLocalStartRef.current = currentLocalPos;
      }
      return; // translation handled
    }
    // -------------------------------------------------------------------------------

    if (!startValues.position) return; // for rotate/scale logic below

    if (mode === "rotate" && startValues.rotation) {
      const deltaRotation: Vector3Tuple = [
        currentRotation.x - startValues.rotation.x,
        currentRotation.y - startValues.rotation.y,
        currentRotation.z - startValues.rotation.z,
      ];
      if (deltaRotation[0] || deltaRotation[1] || deltaRotation[2]) {
        if (currentSubObjectType === EditModes.vertex) {
          rotateVertices(
            deltaRotation,
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.edge) {
          rotateEdges(
            deltaRotation,
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.face) {
          rotateFaces(
            deltaRotation,
            startValues.position.toArray() as Vector3Tuple
          );
        }
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
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.edge) {
          scaleEdges(
            scaleFactors,
            startValues.position.toArray() as Vector3Tuple
          );
        } else if (currentSubObjectType === EditModes.face) {
          scaleFaces(
            scaleFactors,
            startValues.position.toArray() as Vector3Tuple
          );
        }
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
  ]);

  // Handle transform end
  const handleTransformEnd = useCallback(() => {
    setIsTransforming(false);
    setStartValues({});
    onTransformEnd?.();
  }, [onTransformEnd]);

  // Frame update: compute selection center in mesh local space
  useFrame(() => {
    if (
      !helperGroupRef.current ||
      !meshData ||
      !MeshEditModes.includes(editMode)
    )
      return;

    // Do NOT recenter while actively transforming to keep stable pivot
    if (isTransforming) return;

    const meshObj = getMeshObject?.();
    if (!meshObj) return;

    // Ensure helper group is parented to mesh for local positioning
    if (helperGroupRef.current.parent !== meshObj) {
      meshObj.add(helperGroupRef.current);
    }

    const selected = new Set<number>();
    if (currentSubObjectType === EditModes.vertex) {
      meshData.vertices.forEach((v: any) => {
        if (v.selected) selected.add(v.index);
      });
    } else if (currentSubObjectType === EditModes.edge) {
      meshData.edges.forEach((e: any) => {
        if (e.selected) e.vertices.forEach((v: number) => selected.add(v));
      });
    } else if (currentSubObjectType === EditModes.face) {
      meshData.faces.forEach((f: any) => {
        if (f.selected) f.vertices.forEach((v: number) => selected.add(v));
      });
    }
    if (selected.size === 0) return;

    // Exact vertex position if single vertex selected, else average center
    const localCenter = new THREE.Vector3();
    if (selected.size === 1) {
      let only: number | undefined;
      selected.forEach((val) => {
        if (only === undefined) only = val;
      });
      if (only === undefined) return;
      const v = meshData.vertices[only];
      if (!v) return;
      localCenter.set(v.position[0], v.position[1], v.position[2]);
    } else {
      selected.forEach((idx) => {
        const v = meshData.vertices[idx];
        if (!v) return;
        localCenter.x += v.position[0];
        localCenter.y += v.position[1];
        localCenter.z += v.position[2];
      });
      localCenter.multiplyScalar(1 / selected.size);
    }

    helperGroupRef.current.position.copy(localCenter);
    helperGroupRef.current.updateMatrix();
    helperGroupRef.current.updateMatrixWorld(true);
    if (transformRef.current) {
      transformRef.current.object = helperGroupRef.current;
      // Force sync of control position
      if (transformRef.current.updateMatrixWorld) {
        transformRef.current.object.updateWorldMatrix?.(true, false);
        transformRef.current.updateMatrixWorld(true);
      }
    }
  });

  // Update gizmo position (legacy effect) -- now simplified, rely on frame updates
  useEffect(() => {
    if (transformRef.current && helperGroupRef.current) {
      const meshObj = getMeshObject?.();
      if (meshObj && helperGroupRef.current.parent !== meshObj) {
        meshObj.add(helperGroupRef.current);
      }
      transformRef.current.object = helperGroupRef.current;
    }
    return () => {
      const meshObj = getMeshObject?.();
      if (
        meshObj &&
        helperGroupRef.current &&
        helperGroupRef.current.parent === meshObj
      ) {
        meshObj.remove(helperGroupRef.current);
      }
    };
  }, [meshData, editMode, currentSubObjectType, getMeshObject]);

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
      <group
        ref={
          helperGroupRef
        } /* now parented under mesh; position set in local space */
      >
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

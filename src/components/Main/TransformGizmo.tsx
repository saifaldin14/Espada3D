import React, { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TransformControls } from "@react-three/drei";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { useMeshEditor } from "../../hooks/useMeshEditor";
import { Vector3Tuple, TransformConstraint } from "../../types";

interface TransformGizmoProps {
  modelId: string;
  visible: boolean;
  mode: "translate" | "rotate" | "scale";
  onTransformStart?: () => void;
  onTransformEnd?: () => void;
}

const TransformGizmo: React.FC<TransformGizmoProps> = ({
  modelId,
  visible,
  mode,
  onTransformStart,
  onTransformEnd,
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

  const { moveVertices, scaleVertices, rotateVertices } =
    useMeshEditor(modelId);

  // Calculate selection center for gizmo positioning
  const selectionCenter = React.useMemo(() => {
    if (!meshData || !["vertex", "edge", "face"].includes(editMode)) {
      return new THREE.Vector3(0, 0, 0);
    }

    let selectedElements: any[] = [];
    if (currentSubObjectType === "vertex") {
      selectedElements = meshData.vertices.filter((v) => v.selected);
    } else if (currentSubObjectType === "edge") {
      selectedElements = meshData.edges.filter((e) => e.selected);
    } else if (currentSubObjectType === "face") {
      selectedElements = meshData.faces.filter((f) => f.selected);
    }

    if (selectedElements.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const center = new THREE.Vector3();
    let count = 0;

    if (currentSubObjectType === "vertex") {
      selectedElements.forEach((vertex) => {
        center.add(new THREE.Vector3().fromArray(vertex.position));
        count++;
      });
    } else if (currentSubObjectType === "edge") {
      selectedElements.forEach((edge) => {
        edge.vertices.forEach((vIndex: number) => {
          const vertex = meshData.vertices[vIndex];
          if (vertex) {
            center.add(new THREE.Vector3().fromArray(vertex.position));
            count++;
          }
        });
      });
    } else if (currentSubObjectType === "face") {
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

    onTransformStart?.();
  }, [onTransformStart]);

  // Handle transform change
  const handleTransformChange = useCallback(() => {
    if (!transformRef.current || !isTransforming || !startValues.position)
      return;

    const object = transformRef.current.object;
    const currentPosition = object.position;
    const currentRotation = object.rotation;
    const currentScale = object.scale;

    if (mode === "translate" && startValues.position) {
      const delta: Vector3Tuple = [
        currentPosition.x - startValues.position.x,
        currentPosition.y - startValues.position.y,
        currentPosition.z - startValues.position.z,
      ];

      // Apply the translation to selected vertices
      if (delta[0] !== 0 || delta[1] !== 0 || delta[2] !== 0) {
        moveVertices(
          delta,
          undefined,
          startValues.position.toArray() as Vector3Tuple
        );

        // Reset position for next delta calculation
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
        rotateVertices(
          deltaRotation,
          startValues.position?.toArray() as Vector3Tuple
        );

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
        scaleVertices(
          scaleFactors,
          undefined,
          startValues.position?.toArray() as Vector3Tuple
        );

        // Reset scale for next delta calculation
        setStartValues({ ...startValues, scale: currentScale.clone() });
      }
    }
  }, [
    mode,
    isTransforming,
    startValues,
    moveVertices,
    rotateVertices,
    scaleVertices,
  ]);

  // Handle transform end
  const handleTransformEnd = useCallback(() => {
    setIsTransforming(false);
    setStartValues({});
    onTransformEnd?.();
  }, [onTransformEnd]);

  // Update gizmo position
  useEffect(() => {
    if (transformRef.current && helperGroupRef.current) {
      helperGroupRef.current.position.copy(selectionCenter);
      transformRef.current.object = helperGroupRef.current;
    }
  }, [selectionCenter]);

  // Show/hide gizmo based on selection
  const hasSelection =
    meshData &&
    ((currentSubObjectType === "vertex" &&
      meshData.vertices.some((v) => v.selected)) ||
      (currentSubObjectType === "edge" &&
        meshData.edges.some((e) => e.selected)) ||
      (currentSubObjectType === "face" &&
        meshData.faces.some((f) => f.selected)));

  const shouldShowGizmo =
    visible && hasSelection && ["vertex", "edge", "face"].includes(editMode);

  if (!shouldShowGizmo) return null;

  return (
    <>
      {/* Invisible helper object for transform controls */}
      <group ref={helperGroupRef} position={selectionCenter}>
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

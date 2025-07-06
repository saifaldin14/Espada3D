import React, { useRef, useEffect, useMemo } from "react";
import {
  Mesh,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Group,
} from "three";
import { useFrame } from "@react-three/fiber";
import { APP_CONFIG } from "../../config/constants";

interface ModelHighlightProps {
  mesh: Mesh | null;
  isSelected: boolean;
  isHovered: boolean;
}

const ModelHighlight: React.FC<ModelHighlightProps> = ({
  mesh,
  isSelected,
  isHovered,
}) => {
  const outlineRef = useRef<LineSegments>(null);
  const groupRef = useRef<Group>(null);

  // Create outline geometry and material
  const { edgesGeometry, outlineMaterial } = useMemo(() => {
    if (!mesh) return { edgesGeometry: null, outlineMaterial: null };

    const edgesGeometry = new EdgesGeometry(mesh.geometry);
    const outlineMaterial = new LineBasicMaterial({
      color: APP_CONFIG.MATERIALS.OUTLINE_COLOR,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });

    return { edgesGeometry, outlineMaterial };
  }, [mesh]);

  // Update outline visibility and animation
  useEffect(() => {
    if (!outlineRef.current || !groupRef.current) return;

    const shouldShow = isSelected || isHovered;
    outlineRef.current.visible = shouldShow;

    if (shouldShow && mesh) {
      // Copy transform from the original mesh
      groupRef.current.position.copy(mesh.position);
      groupRef.current.rotation.copy(mesh.rotation);
      groupRef.current.scale.copy(mesh.scale);

      // Slightly scale up for outline effect
      groupRef.current.scale.multiplyScalar(isSelected ? 1.02 : 1.01);
    }
  }, [mesh, isSelected, isHovered]);

  // Animate the outline for selected models
  useFrame((state) => {
    if (!outlineRef.current || !isSelected) return;

    const time = state.clock.getElapsedTime();
    const material = outlineRef.current.material as LineBasicMaterial;
    material.opacity = 0.5 + Math.sin(time * 3) * 0.3; // Pulsing effect
  });

  // Cleanup
  useEffect(() => {
    return () => {
      edgesGeometry?.dispose();
      outlineMaterial?.dispose();
    };
  }, [edgesGeometry, outlineMaterial]);

  if (!mesh || !edgesGeometry || !outlineMaterial) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <lineSegments
        ref={outlineRef}
        geometry={edgesGeometry}
        material={outlineMaterial}
        renderOrder={999}
        visible={false}
      />
    </group>
  );
};

export default ModelHighlight;

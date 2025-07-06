import React, { useState, useRef, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, Raycaster, Vector2 } from "three";
import ModelHighlight from "./ModelHighlight";
import { useModels } from "../../hooks/useRedux";
import { ModelMetadata } from "../../types";

interface InteractiveModelProps {
  modelGroup: Group;
  modelId: string;
  metadata: ModelMetadata;
  children?: React.ReactNode;
}

const InteractiveModel: React.FC<InteractiveModelProps> = ({
  modelGroup,
  modelId,
  metadata,
  children,
}) => {
  const { selectedModelId, selectModelById } = useModels();
  const [isHovered, setIsHovered] = useState(false);
  const meshRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();

  const isSelected = selectedModelId === modelId;

  // Handle model selection
  const handleClick = useCallback(
    (event: any) => {
      event.stopPropagation();
      selectModelById(modelId);
    },
    [modelId, selectModelById]
  );

  // Handle hover states
  const handlePointerOver = useCallback(
    (event: any) => {
      event.stopPropagation();
      setIsHovered(true);
      gl.domElement.style.cursor = "pointer";
    },
    [gl]
  );

  const handlePointerOut = useCallback(
    (event: any) => {
      event.stopPropagation();
      setIsHovered(false);
      gl.domElement.style.cursor = "default";
    },
    [gl]
  );

  // Update transform based on metadata
  useFrame(() => {
    if (modelGroup) {
      modelGroup.position.set(
        metadata.position[0],
        metadata.position[1],
        metadata.position[2]
      );
      modelGroup.rotation.set(
        metadata.rotation[0],
        metadata.rotation[1],
        metadata.rotation[2]
      );
      modelGroup.scale.set(
        metadata.scale[0],
        metadata.scale[1],
        metadata.scale[2]
      );
    }
  });

  return (
    <group>
      <primitive
        ref={meshRef}
        object={modelGroup}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      <ModelHighlight
        mesh={modelGroup.children[0] as Mesh}
        isSelected={isSelected}
        isHovered={isHovered}
      />
      {children}
    </group>
  );
};

export default InteractiveModel;

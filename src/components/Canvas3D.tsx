import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSelector, useDispatch } from 'react-redux';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { ModelProvider } from './ModelContext';
import { ModelMetadata, updateModelTransform, Vector3Tuple } from '../store/slices/modelSlice';

interface Canvas3DProps {
    selectedModel: Group | null;
}

const Canvas3D: React.FC<Canvas3DProps> = ({ selectedModel }) => {
    const modelsMetadata = useSelector((state: any) => state.models.models) as ModelMetadata[];
    const selectedModelId = useSelector((state: any) => state.models.selectedModelId);
  const dispatch = useDispatch();

  const [models, setModels] = useState<{ [id: string]: Group }>({});

  useEffect(() => {
    // Create Three.js objects based on model metadata when the component mounts
    const newModels: { [id: string]: Group } = {};
    modelsMetadata.forEach((meta: ModelMetadata) => {
      const geometry = new BoxGeometry(1, 1, 1); // Example: Create a box geometry
      const material = new MeshStandardMaterial({ color: 0x00ff00 });
      const mesh = new Mesh(geometry, material);
      const group = new Group();
      group.add(mesh);
      group.position.set(...meta.position);
      group.rotation.set(...meta.rotation);
      group.scale.set(...meta.scale);
      newModels[meta.id] = group;
    });
    setModels(newModels);
  }, [modelsMetadata]);

  const handleTransformChange = (id: string, position: Vector3Tuple, rotation: Vector3Tuple, scale: Vector3Tuple) => {
    dispatch(updateModelTransform({ id, position, rotation, scale }));
    const model = models[id];
    if (model) {
      model.position.set(...position);
      model.rotation.set(...rotation);
      model.scale.set(...scale);
    }
  };

  return (
    <Canvas>
        <ModelProvider selectedModel={selectedModel}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {Object.values(models).map((model, index) => (
          <primitive object={model} key={index} />
        ))}
      </ModelProvider>
    </Canvas>
  );
};

export default Canvas3D;
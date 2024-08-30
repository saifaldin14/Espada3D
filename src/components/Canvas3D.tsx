import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { useSelector } from 'react-redux';
import { Group, BoxGeometry, Mesh, MeshStandardMaterial } from 'three';
import { ModelProvider } from './ModelContext';
import { ModelMetadata } from '../store/slices/modelSlice';
import SceneContent from './SceneContent';

interface Canvas3DProps {
  selectedModel: Group | null;
}

const Canvas3D: React.FC<Canvas3DProps> = ({ selectedModel }) => {
  const modelsMetadata = useSelector((state: any) => state.models.models) as ModelMetadata[];
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const [models, setModels] = useState<{ [id: string]: Group }>({});

  useEffect(() => {
    const newModels = { ...models }; // Start with the current models

    modelsMetadata.forEach((meta: ModelMetadata) => {
      if (!newModels[meta.id]) {  // Only add new models that don't already exist
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshStandardMaterial({ color: 0x00ff00 });
        const mesh = new Mesh(geometry, material);
        const group = new Group();
        group.add(mesh);
        group.position.set(...meta.position);
        group.rotation.set(...meta.rotation);
        group.scale.set(...meta.scale);
        newModels[meta.id] = group;
      }
    });

    setModels(newModels);  // Update state with the new merged models
  }, [modelsMetadata]);

  return (
    <Canvas>
      <ModelProvider selectedModel={selectedModel}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <SceneContent models={models} selectedModel={selectedModel} activeTool={activeTool} />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewcube />
        </GizmoHelper>
      </ModelProvider>
    </Canvas>
  );
};

export default Canvas3D;
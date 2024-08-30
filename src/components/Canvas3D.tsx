import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSelector } from 'react-redux';
import { Group } from 'three';
import { ModelProvider } from './ModelContext';

interface Canvas3DProps {
  selectedModel: Group | null;
}

const Canvas3D: React.FC<Canvas3DProps> = ({ selectedModel }) => {
  const models = useSelector((state: any) => state.models.models);

  return (
    <Canvas>
      <ModelProvider selectedModel={selectedModel}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {models.map((model: Group, index: number) => (
          <primitive object={model} key={index} />
        ))}
      </ModelProvider>
    </Canvas>
  );
};

export default Canvas3D;

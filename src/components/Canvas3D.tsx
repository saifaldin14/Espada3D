import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ModelProvider } from './ModelContext';
import { Group } from 'three';

const Canvas3D: React.FC<{ selectedModel: Group | null }> = ({ selectedModel }) => {
  return (
    <Canvas>
      <ModelProvider selectedModel={selectedModel}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {/* Models and other components will be rendered here */}
      </ModelProvider>
    </Canvas>
  );
};

export default Canvas3D;
